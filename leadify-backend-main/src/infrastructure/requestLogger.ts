/**
 * Request Logger Middleware
 *
 * Logs API requests for performance monitoring with:
 * - Method, path, status code, duration (ms)
 * - User ID (if authenticated)
 * - Client IP address
 * - Slow query detection (> 2000ms)
 *
 * Stores metrics in an in-memory ring buffer and flushes
 * summary statistics to the console periodically.
 * Does NOT log request/response bodies to avoid leaking sensitive data.
 */

import { Request, Response, NextFunction } from 'express';

// ─── Types ──────────────────────────────────────────────────────────

interface RequestLogEntry {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: number | string;
  ip: string;
  timestamp: number;
  slow: boolean;
}

interface EndpointStats {
  count: number;
  totalMs: number;
  maxMs: number;
  slowCount: number;
  errors: number; // 4xx + 5xx
}

// ─── Configuration ──────────────────────────────────────────────────

const SLOW_THRESHOLD_MS = 2000;
const BUFFER_SIZE = 10000; // Max entries in the ring buffer
const FLUSH_INTERVAL_MS = 60000; // Summary flush interval (1 minute)
const SLOW_LOG_IMMEDIATE = true; // Log slow requests immediately to stderr

// ─── Ring Buffer ────────────────────────────────────────────────────

class RingBuffer<T> {
  private buffer: T[];
  private writeIndex = 0;
  private count = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  getAll(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    // Buffer is full: return in chronological order
    return [...this.buffer.slice(this.writeIndex), ...this.buffer.slice(0, this.writeIndex)];
  }

  clear(): void {
    this.writeIndex = 0;
    this.count = 0;
  }

  get size(): number {
    return this.count;
  }
}

// ─── Metrics Collector ──────────────────────────────────────────────

class RequestMetrics {
  private buffer: RingBuffer<RequestLogEntry>;
  private endpointStats: Map<string, EndpointStats> = new Map();
  private periodStart: number = Date.now();

  // Aggregate counters (never reset)
  private totalRequests = 0;
  private totalSlowRequests = 0;
  private totalErrors = 0;

  constructor() {
    this.buffer = new RingBuffer(BUFFER_SIZE);
  }

  record(entry: RequestLogEntry): void {
    this.buffer.push(entry);
    this.totalRequests++;

    if (entry.slow) this.totalSlowRequests++;
    if (entry.statusCode >= 400) this.totalErrors++;

    // Aggregate per endpoint (method + path pattern)
    const key = `${entry.method} ${this.normalizePath(entry.path)}`;
    const stats = this.endpointStats.get(key) || {
      count: 0,
      totalMs: 0,
      maxMs: 0,
      slowCount: 0,
      errors: 0
    };

    stats.count++;
    stats.totalMs += entry.durationMs;
    if (entry.durationMs > stats.maxMs) stats.maxMs = entry.durationMs;
    if (entry.slow) stats.slowCount++;
    if (entry.statusCode >= 400) stats.errors++;

    this.endpointStats.set(key, stats);
  }

  /**
   * Normalize path by replacing UUIDs and numeric IDs with placeholders.
   * This groups "/api/lead/abc-123-def" and "/api/lead/xyz-456-ghi" together.
   */
  private normalizePath(path: string): string {
    return (
      path
        // Replace UUIDs
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        // Replace numeric IDs
        .replace(/\/\d+/g, '/:id')
    );
  }

  /**
   * Generate and log a summary of recent activity.
   * Called periodically by the flush timer.
   */
  flush(): void {
    const now = Date.now();
    const periodMs = now - this.periodStart;
    const periodSec = Math.max(periodMs / 1000, 1);
    this.periodStart = now;

    const entries = this.buffer.getAll();
    const recentEntries = entries.filter(e => e.timestamp > now - FLUSH_INTERVAL_MS);

    if (recentEntries.length === 0) return;

    const avgDuration = recentEntries.reduce((sum, e) => sum + e.durationMs, 0) / recentEntries.length;
    const slowCount = recentEntries.filter(e => e.slow).length;
    const errorCount = recentEntries.filter(e => e.statusCode >= 400).length;
    const rps = (recentEntries.length / periodSec).toFixed(1);

    console.log(
      `[RequestLogger] Period: ${recentEntries.length} reqs, ` +
        `${rps} req/s, avg ${avgDuration.toFixed(0)}ms, ` +
        `${slowCount} slow, ${errorCount} errors`
    );

    // Log top 5 slowest endpoints
    const sorted = Array.from(this.endpointStats.entries())
      .filter(([_, s]) => s.count > 0)
      .sort((a, b) => b[1].totalMs / b[1].count - a[1].totalMs / a[1].count)
      .slice(0, 5);

    if (sorted.length > 0 && sorted[0][1].totalMs / sorted[0][1].count > 500) {
      console.log('[RequestLogger] Slowest endpoints:');
      for (const [endpoint, stats] of sorted) {
        const avg = (stats.totalMs / stats.count).toFixed(0);
        console.log(`  ${endpoint}: avg ${avg}ms, max ${stats.maxMs}ms, ` + `${stats.count} calls, ${stats.slowCount} slow`);
      }
    }
  }

  /**
   * Get current metrics snapshot (for health/monitoring endpoints).
   */
  getSnapshot() {
    const entries = this.buffer.getAll();
    const recentEntries = entries.filter(e => e.timestamp > Date.now() - 60000);

    return {
      totalRequests: this.totalRequests,
      totalSlowRequests: this.totalSlowRequests,
      totalErrors: this.totalErrors,
      lastMinute: {
        requests: recentEntries.length,
        avgDurationMs: recentEntries.length > 0 ? Math.round(recentEntries.reduce((s, e) => s + e.durationMs, 0) / recentEntries.length) : 0,
        slowRequests: recentEntries.filter(e => e.slow).length,
        errors: recentEntries.filter(e => e.statusCode >= 400).length
      },
      topEndpoints: Array.from(this.endpointStats.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([endpoint, stats]) => ({
          endpoint,
          count: stats.count,
          avgMs: Math.round(stats.totalMs / stats.count),
          maxMs: stats.maxMs,
          slowCount: stats.slowCount,
          errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(1) + '%' : '0%'
        }))
    };
  }

  /**
   * Get recent slow requests for debugging.
   */
  getSlowRequests(limit: number = 20): RequestLogEntry[] {
    return this.buffer
      .getAll()
      .filter(e => e.slow)
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, limit);
  }
}

// ─── Singleton ──────────────────────────────────────────────────────

export const requestMetrics = new RequestMetrics();

// Periodic flush
const flushTimer = setInterval(() => {
  requestMetrics.flush();
}, FLUSH_INTERVAL_MS);

// Allow Node.js to exit even if this timer is pending
if (flushTimer.unref) flushTimer.unref();

// ─── Express Middleware ─────────────────────────────────────────────

/**
 * Request logging middleware.
 * Add early in the middleware chain (after auth, so req.user is available).
 *
 * Usage in app.ts:
 *   import { requestLoggerMiddleware } from './infrastructure/requestLogger';
 *   app.use(requestLoggerMiddleware);
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const startMs = Date.now();

  // Capture original end to intercept status code
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: any[]) {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    const slow = durationMs > SLOW_THRESHOLD_MS;

    const user = (req as any).user;
    const userId = user?.id;

    const entry: RequestLogEntry = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      timestamp: startMs,
      slow
    };

    requestMetrics.record(entry);

    // Immediately log slow requests to stderr for operational visibility
    if (slow && SLOW_LOG_IMMEDIATE) {
      console.warn(
        `[SLOW REQUEST] ${entry.method} ${entry.path} - ${entry.durationMs.toFixed(0)}ms ` +
          `(status: ${entry.statusCode}, user: ${userId || 'anonymous'}, ip: ${entry.ip})`
      );
    }

    return originalEnd.apply(this, args as any);
  } as any;

  next();
}

export default requestLoggerMiddleware;
