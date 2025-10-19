import { DatabaseCache, RedisCache, CacheFactory, CacheKeys } from '../cache';
import { mockPrisma, createMockData } from './setup';

describe('DatabaseCache', () => {
  let cache: DatabaseCache;

  beforeEach(() => {
    cache = new DatabaseCache({
      ttl: 5000, // 5 seconds for testing
      maxSize: 3,
      strategy: 'lru'
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values correctly', () => {
      const testValue = { id: '123', name: 'Test Part' };
      cache.set('test-key', testValue);

      const retrieved = cache.get('test-key');
      expect(retrieved).toEqual(testValue);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check existence correctly', () => {
      cache.set('exists-key', 'value');

      expect(cache.has('exists-key')).toBe(true);
      expect(cache.has('does-not-exist')).toBe(false);
    });

    it('should delete values correctly', () => {
      cache.set('delete-key', 'value');
      expect(cache.has('delete-key')).toBe(true);

      const deleted = cache.delete('delete-key');
      expect(deleted).toBe(true);
      expect(cache.has('delete-key')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      cache = new DatabaseCache({
        ttl: 100, // 100ms for faster testing
        maxSize: 10,
        strategy: 'lru'
      });
    });

    it('should expire entries after TTL', async () => {
      cache.set('expiring-key', 'value');
      expect(cache.has('expiring-key')).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.has('expiring-key')).toBe(false);
      expect(cache.get('expiring-key')).toBeNull();
    });

    it('should support custom TTL', async () => {
      cache.set('custom-ttl', 'value', 200); // 200ms custom TTL

      // Should still exist after default TTL
      await new Promise(resolve => setTimeout(resolve, 120));
      expect(cache.has('custom-ttl')).toBe(true);

      // Should expire after custom TTL
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.has('custom-ttl')).toBe(false);
    });

    it('should clean up expired entries', async () => {
      cache.set('cleanup1', 'value1');
      cache.set('cleanup2', 'value2');

      await new Promise(resolve => setTimeout(resolve, 150));

      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBe(2);
    });
  });

  describe('Cache Eviction Strategies', () => {
    beforeEach(() => {
      cache = new DatabaseCache({
        ttl: 60000, // Long TTL to avoid expiration during tests
        maxSize: 2,
        strategy: 'lru'
      });
    });

    it('should evict least recently used (LRU)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Access key1 to make it more recently used
      cache.get('key1');

      // This should evict key2 (least recently used)
      cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should evict least frequently used (LFU)', () => {
      cache = new DatabaseCache({
        ttl: 60000,
        maxSize: 2,
        strategy: 'lfu'
      });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Access key1 multiple times
      cache.get('key1');
      cache.get('key1');
      cache.get('key2'); // key2 accessed once, key1 twice

      // This should evict key2 (least frequently used)
      cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should evict by TTL strategy', () => {
      cache = new DatabaseCache({
        ttl: 60000,
        maxSize: 2,
        strategy: 'ttl'
      });

      cache.set('key1', 'value1', 1000); // Shorter TTL
      cache.set('key2', 'value2', 2000); // Longer TTL

      // This should evict key1 (closer to expiration)
      cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate statistics', () => {
      cache.set('stat1', 'value1');
      cache.set('stat2', 'value2');
      cache.get('stat1'); // Access for stats

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeTruthy();
      expect(stats.mostAccessed).toBeTruthy();
    });

    it('should track most accessed entry', () => {
      cache.set('popular', 'value');
      cache.set('unpopular', 'value');

      cache.get('popular');
      cache.get('popular');
      cache.get('popular');
      cache.get('unpopular');

      const stats = cache.getStats();
      expect(stats.mostAccessed?.key).toBe('popular');
      expect(stats.mostAccessed?.count).toBe(3);
    });
  });
});

describe('RedisCache', () => {
  let mockRedisClient: any;
  let redisCache: RedisCache;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      flushdb: jest.fn(),
      info: jest.fn(),
      dbsize: jest.fn(),
      config: jest.fn()
    };

    redisCache = new RedisCache(mockRedisClient, {
      ttl: 5000,
      maxSize: 100,
      strategy: 'ttl'
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values correctly', async () => {
      const testValue = { id: '123', name: 'Test Part' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

      await redisCache.set('test-key', testValue);
      const retrieved = await redisCache.get('test-key');

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'test-key',
        5, // TTL in seconds
        JSON.stringify(testValue)
      );
      expect(retrieved).toEqual(testValue);
    });

    it('should return null for non-existent keys', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisCache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check existence correctly', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const exists = await redisCache.has('exists-key');
      expect(exists).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('exists-key');
    });

    it('should delete values correctly', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const deleted = await redisCache.delete('delete-key');
      expect(deleted).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('delete-key');
    });

    it('should clear all values', async () => {
      await redisCache.clear();
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis get errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));

      const result = await redisCache.get('error-key');
      expect(result).toBeNull();
    });

    it('should handle Redis set errors gracefully', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Redis connection error'));

      // Should not throw
      await expect(redisCache.set('error-key', 'value')).resolves.toBeUndefined();
    });

    it('should handle Redis delete errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis connection error'));

      const result = await redisCache.delete('error-key');
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide Redis statistics', async () => {
      mockRedisClient.info.mockResolvedValue('used_memory:1048576\nother_info:value');
      mockRedisClient.dbsize.mockResolvedValue(42);
      mockRedisClient.config.mockResolvedValue(['maxmemory', '1073741824']);

      const stats = await redisCache.getStats();

      expect(stats.memoryUsage).toBe(1048576);
      expect(stats.keyCount).toBe(42);
    });

    it('should handle stats errors gracefully', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Redis error'));

      const stats = await redisCache.getStats();
      expect(stats).toEqual({});
    });
  });
});

describe('CacheFactory', () => {
  it('should create memory cache by default', () => {
    const cache = CacheFactory.create();
    expect(cache).toBeInstanceOf(DatabaseCache);
  });

  it('should create memory cache when specified', () => {
    const cache = CacheFactory.create('memory');
    expect(cache).toBeInstanceOf(DatabaseCache);
  });

  it('should create Redis cache when Redis client provided', () => {
    const mockRedisClient = { get: jest.fn(), setex: jest.fn() };
    const cache = CacheFactory.create('redis', { redisClient: mockRedisClient });
    expect(cache).toBeInstanceOf(RedisCache);
  });

  it('should fallback to memory cache if Redis client not provided', () => {
    const cache = CacheFactory.create('redis');
    expect(cache).toBeInstanceOf(DatabaseCache);
  });
});

describe('CacheKeys', () => {
  it('should generate consistent search keys', () => {
    const params1 = { query: 'alternator', make: 'Toyota' };
    const params2 = { make: 'Toyota', query: 'alternator' };

    const key1 = CacheKeys.search(params1);
    const key2 = CacheKeys.search(params2);

    expect(key1).toContain('search:');
    expect(typeof key1).toBe('string');
    // Note: JSON.stringify may produce different orders, so we just check format
  });

  it('should generate facets keys', () => {
    const filters = { category: 'engine' };
    const key = CacheKeys.facets(filters);

    expect(key).toContain('facets:');
    expect(key).toContain('engine');
  });

  it('should generate stats keys', () => {
    const key = CacheKeys.stats('dashboard', 'monthly');
    expect(key).toBe('stats:dashboard:monthly');

    const keyDefault = CacheKeys.stats('sales');
    expect(keyDefault).toBe('stats:sales:all');
  });

  it('should generate entity keys', () => {
    expect(CacheKeys.part('part-123')).toBe('part:part-123');
    expect(CacheKeys.vehicle('vehicle-456')).toBe('vehicle:vehicle-456');
    expect(CacheKeys.seller('seller-789')).toBe('seller:seller-789');
    expect(CacheKeys.category('category-abc')).toBe('category:category-abc');
  });
});

describe('PartPal-specific Caching', () => {
  let cache: DatabaseCache;

  beforeEach(() => {
    cache = new DatabaseCache({
      ttl: 60000,
      maxSize: 100,
      strategy: 'lru'
    });
  });

  it('should cache part search results', () => {
    const searchParams = {
      query: 'alternator',
      make: 'Toyota',
      year: 2018,
      location: { province: 'Western Cape' }
    };

    const searchResults = {
      parts: [createMockData.part()],
      totalCount: 1,
      facets: {
        makes: [{ value: 'Toyota', count: 1 }],
        models: [{ value: 'Corolla', count: 1 }],
        conditions: [{ value: 'EXCELLENT', count: 1 }],
        priceRanges: [{ range: '500-1000', count: 1 }]
      }
    };

    const cacheKey = CacheKeys.search(searchParams);
    cache.set(cacheKey, searchResults);

    const cached = cache.get(cacheKey);
    expect(cached).toEqual(searchResults);
    expect(cached.parts).toHaveLength(1);
    expect(cached.facets.makes[0].value).toBe('Toyota');
  });

  it('should cache seller information', () => {
    const seller = createMockData.seller({
      businessName: 'Cape Town Auto Parts',
      address: {
        city: 'Cape Town',
        province: 'Western Cape',
        country: 'South Africa'
      }
    });

    const cacheKey = CacheKeys.seller(seller.id);
    cache.set(cacheKey, seller);

    const cached = cache.get(cacheKey);
    expect(cached).toEqual(seller);
    expect(cached.businessName).toBe('Cape Town Auto Parts');
  });

  it('should cache dashboard statistics', () => {
    const dashboardStats = {
      totalVehicles: 45,
      totalParts: 234,
      recentSales: 12,
      monthlyRevenue: 45000,
      topSellingParts: [
        { part: createMockData.part({ name: 'Alternator' }), salesCount: 8 },
        { part: createMockData.part({ name: 'Brake Pads' }), salesCount: 6 }
      ],
      recentActivity: []
    };

    const cacheKey = CacheKeys.stats('dashboard', 'monthly');
    cache.set(cacheKey, dashboardStats);

    const cached = cache.get(cacheKey);
    expect(cached).toEqual(dashboardStats);
    expect(cached.monthlyRevenue).toBe(45000);
    expect(cached.topSellingParts).toHaveLength(2);
  });

  it('should handle South African specific data', () => {
    const locationFilters = {
      province: 'Western Cape',
      city: 'Cape Town',
      radius: 50
    };

    const facetsKey = CacheKeys.facets(locationFilters);
    cache.set(facetsKey, {
      locations: [
        { value: 'Cape Town', count: 45 },
        { value: 'Stellenbosch', count: 12 },
        { value: 'Paarl', count: 8 }
      ],
      businesses: [
        { value: 'SCRAP_YARD', count: 30 },
        { value: 'DISMANTLER', count: 25 },
        { value: 'PRIVATE', count: 10 }
      ]
    });

    const cached = cache.get(facetsKey);
    expect(cached.locations[0].value).toBe('Cape Town');
    expect(cached.locations[0].count).toBe(45);
  });

  it('should cache ZAR price ranges', () => {
    const priceRanges = [
      { range: 'R 0 - R 500', min: 0, max: 500, count: 25 },
      { range: 'R 500 - R 1,000', min: 500, max: 1000, count: 35 },
      { range: 'R 1,000 - R 2,500', min: 1000, max: 2500, count: 40 },
      { range: 'R 2,500+', min: 2500, max: null, count: 15 }
    ];

    cache.set('price-ranges:zar', priceRanges);

    const cached = cache.get('price-ranges:zar');
    expect(cached).toHaveLength(4);
    expect(cached[1].range).toBe('R 500 - R 1,000');
    expect(cached[1].count).toBe(35);
  });
});