import { RedisClient } from '../config/redis';

/**
 * Redis cache utility for PartPal API
 * Provides high-performance caching with TTL support
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export class RedisCache {
  private readonly defaultTTL = 3600; // 1 hour default
  private readonly keyPrefix: string;

  constructor(prefix: string = 'cache:') {
    this.keyPrefix = prefix;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;

    const serialized = JSON.stringify(value);
    await redis.setex(fullKey, ttl, serialized);
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);

    const data = await redis.get(fullKey);
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Failed to parse cached value for key ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * Get or set pattern - fetches from cache or computes and caches
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch fresh data
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    await redis.del(fullKey);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    const redis = RedisClient.getInstance();
    const prefix = options?.prefix || this.keyPrefix;
    const fullPattern = `${prefix}${pattern}`;

    let deletedCount = 0;
    let cursor = '0';

    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        fullPattern,
        'COUNT',
        100
      );

      cursor = newCursor;

      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== '0');

    return deletedCount;
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    const exists = await redis.exists(fullKey);
    return exists === 1;
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    return redis.ttl(fullKey);
  }

  /**
   * Extend TTL for a key
   */
  async extend(key: string, ttl: number, options?: CacheOptions): Promise<void> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    await redis.expire(fullKey, ttl);
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, by: number = 1, options?: CacheOptions): Promise<number> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    return redis.incrby(fullKey, by);
  }

  /**
   * Decrement a numeric value
   */
  async decrement(key: string, by: number = 1, options?: CacheOptions): Promise<number> {
    const redis = RedisClient.getInstance();
    const fullKey = this.getKey(key, options?.prefix);
    return redis.decrby(fullKey, by);
  }

  /**
   * Set multiple keys at once
   */
  async setMany<T>(
    entries: Array<{ key: string; value: T }>,
    options?: CacheOptions
  ): Promise<void> {
    const redis = RedisClient.getInstance();
    const ttl = options?.ttl || this.defaultTTL;

    const pipeline = redis.pipeline();

    for (const { key, value } of entries) {
      const fullKey = this.getKey(key, options?.prefix);
      const serialized = JSON.stringify(value);
      pipeline.setex(fullKey, ttl, serialized);
    }

    await pipeline.exec();
  }

  /**
   * Get multiple keys at once
   */
  async getMany<T>(keys: string[], options?: CacheOptions): Promise<Map<string, T>> {
    const redis = RedisClient.getInstance();
    const fullKeys = keys.map(key => this.getKey(key, options?.prefix));

    const values = await redis.mget(...fullKeys);
    const result = new Map<string, T>();

    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        try {
          result.set(key, JSON.parse(value) as T);
        } catch (error) {
          console.error(`Failed to parse cached value for key ${key}:`, error);
        }
      }
    });

    return result;
  }

  /**
   * Flush all cached data (use with caution)
   */
  async flushAll(): Promise<void> {
    await this.deletePattern('*');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsed: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const redis = RedisClient.getInstance();
    const info = await RedisClient.getInfo();

    const pattern = `${this.keyPrefix}*`;
    let totalKeys = 0;
    let cursor = '0';

    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      cursor = newCursor;
      totalKeys += keys.length;
    } while (cursor !== '0');

    const memoryUsed = parseInt(info.used_memory || '0');
    const hits = parseInt(info.keyspace_hits || '0');
    const misses = parseInt(info.keyspace_misses || '0');
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;

    return {
      totalKeys,
      memoryUsed,
      hits,
      misses,
      hitRate,
    };
  }

  /**
   * Build full cache key
   */
  private getKey(key: string, customPrefix?: string): string {
    const prefix = customPrefix || this.keyPrefix;
    return `${prefix}${key}`;
  }
}

/**
 * Specialized cache instances for different data types
 */

// General purpose cache
export const cache = new RedisCache('cache:');

// Search results cache (shorter TTL)
export const searchCache = new RedisCache('search:');

// User data cache
export const userCache = new RedisCache('user:');

// Parts catalog cache
export const partsCache = new RedisCache('parts:');

// Vehicles cache
export const vehiclesCache = new RedisCache('vehicles:');

// Analytics cache (longer TTL)
export const analyticsCache = new RedisCache('analytics:');

/**
 * Cache keys helper
 */
export const CacheKeys = {
  // User keys
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,

  // Parts keys
  part: (partId: string) => `part:${partId}`,
  partsByVehicle: (vehicleId: string) => `parts:vehicle:${vehicleId}`,
  partsBySeller: (sellerId: string) => `parts:seller:${sellerId}`,

  // Vehicle keys
  vehicle: (vehicleId: string) => `vehicle:${vehicleId}`,
  vehiclesByVIN: (vin: string) => `vehicle:vin:${vin}`,

  // Search keys
  search: (query: string, filters: Record<string, any>) => {
    const filterStr = JSON.stringify(filters);
    return `search:${query}:${Buffer.from(filterStr).toString('base64')}`;
  },

  // Analytics keys
  dashboardStats: (sellerId: string, period: string) => `analytics:dashboard:${sellerId}:${period}`,
  salesReport: (sellerId: string, startDate: string, endDate: string) =>
    `analytics:sales:${sellerId}:${startDate}:${endDate}`,
};

/**
 * Cache decorator for methods (advanced usage)
 */
export function Cacheable(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return cache.getOrSet(
        cacheKey,
        async () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}
