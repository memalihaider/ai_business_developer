import { createClient, RedisClientType } from 'redis';

// Redis client configuration
class CacheManager {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private fallbackCache = new Map<string, { data: any; expiry: number }>();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Use Redis if available, otherwise fall back to in-memory cache
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
            lazyConnect: true,
          },
        });

        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('Redis Client Connected');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.log('Redis not configured, using in-memory cache');
      }
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.client && this.isConnected) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to in-memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        this.fallbackCache.set(key, {
          data: value,
          expiry: Date.now() + (ttlSeconds * 1000),
        });
        
        // Clean up expired entries periodically
        this.cleanupExpiredEntries();
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // For in-memory cache, manually check each key
        const keysToDelete: string[] = [];
        for (const key of this.fallbackCache.keys()) {
          if (this.matchesPattern(key, pattern)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.fallbackCache.delete(key));
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching for wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.fallbackCache.entries()) {
      if (value.expiry <= now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  async getStats(): Promise<{ type: string; connected: boolean; keyCount?: number }> {
    try {
      if (this.client && this.isConnected) {
        const info = await this.client.info('keyspace');
        const keyCount = info.match(/keys=(\d+)/)?.[1] || '0';
        return {
          type: 'redis',
          connected: true,
          keyCount: parseInt(keyCount),
        };
      } else {
        return {
          type: 'memory',
          connected: true,
          keyCount: this.fallbackCache.size,
        };
      }
    } catch (error) {
      return {
        type: this.client ? 'redis' : 'memory',
        connected: false,
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
      }
      this.fallbackCache.clear();
    } catch (error) {
      console.error('Cache disconnect error:', error);
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Cache key generators
export const CacheKeys = {
  analyticsOverview: (timeRange: string) => `analytics:overview:${timeRange}`,
  platformAnalytics: (platformId: string, timeRange: string) => `analytics:platform:${platformId}:${timeRange}`,
  realtimeMetrics: () => 'analytics:realtime',
  engagementTrends: (timeRange: string) => `analytics:engagement:${timeRange}`,
  topContent: (timeRange: string, limit: number) => `analytics:content:${timeRange}:${limit}`,
  platformList: () => 'platforms:list',
  userSession: (userId: string) => `session:${userId}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  REALTIME: 10,     // 10 seconds for real-time data
};

// Cached function wrapper
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = CacheTTL.MEDIUM
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = await cacheManager.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    await cacheManager.set(cacheKey, result, ttl);
    
    return result;
  };
}

// Cache invalidation helpers
export const invalidateCache = {
  analytics: async () => {
    await cacheManager.invalidatePattern('analytics:*');
  },
  platform: async (platformId: string) => {
    await cacheManager.invalidatePattern(`analytics:platform:${platformId}:*`);
  },
  realtime: async () => {
    await cacheManager.del(CacheKeys.realtimeMetrics());
  },
  all: async () => {
    await cacheManager.invalidatePattern('*');
  },
};

// Export cache manager methods
export const cache = {
  get: <T>(key: string) => cacheManager.get<T>(key),
  set: <T>(key: string, value: T, ttl?: number) => cacheManager.set(key, value, ttl),
  del: (key: string) => cacheManager.del(key),
  invalidatePattern: (pattern: string) => cacheManager.invalidatePattern(pattern),
  getStats: () => cacheManager.getStats(),
  disconnect: () => cacheManager.disconnect(),
};

export default cacheManager;