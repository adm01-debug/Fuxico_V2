/**
 * Cache implementation with TTL support
 * Compatible with Upstash Redis or in-memory fallback
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private redisUrl: string | null = null;
  private redisToken: string | null = null;

  constructor() {
    // Try to get Upstash Redis credentials from environment
    if (typeof window === 'undefined') {
      this.redisUrl = process.env.UPSTASH_REDIS_REST_URL || null;
      this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || null;
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt;
  }

  async get<T>(key: string): Promise<T | null> {
    // Try Redis first if available
    if (this.redisUrl && this.redisToken) {
      try {
        const response = await fetch(`${this.redisUrl}/get/${key}`, {
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
        const data = await response.json();
        if (data.result) {
          return JSON.parse(data.result) as T;
        }
      } catch (error) {
        console.warn('Redis cache get failed, using memory cache');
      }
    }

    // Fall back to memory cache
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    // Try Redis first if available
    if (this.redisUrl && this.redisToken) {
      try {
        await fetch(`${this.redisUrl}/set/${key}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: JSON.stringify(data),
            ex: ttlSeconds,
          }),
        });
      } catch (error) {
        console.warn('Redis cache set failed, using memory cache');
      }
    }

    // Always set in memory cache as backup
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    // Try Redis if available
    if (this.redisUrl && this.redisToken) {
      try {
        await fetch(`${this.redisUrl}/del/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.redisToken}` },
        });
      } catch (error) {
        console.warn('Redis cache delete failed');
      }
    }

    this.memoryCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // For memory cache, iterate and delete matching keys
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export const cache = new CacheManager();

// Cache key generators
export const cacheKeys = {
  userStats: (userId: string) => `stats:${userId}`,
  emailList: (userId: string, page: number) => `emails:${userId}:${page}`,
  documentStats: (userId: string) => `docs:${userId}`,
  linkStats: (userId: string) => `links:${userId}`,
  trends: (userId: string, period: string) => `trends:${userId}:${period}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
};

// TTL constants (in seconds)
export const cacheTTL = {
  stats: 60,           // 1 minute
  emailList: 30,       // 30 seconds
  dashboard: 60,       // 1 minute
  trends: 300,         // 5 minutes
  documents: 120,      // 2 minutes
  links: 120,          // 2 minutes
};

// Cache decorator for async functions
export function withCache<T>(
  keyFn: (...args: any[]) => string,
  ttl: number = 60
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyFn(...args);
      
      // Try to get from cache
      const cached = await cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}
