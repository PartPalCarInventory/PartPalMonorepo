import { RedisClient } from '../config/redis';

/**
 * Redis-based session storage for PartPal API
 * Provides secure, distributed session management
 */

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  sellerId?: string;
  createdAt: number;
  lastAccessedAt: number;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

export class SessionStore {
  private readonly keyPrefix = 'session:';
  private readonly defaultTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Create a new session
   */
  async createSession(sessionId: string, data: SessionData, ttl?: number): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);

    const sessionData = {
      ...data,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    await redis.setex(key, ttl || this.defaultTTL, JSON.stringify(sessionData));
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);

    const data = await redis.get(key);
    if (!data) {
      return null;
    }

    const sessionData = JSON.parse(data) as SessionData;

    // Update last accessed time
    sessionData.lastAccessedAt = Date.now();
    await redis.setex(key, this.defaultTTL, JSON.stringify(sessionData));

    return sessionData;
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);

    const existingData = await this.getSession(sessionId);
    if (!existingData) {
      throw new Error('Session not found');
    }

    const updatedData = {
      ...existingData,
      ...data,
      lastAccessedAt: Date.now(),
    };

    await redis.setex(key, this.defaultTTL, JSON.stringify(updatedData));
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);
    await redis.del(key);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    const redis = RedisClient.getInstance();
    const pattern = `${this.keyPrefix}*`;

    let deletedCount = 0;
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

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const sessionData = JSON.parse(data) as SessionData;
          if (sessionData.userId === userId) {
            await redis.del(key);
            deletedCount++;
          }
        }
      }
    } while (cursor !== '0');

    return deletedCount;
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, ttl?: number): Promise<void> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);
    await redis.expire(key, ttl || this.defaultTTL);
  }

  /**
   * Get session TTL (remaining time in seconds)
   */
  async getSessionTTL(sessionId: string): Promise<number> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);
    return redis.ttl(key);
  }

  /**
   * Check if session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const redis = RedisClient.getInstance();
    const key = this.getKey(sessionId);
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Array<{ sessionId: string; data: SessionData }>> {
    const redis = RedisClient.getInstance();
    const pattern = `${this.keyPrefix}*`;

    const sessions: Array<{ sessionId: string; data: SessionData }> = [];
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

      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const sessionData = JSON.parse(data) as SessionData;
          if (sessionData.userId === userId) {
            const sessionId = key.replace(this.keyPrefix, '');
            sessions.push({ sessionId, data: sessionData });
          }
        }
      }
    } while (cursor !== '0');

    return sessions;
  }

  /**
   * Get total number of active sessions
   */
  async getActiveSessionCount(): Promise<number> {
    const redis = RedisClient.getInstance();
    const pattern = `${this.keyPrefix}*`;

    let count = 0;
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
      count += keys.length;
    } while (cursor !== '0');

    return count;
  }

  /**
   * Clean up expired sessions (manual cleanup if needed)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // Redis automatically removes expired keys, but this can be used for manual cleanup
    const redis = RedisClient.getInstance();
    const pattern = `${this.keyPrefix}*`;

    let deletedCount = 0;
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

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        // Delete sessions with very short TTL (less than 1 minute)
        if (ttl > 0 && ttl < 60) {
          await redis.del(key);
          deletedCount++;
        }
      }
    } while (cursor !== '0');

    return deletedCount;
  }

  /**
   * Get session key
   */
  private getKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();
