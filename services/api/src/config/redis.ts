import Redis, { RedisOptions } from 'ioredis';

/**
 * Redis Configuration for PartPal API
 * Provides connection pooling, retry strategy, and monitoring
 */

// Redis configuration options
const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,

  // Retry strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Reconnect on error
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some(targetError => err.message.includes(targetError));
  },

  // Performance optimizations
  lazyConnect: false,
  keepAlive: 30000,
  family: 4, // Use IPv4
};

// Create Redis client instance
class RedisClient {
  private static instance: Redis | null = null;
  private static subscriber: Redis | null = null;

  /**
   * Get the singleton Redis client instance
   */
  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisOptions);

      // Event handlers
      this.instance.on('connect', () => {
        console.log('Redis client connected');
      });

      this.instance.on('ready', () => {
        console.log('Redis client ready');
      });

      this.instance.on('error', (err) => {
        console.error('Redis client error:', err);
      });

      this.instance.on('close', () => {
        console.log('Redis client connection closed');
      });

      this.instance.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
      });
    }

    return this.instance;
  }

  /**
   * Get a separate subscriber instance for pub/sub operations
   */
  static getSubscriber(): Redis {
    if (!this.subscriber) {
      this.subscriber = new Redis(redisOptions);

      this.subscriber.on('error', (err) => {
        console.error('Redis subscriber error:', err);
      });
    }

    return this.subscriber;
  }

  /**
   * Check Redis connection health
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const client = this.getInstance();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get Redis server info
   */
  static async getInfo(): Promise<Record<string, any>> {
    try {
      const client = this.getInstance();
      const info = await client.info();

      // Parse info string into object
      const lines = info.split('\r\n');
      const result: Record<string, any> = {};

      for (const line of lines) {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':');
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get Redis info:', error);
      return {};
    }
  }

  /**
   * Gracefully close Redis connections
   */
  static async disconnect(): Promise<void> {
    try {
      if (this.instance) {
        await this.instance.quit();
        this.instance = null;
      }

      if (this.subscriber) {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      console.log('Redis connections closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connections:', error);
    }
  }

  /**
   * Clear all data in the current database (use with caution)
   */
  static async flushDB(): Promise<void> {
    const client = this.getInstance();
    await client.flushdb();
  }
}

// Export the Redis client
export const redisClient = RedisClient.getInstance();
export const redisSubscriber = RedisClient.getSubscriber();
export { RedisClient };

// Export for use in other modules
export default RedisClient;
