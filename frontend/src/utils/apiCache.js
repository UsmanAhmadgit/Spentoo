/**
 * API Cache Utility
 * Caches API responses in localStorage with expiration
 */

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key from URL and params
   */
  getCacheKey(url, params = {}) {
    const paramString = JSON.stringify(params);
    return `${CACHE_PREFIX}${url}_${paramString}`;
  }

  /**
   * Get cached data if not expired
   */
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - timestamp > ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      // If cache is corrupted, remove it
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Set cache data with TTL
   */
  set(key, data, ttl = DEFAULT_TTL) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      // If localStorage is full, clear old cache entries
      this.clearExpired();
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
      } catch (e) {
        console.error('Failed to cache data:', e);
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (now - timestamp > ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Invalidate cache for a specific pattern
   */
  invalidate(pattern) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const apiCache = new ApiCache();

/**
 * Cache wrapper for API calls
 */
export const withCache = (apiCall, cacheKey, ttl = DEFAULT_TTL) => {
  return async (...args) => {
    const key = typeof cacheKey === 'function' 
      ? cacheKey(...args) 
      : cacheKey;

    // Try to get from cache
    const cached = apiCache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from API
    const data = await apiCall(...args);
    
    // Cache the result
    apiCache.set(key, data, ttl);
    
    return data;
  };
};

