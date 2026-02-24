/**
 * useApiCache - Unit Tests
 * ==========================
 * Tests for composables/useApiCache.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useApiCache, withRetry, clearAllCache, getCacheStats } from '@/composables/useApiCache';

describe('useApiCache.ts', () => {
  beforeEach(() => {
    clearAllCache();
    vi.clearAllMocks();
  });

  // ============================================
  // useApiCache - Basic caching
  // ============================================
  describe('useApiCache', () => {
    it('should fetch and cache data on first call', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { data, fetch } = useApiCache(fetcher, 'test-key');

      const result = await fetch();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
      expect(data.value).toEqual(mockData);
    });

    it('should return cached data on subsequent calls', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { fetch } = useApiCache(fetcher, 'test-key');

      await fetch(); // First call
      const cachedResult = await fetch(); // Second call

      expect(fetcher).toHaveBeenCalledTimes(1); // Should only fetch once
      expect(cachedResult).toEqual(mockData);
    });

    it('should force refresh when forceRefresh is true', async () => {
      const mockData1 = { id: 1, name: 'First' };
      const mockData2 = { id: 2, name: 'Second' };
      const fetcher = vi.fn().mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2);

      const { data, fetch } = useApiCache(fetcher, 'test-key');

      await fetch(); // First call
      expect(data.value).toEqual(mockData1);

      await fetch(true); // Force refresh
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(data.value).toEqual(mockData2);
    });

    it('should respect TTL expiration', async () => {
      vi.useFakeTimers();

      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { fetch } = useApiCache(fetcher, 'test-key', { ttl: 1000 }); // 1 second TTL

      await fetch();
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Move time forward past TTL
      vi.advanceTimersByTime(1500);

      await fetch();
      expect(fetcher).toHaveBeenCalledTimes(2); // Should fetch again

      vi.useRealTimers();
    });

    it('should track loading state', async () => {
      const fetcher = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ data: 'test' }), 100);
        });
      });

      const { loading, fetch } = useApiCache(fetcher, 'test-key');

      expect(loading.value).toBe(false);

      const fetchPromise = fetch();
      expect(loading.value).toBe(true);

      await fetchPromise;
      expect(loading.value).toBe(false);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Fetch failed');
      const fetcher = vi.fn().mockRejectedValue(mockError);

      const { data, error, fetch } = useApiCache(fetcher, 'test-key');

      const result = await fetch();

      expect(result).toBe(null);
      expect(data.value).toBe(null);
      expect(error.value).toEqual(mockError);
    });
  });

  // ============================================
  // Cache invalidation
  // ============================================
  describe('Cache invalidation', () => {
    it('should invalidate cache for specific key', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { fetch, invalidate } = useApiCache(fetcher, 'test-key');

      await fetch();
      expect(fetcher).toHaveBeenCalledTimes(1);

      invalidate();

      await fetch();
      expect(fetcher).toHaveBeenCalledTimes(2); // Should fetch again
    });

    it('should clear data and cache when clear is called', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const { data, fetch, clear } = useApiCache(fetcher, 'test-key');

      await fetch();
      expect(data.value).toEqual(mockData);

      clear();
      expect(data.value).toBe(null);

      // Should fetch again after clear
      await fetch();
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // withRetry
  // ============================================
  describe('withRetry', () => {
    it('should return result on successful first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on retryable errors', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } }) // Server error
        .mockResolvedValue('success');

      const resultPromise = withRetry(mockFn, {
        maxRetries: 3,
        retryDelay: 1000
      });

      // Fast-forward timers to simulate retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');

      vi.useRealTimers();
    });

    it('should apply exponential backoff', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValue('success');

      const resultPromise = withRetry(mockFn, {
        maxRetries: 3,
        retryDelay: 1000
      });

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry: 2000ms (exponential)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;
      expect(result).toBe('success');

      vi.useRealTimers();
    });

    it('should not retry on non-retryable errors (4xx)', async () => {
      const mockError = { response: { status: 400 } }; // Bad request
      const mockFn = vi.fn().mockRejectedValue(mockError);

      await expect(withRetry(mockFn)).rejects.toEqual(mockError);

      expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry
    });

    it('should throw after max retries exceeded', async () => {
      const mockError = { response: { status: 503 } };
      const mockFn = vi.fn().mockRejectedValue(mockError);

      await expect(withRetry(mockFn, { maxRetries: 2, retryDelay: 10 })).rejects.toEqual(mockError);

      expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should only retry on specified status codes', async () => {
      vi.useFakeTimers();

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 429 } }) // Rate limit (retryable)
        .mockResolvedValue('success');

      const resultPromise = withRetry(mockFn, {
        retryOn: [429, 503],
        retryDelay: 100
      });

      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;
      expect(result).toBe('success');

      vi.useRealTimers();
    });
  });

  // ============================================
  // Global cache management
  // ============================================
  describe('Global cache management', () => {
    it('should clear all cache entries', async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ id: 1 });
      const fetcher2 = vi.fn().mockResolvedValue({ id: 2 });

      const cache1 = useApiCache(fetcher1, 'key1');
      const cache2 = useApiCache(fetcher2, 'key2');

      await cache1.fetch();
      await cache2.fetch();

      clearAllCache();

      // Both should fetch again
      await cache1.fetch();
      await cache2.fetch();

      expect(fetcher1).toHaveBeenCalledTimes(2);
      expect(fetcher2).toHaveBeenCalledTimes(2);
    });

    it('should return cache statistics', async () => {
      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const { fetch } = useApiCache(fetcher, 'stats-key', { ttl: 10000 });

      await fetch();

      const stats = getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0]!.key).toBe('stats-key');
      expect(stats.entries[0]!.isValid).toBe(true);
    });

    it('should show expired entries in stats', async () => {
      vi.useFakeTimers();

      const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
      const { fetch } = useApiCache(fetcher, 'expiry-key', { ttl: 1000 });

      await fetch();

      // Move time forward past TTL
      vi.advanceTimersByTime(1500);

      const stats = getCacheStats();
      expect(stats.entries[0]!.isValid).toBe(false);

      vi.useRealTimers();
    });
  });

  // ============================================
  // Multiple cache instances
  // ============================================
  describe('Multiple cache instances', () => {
    it('should maintain separate caches for different keys', async () => {
      const fetcher1 = vi.fn().mockResolvedValue({ id: 1 });
      const fetcher2 = vi.fn().mockResolvedValue({ id: 2 });

      const cache1 = useApiCache(fetcher1, 'key1');
      const cache2 = useApiCache(fetcher2, 'key2');

      await cache1.fetch();
      await cache2.fetch();

      expect(fetcher1).toHaveBeenCalledTimes(1);
      expect(fetcher2).toHaveBeenCalledTimes(1);
      expect(cache1.data.value).toEqual({ id: 1 });
      expect(cache2.data.value).toEqual({ id: 2 });
    });
  });
});
