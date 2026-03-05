import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TenantPlan } from '../tenant/tenantModel';

// ─── Per-Plan Rate Limits ─────────────────────────────────────────────────────
// Requests per window. Window = 1 minute.
const PLAN_LIMITS: Record<TenantPlan, number> = {
  free: 100,
  pro: 500,
  enterprise: 2000
};

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

// ─── In-Memory Sliding Window Store ───────────────────────────────────────────
// Each tenant gets a bucket: { count, windowStart }
// In production with multiple instances, replace with Redis (e.g. ioredis).
interface RateBucket {
  count: number;
  windowStart: number;
}

const tenantBuckets = new Map<string, RateBucket>();

// Cleanup stale buckets every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of tenantBuckets.entries()) {
    if (now - bucket.windowStart > DEFAULT_WINDOW_MS * 2) {
      tenantBuckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // .unref() so the timer doesn't prevent process exit

/**
 * Resolves the tenant plan from the request.
 * Checks req.tenant first (set by validateTenant middleware),
 * then falls back to a default.
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
 * - Authenticated users with tenantId: keyed by tenantId
 * - Authenticated users without tenantId (superadmin): no limit
 * - Unauthenticated requests: keyed by IP
 */
function resolveKey(req: AuthenticatedRequest): { key: string; isTenant: boolean } | null {
  const user = req.user;

  if (user) {
    const isSuperAdmin =
      user.role?.name === 'SUPER_ADMIN' || user.role?.name === 'Super Admin';
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
 * Per-tenant rate limiting middleware.
 *
 * Rate limits are keyed by tenantId (not just IP) so that all users
 * within the same organization share a single rate budget.
 *
 * Plan tiers:
 *   free       = 100 requests/minute
 *   pro        = 500 requests/minute
 *   enterprise = 2000 requests/minute
 *
 * Superadmin users are exempt from rate limiting.
 *
 * Must be placed AFTER authenticateUser and (ideally) validateTenant
 * in the middleware chain.
 */
export const tenantRateLimit = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const resolved = resolveKey(req);
  if (!resolved) {
    // Superadmin or unresolvable — skip rate limiting
    return next();
  }

  const { key, isTenant } = resolved;
  const plan = isTenant ? resolvePlan(req) : 'free';
  const maxRequests = PLAN_LIMITS[plan];
  const now = Date.now();

  let bucket = tenantBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= DEFAULT_WINDOW_MS) {
    // New window
    bucket = { count: 1, windowStart: now };
    tenantBuckets.set(key, bucket);
  } else {
    bucket.count++;
  }

  // Standard rate limit headers
  const remaining = Math.max(0, maxRequests - bucket.count);
  const resetTime = Math.ceil((bucket.windowStart + DEFAULT_WINDOW_MS) / 1000);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);
  if (isTenant) {
    res.setHeader('X-RateLimit-Plan', plan);
  }

  if (bucket.count > maxRequests) {
    const retryAfterSec = Math.ceil((bucket.windowStart + DEFAULT_WINDOW_MS - now) / 1000);
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
 * Useful for specific endpoints (e.g., export, AI) that need stricter limits.
 *
 * @param overrides - Per-plan overrides. Unspecified plans use defaults.
 * @param windowMs - Custom window in milliseconds. Defaults to 1 minute.
 */
export function createTenantRateLimit(
  overrides: Partial<Record<TenantPlan, number>>,
  windowMs = DEFAULT_WINDOW_MS
) {
  const limits: Record<TenantPlan, number> = {
    free: overrides.free ?? PLAN_LIMITS.free,
    pro: overrides.pro ?? PLAN_LIMITS.pro,
    enterprise: overrides.enterprise ?? PLAN_LIMITS.enterprise
  };

  const store = new Map<string, RateBucket>();

  // Cleanup for this custom store
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (now - bucket.windowStart > windowMs * 2) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  cleanup.unref();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const resolved = resolveKey(req);
    if (!resolved) return next();

    const { key, isTenant } = resolved;
    const plan = isTenant ? resolvePlan(req) : 'free';
    const maxRequests = limits[plan];
    const now = Date.now();

    let bucket = store.get(key);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { count: 1, windowStart: now };
      store.set(key, bucket);
    } else {
      bucket.count++;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetTime = Math.ceil((bucket.windowStart + windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
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
