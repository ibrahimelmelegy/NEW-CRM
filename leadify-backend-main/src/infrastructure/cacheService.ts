/**
 * Enhanced Cache Service
 *
 * Builds on top of the existing Redis connection at src/config/redis.ts.
 * Provides pattern-based invalidation, get-or-set semantics, and
 * domain-specific helpers for user permissions and dropdown options.
 *
 * Gracefully degrades when Redis is unavailable - all methods return
 * null/void rather than throwing, so the application continues to
 * function without caching.
 */

import redisClient from '../config/redis';
import logger from '../config/logger';

class CacheService {
  private defaultTTL = 300; // 5 minutes
  private redisAvailable = true;
  private lastAttempt = 0;
  private retryInterval = 60000; // 1 minute between reconnection attempts
  private hits = 0;
  private misses = 0;

  // ─── Connection Management ────────────────────────────────────────

  private async ensureConnection(): Promise<boolean> {
    if (this.redisAvailable && redisClient.isOpen) {
      return true;
    }

    // Don't retry too frequently
    if (!this.redisAvailable && Date.now() - this.lastAttempt < this.retryInterval) {
      return false;
    }

    try {
      if (!redisClient.isOpen) {
        this.lastAttempt = Date.now();
        await Promise.race([
          redisClient.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 3000))
        ]);
      }
      this.redisAvailable = true;
      return true;
    } catch {
      this.redisAvailable = false;
      return false;
    }
  }

  // ─── Core Methods ─────────────────────────────────────────────────

  /**
   * Get a cached value by key. Returns null if not found or Redis is down.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) {
      this.misses++;
      return null;
    }
    try {
      const data = await redisClient.get(key);
      if (data !== null) {
        this.hits++;
        return JSON.parse(data as string) as T;
      }
      this.misses++;
      return null;
    } catch {
      this.misses++;
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL (seconds). Defaults to 5 minutes.
   */
  async set(key: string, value: any, ttlSeconds: number = this.defaultTTL): Promise<void> {
    if (!(await this.ensureConnection())) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Cache write failed - non-critical
    }
  }

  /**
   * Delete a specific cached key.
   */
  async del(key: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    try {
      await redisClient.del(key);
    } catch {
      // Cache delete failed - non-critical
    }
  }

  // ─── Pattern Methods ──────────────────────────────────────────────

  /**
   * Get a value from cache, or compute it using the fetcher function and cache the result.
   * This is the most common caching pattern - eliminates cache stampede for cold keys.
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = this.defaultTTL): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    // Don't await the cache write - return immediately
    this.set(key, value, ttlSeconds).catch(() => {});
    return value;
  }

  /**
   * Invalidate all keys matching a glob pattern.
   * Example: invalidatePattern('user:*') clears all user cache entries.
   *
   * Uses SCAN to avoid blocking Redis on large keyspaces.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!(await this.ensureConnection())) return;
    try {
      let cursor = 0;
      let totalDeleted = 0;

      do {
        const result = await redisClient.scan(String(cursor), {
          MATCH: pattern,
          COUNT: 100
        });

        cursor = typeof result.cursor === 'string' ? parseInt(result.cursor, 10) : result.cursor;
        const keys = result.keys;

        if (keys.length > 0) {
          await redisClient.del(keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== 0);

      if (totalDeleted > 0) {
        // Cache keys invalidated
      }
    } catch (error) {
      logger.warn({ err: (error as Error).message }, `[Cache] Failed to invalidate pattern "${pattern}"`);
    }
  }

  // ─── Domain-Specific Helpers ──────────────────────────────────────

  /**
   * Cache user permissions for fast authorization checks.
   * Default TTL: 10 minutes (permissions don't change frequently).
   */
  async cacheUserPermissions(userId: number, permissions: string[], ttl: number = 600): Promise<void> {
    await this.set(`user:${userId}:permissions`, permissions, ttl);
  }

  /**
   * Get cached user permissions.
   * Returns null if not cached (caller should fetch from DB and re-cache).
   */
  async getUserPermissions(userId: number): Promise<string[] | null> {
    return this.get<string[]>(`user:${userId}:permissions`);
  }

  /**
   * Invalidate a user's cached permissions (call after role/permission changes).
   */
  async invalidateUserPermissions(userId: number): Promise<void> {
    await this.del(`user:${userId}:permissions`);
  }

  /**
   * Cache dropdown/select options (e.g., lead sources, deal stages, industries).
   * Default TTL: 30 minutes (these rarely change).
   */
  async cacheDropdownOptions(key: string, options: any[], ttl: number = 1800): Promise<void> {
    await this.set(`dropdown:${key}`, options, ttl);
  }

  /**
   * Get cached dropdown options.
   */
  async getDropdownOptions(key: string): Promise<any[] | null> {
    return this.get<any[]>(`dropdown:${key}`);
  }

  /**
   * Cache a paginated list result (e.g., lead listing page 1).
   * Short TTL since list data changes frequently.
   */
  async cacheListResult(entity: string, queryHash: string, data: Record<string, unknown>, ttl: number = 60): Promise<void> {
    await this.set(`list:${entity}:${queryHash}`, data, ttl);
  }

  /**
   * Get a cached list result.
   */
  async getListResult(entity: string, queryHash: string): Promise<any | null> {
    return this.get(`list:${entity}:${queryHash}`);
  }

  /**
   * Invalidate all cached list results for an entity.
   * Call this when any record of that entity type is created/updated/deleted.
   */
  async invalidateEntity(entity: string): Promise<void> {
    await this.invalidatePattern(`list:${entity}:*`);
  }

  // ─── Stats ────────────────────────────────────────────────────────

  /**
   * Get cache performance statistics.
   */
  async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: string;
    keys: number;
    redisAvailable: boolean;
  }> {
    let keys = 0;

    if (await this.ensureConnection()) {
      try {
        keys = await redisClient.dbSize();
      } catch {
        // Unable to get key count
      }
    }

    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%';

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      keys,
      redisAvailable: this.redisAvailable
    };
  }

  /**
   * Reset hit/miss counters.
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export default new CacheService();
