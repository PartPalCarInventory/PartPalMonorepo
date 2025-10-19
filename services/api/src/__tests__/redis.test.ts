import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RedisClient } from '../config/redis';
import { RedisCache, cache, CacheKeys } from '../utils/redisCache';
import { SessionStore, sessionStore } from '../utils/sessionStore';

describe('Redis Integration Tests', () => {
  beforeAll(async () => {
    // Wait for Redis connection
    const isHealthy = await RedisClient.healthCheck();
    if (!isHealthy) {
      console.warn('Redis is not available, tests may fail');
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    await RedisClient.disconnect();
  });

  describe('RedisClient', () => {
    it('should connect to Redis successfully', async () => {
      const isHealthy = await RedisClient.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should get Redis server info', async () => {
      const info = await RedisClient.getInfo();
      expect(info).toBeDefined();
      expect(typeof info).toBe('object');
    });
  });

  describe('RedisCache', () => {
    const testCache = new RedisCache('test:');

    beforeEach(async () => {
      // Clean up test cache before each test
      await testCache.flushAll();
    });

    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { message: 'Hello Redis!' };

      await testCache.set(key, value);
      const retrieved = await testCache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const value = await testCache.get('non-existent-key');
      expect(value).toBeNull();
    });

    it('should respect TTL', async () => {
      const key = 'ttl-test';
      const value = 'expires soon';

      await testCache.set(key, value, { ttl: 1 }); // 1 second TTL

      const ttl = await testCache.getTTL(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });

    it('should delete a key', async () => {
      const key = 'delete-test';
      await testCache.set(key, 'value');

      await testCache.delete(key);
      const exists = await testCache.exists(key);

      expect(exists).toBe(false);
    });

    it('should implement getOrSet pattern', async () => {
      const key = 'getOrSet-test';
      let fetchCalled = 0;

      const fetchFn = async () => {
        fetchCalled++;
        return { data: 'fetched data' };
      };

      // First call should fetch
      const result1 = await testCache.getOrSet(key, fetchFn);
      expect(fetchCalled).toBe(1);
      expect(result1).toEqual({ data: 'fetched data' });

      // Second call should use cache
      const result2 = await testCache.getOrSet(key, fetchFn);
      expect(fetchCalled).toBe(1); // Not called again
      expect(result2).toEqual({ data: 'fetched data' });
    });

    it('should increment and decrement values', async () => {
      const key = 'counter';

      const val1 = await testCache.increment(key);
      expect(val1).toBe(1);

      const val2 = await testCache.increment(key, 5);
      expect(val2).toBe(6);

      const val3 = await testCache.decrement(key, 2);
      expect(val3).toBe(4);
    });

    it('should set and get multiple values', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      await testCache.setMany(entries);

      const results = await testCache.getMany(['key1', 'key2', 'key3']);

      expect(results.size).toBe(3);
      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('key3')).toBe('value3');
    });

    it('should delete keys by pattern', async () => {
      await testCache.set('user:1', { id: 1 });
      await testCache.set('user:2', { id: 2 });
      await testCache.set('product:1', { id: 1 });

      const deletedCount = await testCache.deletePattern('user:*');

      expect(deletedCount).toBe(2);

      const exists1 = await testCache.exists('user:1');
      const exists2 = await testCache.exists('user:2');
      const exists3 = await testCache.exists('product:1');

      expect(exists1).toBe(false);
      expect(exists2).toBe(false);
      expect(exists3).toBe(true);
    });
  });

  describe('SessionStore', () => {
    const testStore = new SessionStore();

    beforeEach(async () => {
      // Clean up test sessions
      const redis = RedisClient.getInstance();
      const keys = await redis.keys('session:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    });

    it('should create and retrieve a session', async () => {
      const sessionId = 'test-session-123';
      const sessionData = {
        userId: 'user-1',
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      await testStore.createSession(sessionId, sessionData);

      const retrieved = await testStore.getSession(sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.userId).toBe(sessionData.userId);
      expect(retrieved?.email).toBe(sessionData.email);
    });

    it('should return null for non-existent session', async () => {
      const session = await testStore.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should update a session', async () => {
      const sessionId = 'update-test';
      await testStore.createSession(sessionId, {
        userId: 'user-1',
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      await testStore.updateSession(sessionId, { role: 'admin' });

      const updated = await testStore.getSession(sessionId);
      expect(updated?.role).toBe('admin');
    });

    it('should delete a session', async () => {
      const sessionId = 'delete-test';
      await testStore.createSession(sessionId, {
        userId: 'user-1',
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      await testStore.deleteSession(sessionId);

      const exists = await testStore.sessionExists(sessionId);
      expect(exists).toBe(false);
    });

    it('should get all user sessions', async () => {
      const userId = 'user-multi';

      await testStore.createSession('session-1', {
        userId,
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      await testStore.createSession('session-2', {
        userId,
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      const sessions = await testStore.getUserSessions(userId);

      expect(sessions.length).toBe(2);
      expect(sessions.every(s => s.data.userId === userId)).toBe(true);
    });

    it('should delete all user sessions', async () => {
      const userId = 'user-delete-all';

      await testStore.createSession('session-1', {
        userId,
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      await testStore.createSession('session-2', {
        userId,
        email: 'test@example.com',
        role: 'seller',
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      });

      const deletedCount = await testStore.deleteUserSessions(userId);
      expect(deletedCount).toBe(2);

      const sessions = await testStore.getUserSessions(userId);
      expect(sessions.length).toBe(0);
    });
  });

  describe('CacheKeys Helper', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKeys.user('123')).toBe('user:123');
      expect(CacheKeys.userByEmail('test@example.com')).toBe('user:email:test@example.com');
      expect(CacheKeys.part('part-456')).toBe('part:part-456');
      expect(CacheKeys.vehicle('vehicle-789')).toBe('vehicle:vehicle-789');
    });

    it('should generate search keys with filters', () => {
      const filters = { make: 'Toyota', year: 2020 };
      const key = CacheKeys.search('engine', filters);

      expect(key).toContain('search:engine:');
      expect(key.length).toBeGreaterThan(20);
    });
  });
});
