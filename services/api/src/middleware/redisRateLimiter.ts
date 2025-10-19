import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { RedisClient } from '../config/redis';

/**
 * Production-ready Redis-based rate limiter
 * Falls back to in-memory rate limiter if Redis is unavailable
 */

// Rate limiter instances
let authLimiter: RateLimiterRedis | RateLimiterMemory;
let generalLimiter: RateLimiterRedis | RateLimiterMemory;
let apiLimiter: RateLimiterRedis | RateLimiterMemory;

// Configuration
const RATE_LIMIT_CONFIG = {
  auth: {
    points: parseInt(process.env.RATE_LIMIT_AUTH_POINTS || '5'), // 5 attempts
    duration: parseInt(process.env.RATE_LIMIT_AUTH_DURATION || '900'), // 15 minutes
    blockDuration: parseInt(process.env.RATE_LIMIT_AUTH_BLOCK || '900'), // 15 minutes
  },
  general: {
    points: parseInt(process.env.RATE_LIMIT_GENERAL_POINTS || '100'), // 100 requests
    duration: parseInt(process.env.RATE_LIMIT_GENERAL_DURATION || '900'), // 15 minutes
  },
  api: {
    points: parseInt(process.env.RATE_LIMIT_API_POINTS || '1000'), // 1000 requests
    duration: parseInt(process.env.RATE_LIMIT_API_DURATION || '3600'), // 1 hour
  },
};

/**
 * Initialize rate limiters with Redis or fallback to memory
 */
async function initializeRateLimiters(): Promise<void> {
  try {
    // Check if Redis is available
    const isRedisHealthy = await RedisClient.healthCheck();

    if (isRedisHealthy) {
      console.log('Initializing Redis-based rate limiters');
      const redisClient = RedisClient.getInstance();

      // Auth rate limiter (strict for login/register)
      authLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:auth:',
        points: RATE_LIMIT_CONFIG.auth.points,
        duration: RATE_LIMIT_CONFIG.auth.duration,
        blockDuration: RATE_LIMIT_CONFIG.auth.blockDuration,
      });

      // General API rate limiter
      generalLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:general:',
        points: RATE_LIMIT_CONFIG.general.points,
        duration: RATE_LIMIT_CONFIG.general.duration,
      });

      // High-volume API rate limiter (for trusted clients)
      apiLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rl:api:',
        points: RATE_LIMIT_CONFIG.api.points,
        duration: RATE_LIMIT_CONFIG.api.duration,
      });

      console.log('Redis-based rate limiters initialized successfully');
    } else {
      throw new Error('Redis health check failed');
    }
  } catch (error) {
    console.warn('Redis unavailable, falling back to in-memory rate limiters:', error);

    // Fallback to in-memory rate limiters
    authLimiter = new RateLimiterMemory({
      points: RATE_LIMIT_CONFIG.auth.points,
      duration: RATE_LIMIT_CONFIG.auth.duration,
      blockDuration: RATE_LIMIT_CONFIG.auth.blockDuration,
    });

    generalLimiter = new RateLimiterMemory({
      points: RATE_LIMIT_CONFIG.general.points,
      duration: RATE_LIMIT_CONFIG.general.duration,
    });

    apiLimiter = new RateLimiterMemory({
      points: RATE_LIMIT_CONFIG.api.points,
      duration: RATE_LIMIT_CONFIG.api.duration,
    });

    console.log('In-memory rate limiters initialized');
  }
}

// Initialize rate limiters on module load
initializeRateLimiters().catch(console.error);

/**
 * Get client identifier from request
 */
function getClientKey(req: Request): string {
  // Use API key if provided (for authenticated API clients)
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Use user ID if authenticated (from auth middleware)
  const user = (req as any).user;
  if (user && user.id) {
    return `user:${user.id}`;
  }

  // Fall back to IP address
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Determine which rate limiter to use based on the request
 */
function getRateLimiter(req: Request): RateLimiterRedis | RateLimiterMemory {
  const path = req.path;

  // Auth endpoints get strictest limits
  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/password')) {
    return authLimiter;
  }

  // API key authenticated requests get higher limits
  if (req.headers['x-api-key']) {
    return apiLimiter;
  }

  // Default to general limiter
  return generalLimiter;
}

/**
 * Get rate limit configuration for the current limiter
 */
function getRateLimitConfig(limiter: RateLimiterRedis | RateLimiterMemory): {
  points: number;
  duration: number;
  blockDuration?: number;
} {
  if (limiter === authLimiter) {
    return RATE_LIMIT_CONFIG.auth;
  } else if (limiter === apiLimiter) {
    return RATE_LIMIT_CONFIG.api;
  } else {
    return RATE_LIMIT_CONFIG.general;
  }
}

/**
 * Express middleware for rate limiting
 */
export const redisRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    const clientKey = getClientKey(req);
    const limiter = getRateLimiter(req);
    const config = getRateLimitConfig(limiter);

    // Consume a point
    const rateLimiterRes = await limiter.consume(clientKey);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': String(config.points),
      'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints),
      'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
    });

    next();
  } catch (rateLimiterRes: any) {
    const config = getRateLimitConfig(getRateLimiter(req));

    // Extract error details
    const remainingPoints = rateLimiterRes?.remainingPoints || 0;
    const msBeforeNext = rateLimiterRes?.msBeforeNext || 0;

    // Set rate limit headers
    res.set({
      'Retry-After': String(Math.round(msBeforeNext / 1000) || 1),
      'X-RateLimit-Limit': String(config.points),
      'X-RateLimit-Remaining': String(remainingPoints),
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
    });

    // Log rate limit exceeded (for monitoring)
    console.warn(`Rate limit exceeded for ${getClientKey(req)} on ${req.path}`);

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000),
    });
  }
};

/**
 * Reset rate limit for a specific client (admin function)
 */
export async function resetRateLimit(clientKey: string): Promise<void> {
  try {
    await Promise.all([
      authLimiter.delete(clientKey),
      generalLimiter.delete(clientKey),
      apiLimiter.delete(clientKey),
    ]);
    console.log(`Rate limit reset for ${clientKey}`);
  } catch (error) {
    console.error(`Failed to reset rate limit for ${clientKey}:`, error);
    throw error;
  }
}

/**
 * Get current rate limit status for a client
 */
export async function getRateLimitStatus(clientKey: string): Promise<any> {
  try {
    const [authStatus, generalStatus, apiStatus] = await Promise.allSettled([
      authLimiter.get(clientKey),
      generalLimiter.get(clientKey),
      apiLimiter.get(clientKey),
    ]);

    return {
      auth: authStatus.status === 'fulfilled' ? authStatus.value : null,
      general: generalStatus.status === 'fulfilled' ? generalStatus.value : null,
      api: apiStatus.status === 'fulfilled' ? apiStatus.value : null,
    };
  } catch (error) {
    console.error(`Failed to get rate limit status for ${clientKey}:`, error);
    throw error;
  }
}

// Re-export for backward compatibility
export { initializeRateLimiters };
