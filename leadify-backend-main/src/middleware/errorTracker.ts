import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import { AuthenticatedRequest } from '../types';

const ERROR_LOG_KEY = 'metrics:error_log';
const ERROR_LOG_MAX_SIZE = 500; // Keep last 500 errors
const ERROR_LOG_TTL = 86400 * 7; // 7 days

export interface TrackedError {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Error tracking middleware.
 * Must be registered AFTER routes but BEFORE the main error handler,
 * so it can intercept errors, log them, then pass them through.
 */
export function errorTracker(err: Error, req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const statusCode = (err as Error & { statusCode?: number }).statusCode || 500;

  // Only track server errors (5xx) and significant client errors (4xx excluding 401/404)
  const shouldTrack = statusCode >= 500 || (statusCode >= 400 && statusCode !== 401 && statusCode !== 404);

  if (shouldTrack) {
    const errorEntry: TrackedError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      message: err.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      userId: authReq.user?.id ? String(authReq.user.id) : undefined,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress
    };

    // Fire-and-forget
    storeError(errorEntry).catch(() => {
      // Silently ignore
    });
  }

  // Always pass the error to the next handler
  next(err);
}

async function storeError(entry: TrackedError): Promise<void> {
  try {
    if (!redisClient.isReady) return;

    const pipeline = redisClient.multi();

    // Push to the error log list
    pipeline.lPush(ERROR_LOG_KEY, JSON.stringify(entry));

    // Trim to max size
    pipeline.lTrim(ERROR_LOG_KEY, 0, ERROR_LOG_MAX_SIZE - 1);

    // Set TTL
    pipeline.expire(ERROR_LOG_KEY, ERROR_LOG_TTL);

    // Increment error count by type
    const errorTypeKey = `metrics:error_type:${entry.statusCode}`;
    pipeline.incrBy(errorTypeKey, 1);
    pipeline.expire(errorTypeKey, 86400);

    await pipeline.exec();
  } catch {
    // Silently fail
  }
}
