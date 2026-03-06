import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

const METRICS_TTL = 86400; // 24 hours in seconds
const BUCKET_SIZE = 60; // 1-minute buckets

/**
 * Get the current time bucket key (floored to the nearest minute)
 */
function getTimeBucket(): number {
  return Math.floor(Date.now() / 1000 / BUCKET_SIZE) * BUCKET_SIZE;
}

/**
 * Normalize endpoint paths - replace dynamic segments with :param
 */
function normalizeEndpoint(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id') // numeric IDs
    .replace(/\?.*$/, ''); // strip query strings
}

/**
 * Metrics collection middleware.
 * Tracks request count, response time, and status codes per endpoint.
 * Data is stored in Redis with a 24-hour TTL.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Skip metrics collection for health/monitoring endpoints to avoid noise
  if (req.path.startsWith('/api/health') || req.path.startsWith('/api/monitoring')) {
    next();
    return;
  }

  // Hook into res.end to capture metrics after response completes
  const originalEnd = res.end;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const endpoint = normalizeEndpoint(req.path);
    const bucket = getTimeBucket();

    // Fire-and-forget: do not await Redis writes in the request path
    recordMetrics(bucket, method, endpoint, statusCode, duration).catch(() => {
      // Silently ignore Redis write failures to avoid impacting requests
    });

    // eslint-disable-next-line prefer-spread, @typescript-eslint/no-unsafe-function-type
    return (originalEnd as Function).apply(this, args);
  };

  next();
}

async function recordMetrics(bucket: number, method: string, endpoint: string, statusCode: number, duration: number): Promise<void> {
  try {
    if (!redisClient.isReady) return;

    const pipeline = redisClient.multi();

    // 1. Total requests per time bucket
    const requestKey = `metrics:requests:${bucket}`;
    pipeline.incrBy(requestKey, 1);
    pipeline.expire(requestKey, METRICS_TTL);

    // 2. Error count per time bucket (4xx and 5xx)
    if (statusCode >= 400) {
      const errorKey = `metrics:errors:${bucket}`;
      pipeline.incrBy(errorKey, 1);
      pipeline.expire(errorKey, METRICS_TTL);
    }

    // 3. Status code distribution per bucket
    const statusBucketKey = `metrics:status:${bucket}`;
    pipeline.hIncrBy(statusBucketKey, String(statusCode), 1);
    pipeline.expire(statusBucketKey, METRICS_TTL);

    // 4. Response time per endpoint (sorted set - score = total time, used for averaging)
    const endpointKey = `metrics:endpoint:${method}:${endpoint}`;
    pipeline.hIncrBy(endpointKey, 'count', 1);
    pipeline.hIncrBy(endpointKey, 'totalTime', duration);
    if (duration > 0) {
      // Track max response time
      const currentMax = await redisClient.hGet(endpointKey, 'maxTime');
      if (!currentMax || duration > parseInt(currentMax as string, 10)) {
        pipeline.hSet(endpointKey, 'maxTime', duration);
      }
    }
    pipeline.expire(endpointKey, METRICS_TTL);

    // 5. Per-bucket response time tracking (for timeline charts)
    const rtKey = `metrics:rt:${bucket}`;
    pipeline.lPush(rtKey, String(duration));
    pipeline.expire(rtKey, METRICS_TTL);

    // 6. Track active endpoints in a set
    pipeline.sAdd('metrics:endpoints', `${method}:${endpoint}`);
    pipeline.expire('metrics:endpoints', METRICS_TTL);

    await pipeline.exec();
  } catch {
    // Silently fail - metrics should never break the app
  }
}
