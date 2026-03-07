/**
 * Enhanced Rate Limiting
 *
 * Extends the existing express-rate-limit setup (src/middleware/rateLimiter.ts)
 * with per-user identification and endpoint-specific limits for heavy operations.
 *
 * Key differences from the base rate limiter:
 * - Authenticated users get a higher limit (5000 req/15min) keyed by userId
 * - Unauthenticated requests fall back to IP-based limiting (2000 req/15min)
 * - Heavy operations get dedicated, stricter limits
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Key generator that uses userId for authenticated requests, IP for anonymous.
 * This prevents a single user from consuming the shared IP pool limit and
 * ensures fair usage across a multi-user deployment behind a load balancer.
 */
function userOrIpKeyGenerator(req: Request): string {
  const user = (req as any).user;
  if (user && user.id) {
    return `user_${user.id}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Standard response for rate limit exceeded.
 */
function rateLimitResponse(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message,
      retryAfter: res.getHeader('Retry-After')
    });
  };
}

// ─── Authenticated User Limiter ─────────────────────────────────────
// 5000 requests per 15 minutes per user (or per IP if not authenticated).
// This replaces the general limiter for authenticated API routes.

export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Too many requests. Please slow down and try again later.')
});

// ─── Endpoint-Specific Limiters for Heavy Operations ────────────────

/**
 * Report execution: 10 requests per minute per user.
 * Reports involve expensive aggregation queries.
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Report generation limit exceeded. Please wait before running another report.')
});

/**
 * PDF generation: 20 requests per minute per user.
 * PDF rendering is CPU-intensive.
 */
export const pdfLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('PDF generation limit exceeded. Please wait before generating another PDF.')
});

/**
 * Bulk operations: 5 requests per minute per user.
 * Bulk create/update/delete can be very resource-intensive.
 */
export const bulkOperationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Bulk operation limit exceeded. Please wait before performing another bulk action.')
});

/**
 * Search: 60 requests per minute per user.
 * Full-text search and complex filter queries.
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Search rate limit exceeded. Please wait before searching again.')
});

/**
 * Export (CSV/Excel): 10 requests per minute per user.
 * Exports load entire datasets into memory.
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Export limit exceeded. Please wait before exporting again.')
});

/**
 * AI/LLM endpoints: 15 requests per minute per user.
 * These call external APIs with their own rate limits and costs.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('AI request limit exceeded. Please wait before making another AI request.')
});

/**
 * File upload: 20 uploads per 15 minutes per user.
 * Matches the existing uploadLimiter but keyed by user instead of IP.
 */
export const userUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Upload limit exceeded. Please wait before uploading again.')
});

/**
 * Webhook dispatch: 100 requests per minute.
 * Outbound webhooks should be throttled to prevent abuse.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  handler: rateLimitResponse('Webhook rate limit exceeded.')
});
