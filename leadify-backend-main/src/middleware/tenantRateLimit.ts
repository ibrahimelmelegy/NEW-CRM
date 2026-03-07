import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TenantPlan } from '../tenant/tenantModel';
import redisClient from '../config/redis';

// ─── Per-Plan Rate Limits ─────────────────────────────────────────────────────
// Requests per window. Window = 1 minute.
const PLAN_LIMITS: Record<TenantPlan, number> = {
  free: 100,
  pro: 500,
  enterprise: 2000
};

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

// ─── In-Memory Fallback ──────────────────────────────────────────────────────
// Used only when Redis is unavailable
interface RateBucket {
  count: number;
  windowStart: number;
}
const fallbackBuckets = new Map<string, RateBucket>();

// Cleanup stale fallback buckets every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of fallbackBuckets.entries()) {
    if (now - bucket.windowStart > DEFAULT_WINDOW_MS * 2) {
      fallbackBuckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);
cleanupInterval.unref();
process.on('SIGTERM', () => clearInterval(cleanupInterval));

/**
 * Resolves the tenant plan from the request.
 */
function resolvePlan(req: AuthenticatedRequest): TenantPlan {
  const tenant = req.tenant;
  if (tenant?.plan && PLAN_LIMITS[tenant.plan] !== undefined) {
    return tenant.plan;
  }
  return 'free';
}

/**
 * Resolves the rate limit key.
 */
function resolveKey(req: AuthenticatedRequest): { key: string; isTenant: boolean } | null {
  const user = req.user;

  if (user) {
    const isSuperAdmin = user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'Super Admin';
    if (isSuperAdmin) {
      return null; // No rate limit for superadmin
    }

    if (user.tenantId) {
      return { key: `tenant:${user.tenantId}`, isTenant: true };
    }
  }

  // Fallback to IP-based limiting for unauthenticated or non-tenant requests
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return { key: `ip:${ip}`, isTenant: false };
}

/**
 * Check rate limit using Redis. Falls back to in-memory if Redis is unavailable.
 */
async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<{ count: number; windowStart: number }> {
  try {
    if (redisClient.isReady) {
      const redisKey = `ratelimit:${key}`;
      const count = await redisClient.incr(redisKey);
      if (count === 1) {
        // New key - set TTL
        await redisClient.pExpire(redisKey, windowMs);
      }
      const ttl = await redisClient.pTTL(redisKey);
      const windowStart = Date.now() - (windowMs - Math.max(ttl, 0));
      return { count, windowStart };
    }
  } catch {
    // Redis unavailable - fall through to in-memory
  }

  // In-memory fallback
  const now = Date.now();
  let bucket = fallbackBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 1, windowStart: now };
    fallbackBuckets.set(key, bucket);
  } else {
    bucket.count++;
  }
  return bucket;
}

/**
 * Per-tenant rate limiting middleware.
 *
 * Uses Redis for shared state across instances. Falls back to in-memory when Redis is unavailable.
 *
 * Plan tiers:
 *   free       = 100 requests/minute
 *   pro        = 500 requests/minute
 *   enterprise = 2000 requests/minute
 *
 * Superadmin users are exempt from rate limiting.
 */
export const tenantRateLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const resolved = resolveKey(req);
  if (!resolved) {
    return next();
  }

  const { key, isTenant } = resolved;
  const plan = isTenant ? resolvePlan(req) : 'free';
  const maxRequests = PLAN_LIMITS[plan];

  const { count, windowStart } = await checkRateLimit(key, maxRequests, DEFAULT_WINDOW_MS);

  // Standard rate limit headers
  const remaining = Math.max(0, maxRequests - count);
  const resetTime = Math.ceil((windowStart + DEFAULT_WINDOW_MS) / 1000);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);
  if (isTenant) {
    res.setHeader('X-RateLimit-Plan', plan);
  }

  if (count > maxRequests) {
    const retryAfterSec = Math.ceil((windowStart + DEFAULT_WINDOW_MS - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfterSec);
    res.status(429).json({
      message: `Rate limit exceeded. Your plan (${plan}) allows ${maxRequests} requests per minute. Please try again in ${retryAfterSec} seconds.`,
      plan,
      limit: maxRequests,
      retryAfter: retryAfterSec
    });
    return;
  }

  next();
};

/**
 * Creates a tenant-aware rate limiter with custom limits.
 */
export function createTenantRateLimit(overrides: Partial<Record<TenantPlan, number>>, windowMs = DEFAULT_WINDOW_MS) {
  const limits: Record<TenantPlan, number> = {
    free: overrides.free ?? PLAN_LIMITS.free,
    pro: overrides.pro ?? PLAN_LIMITS.pro,
    enterprise: overrides.enterprise ?? PLAN_LIMITS.enterprise
  };

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const resolved = resolveKey(req);
    if (!resolved) return next();

    const { key, isTenant } = resolved;
    const plan = isTenant ? resolvePlan(req) : 'free';
    const maxRequests = limits[plan];

    const { count, windowStart } = await checkRateLimit(`custom:${key}`, maxRequests, windowMs);

    const remaining = Math.max(0, maxRequests - count);
    const resetTime = Math.ceil((windowStart + windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (count > maxRequests) {
      const retryAfterSec = Math.ceil((windowStart + windowMs - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        message: `Rate limit exceeded for this endpoint. Plan (${plan}) allows ${maxRequests} requests per window. Retry in ${retryAfterSec}s.`,
        plan,
        limit: maxRequests,
        retryAfter: retryAfterSec
      });
      return;
    }

    next();
  };
}
