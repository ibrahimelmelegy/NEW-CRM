import { ref, computed } from 'vue';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  key?: string; // Custom cache key
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number; // Base delay in milliseconds
  retryOn?: number[]; // HTTP status codes to retry on
}

// Global cache store with LRU eviction
const MAX_CACHE_ENTRIES = 200;
const cache = new Map<string, CacheEntry<<unknown>>();

/**
 * Evict oldest entries when cache exceeds max size
 */
const evictIfNeeded = () => {
  if (cache.size <= MAX_CACHE_ENTRIES) return;

  // Remove expired entries first
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) cache.delete(key);
  }

  // If still over limit, remove oldest entries by timestamp (LRU)
  if (cache.size > MAX_CACHE_ENTRIES) {
    const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_ENTRIES);
    for (const [key] of toRemove) cache.delete(key);
  }
};

/**
 * Generate a cache key from URL and params
 */
const generateCacheKey = (url: string, params?: Record<string, unknown>): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${url}:${paramString}`;
};

/**
 * Check if cache entry is still valid
 */
const isCacheValid = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * useApiCache - Composable for caching API responses
 */
export const useApiCache = <T = <unknown>(fetcher: () => Promise<T>, cacheKey: string, options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000 } = options; // Default: 5 minutes

  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetch = async (forceRefresh = false): Promise<T | null> => {
    // Check cache first
    if (!forceRefresh) {
      const cachedEntry = cache.get(cacheKey);
      if (isCacheValid(cachedEntry)) {
        data.value = cachedEntry!.data;
        return cachedEntry!.data;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await fetcher();

      // Store in cache (with LRU eviction)
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      });
      evictIfNeeded();

      data.value = result;
      return result;
    } catch (err: unknown) {
      error.value = err;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const invalidate = () => {
    cache.delete(cacheKey);
  };

  const clear = () => {
    data.value = null;
    cache.delete(cacheKey);
  };

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetch,
    invalidate,
    clear
  };
};

/**
 * withRetry - Higher-order function to add retry logic to any async function
 */
export const withRetry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504] // Timeout, Rate Limit, Server Errors
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const statusCode = error?.response?.status || error?.statusCode;
      const shouldRetry = retryOn.includes(statusCode);

      if (attempt < maxRetries && shouldRetry) {
        // Exponential backoff: delay * 2^attempt
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else if (!shouldRetry) {
        // Don't retry on non-retryable errors (4xx client errors)
        throw error;
      }
    }
  }

  throw lastError;
};

/**
 * Clear all cached entries
 */
export const clearAllCache = (): void => {
  cache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const entries = Array.from(cache.entries());
  return {
    size: cache.size,
    entries: entries.map(([key, value]) => ({
      key,
      timestamp: new Date(value.timestamp).toISOString(),
      expiresAt: new Date(value.expiresAt).toISOString(),
      isValid: isCacheValid(value)
    }))
  };
};
