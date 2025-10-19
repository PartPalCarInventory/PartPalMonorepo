import { DatabaseConfig } from './config';

// Enhanced caching strategy for database operations
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
  strategy: 'lru' | 'lfu' | 'ttl'; // Cache eviction strategy
}

export class DatabaseCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private accessCount = new Map<string, number>();
  private lastAccess = new Map<string, number>();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: DatabaseConfig.performance.cacheTTL,
      maxSize: DatabaseConfig.performance.maxCacheSize,
      strategy: 'lru',
      ...config
    };
  }

  // Get cached value
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access patterns for LRU/LFU
    this.updateAccessPattern(key);

    return entry.value as T;
  }

  // Set cached value
  set<T>(key: string, value: T, customTTL?: number): void {
    const ttl = customTTL || this.config.ttl;
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl,
      size: this.estimateSize(value)
    };

    // Evict if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, entry);
    this.updateAccessPattern(key);
  }

  // Delete cached value
  delete(key: string): boolean {
    this.accessCount.delete(key);
    this.lastAccess.delete(key);
    return this.cache.delete(key);
  }

  // Clear all cached values
  clear(): void {
    this.cache.clear();
    this.accessCount.clear();
    this.lastAccess.clear();
  }

  // Check if entry exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.getMemoryUsage(),
      oldestEntry: this.getOldestEntry(),
      mostAccessed: this.getMostAccessed()
    };
  }

  // Cleanup expired entries
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccessPattern(key: string): void {
    const now = Date.now();
    this.lastAccess.set(key, now);
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
  }

  private evict(): void {
    switch (this.config.strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, time] of this.lastAccess.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private evictLFU(): void {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, count] of this.accessCount.entries()) {
      if (count < leastCount) {
        leastCount = count;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.delete(leastUsedKey);
    }
  }

  private evictTTL(): void {
    // Find entry closest to expiration
    let closestKey = '';
    let closestExpiry = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const expiryTime = entry.timestamp + entry.ttl;
      if (expiryTime < closestExpiry) {
        closestExpiry = expiryTime;
        closestKey = key;
      }
    }

    if (closestKey) {
      this.delete(closestKey);
    }
  }

  private estimateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private calculateHitRate(): number {
    // This would require tracking hits/misses - simplified for now
    return 0;
  }

  private getMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private getOldestEntry(): { key: string; age: number } | null {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey ? {
      key: oldestKey,
      age: Date.now() - oldestTime
    } : null;
  }

  private getMostAccessed(): { key: string; count: number } | null {
    let mostKey = '';
    let mostCount = 0;

    for (const [key, count] of this.accessCount.entries()) {
      if (count > mostCount) {
        mostCount = count;
        mostKey = key;
      }
    }

    return mostKey ? { key: mostKey, count: mostCount } : null;
  }
}

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
  size: number;
}

// Redis cache implementation for production
export class RedisCache {
  private redisClient: any;
  private config: CacheConfig;

  constructor(redisClient: any, config?: Partial<CacheConfig>) {
    this.redisClient = redisClient;
    this.config = {
      ttl: DatabaseConfig.performance.cacheTTL,
      maxSize: DatabaseConfig.performance.maxCacheSize,
      strategy: 'ttl',
      ...config
    };
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, customTTL?: number): Promise<void> {
    try {
      const ttl = Math.floor((customTTL || this.config.ttl) / 1000); // Redis uses seconds
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.del(key);
      return result === 1;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redisClient.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async getStats() {
    try {
      const info = await this.redisClient.info('memory');
      return {
        memoryUsage: this.parseRedisMemoryInfo(info),
        keyCount: await this.redisClient.dbsize(),
        maxMemory: await this.redisClient.config('get', 'maxmemory')
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {};
    }
  }

  private parseRedisMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}

// Factory for creating appropriate cache instance
export class CacheFactory {
  static create(type: 'memory' | 'redis' = 'memory', options?: any): DatabaseCache | RedisCache {
    if (type === 'redis' && options?.redisClient) {
      return new RedisCache(options.redisClient, options.config);
    }

    return new DatabaseCache(options?.config);
  }
}

// Global cache instances
export const searchCache = CacheFactory.create('memory', {
  config: {
    ttl: DatabaseConfig.search.maxSearchCache * 1000,
    maxSize: DatabaseConfig.search.maxSearchCache,
    strategy: 'lru'
  }
});

export const facetsCache = CacheFactory.create('memory', {
  config: {
    ttl: 10 * 60 * 1000, // 10 minutes for facets
    maxSize: 100,
    strategy: 'ttl'
  }
});

export const statsCache = CacheFactory.create('memory', {
  config: {
    ttl: 5 * 60 * 1000, // 5 minutes for stats
    maxSize: 50,
    strategy: 'ttl'
  }
});

// Cache key generators
export const CacheKeys = {
  search: (params: any) => `search:${JSON.stringify(params)}`,
  facets: (filters?: any) => `facets:${filters ? JSON.stringify(filters) : 'all'}`,
  stats: (type: string, period?: string) => `stats:${type}:${period || 'all'}`,
  part: (id: string) => `part:${id}`,
  vehicle: (id: string) => `vehicle:${id}`,
  seller: (id: string) => `seller:${id}`,
  category: (id: string) => `category:${id}`
};

export default DatabaseCache;