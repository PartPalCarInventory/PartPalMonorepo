import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

// Different rate limits for different endpoint types
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

const generalLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 900, // Per 15 minutes
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  try {
    const key = req.ip || 'unknown';

    // Apply stricter rate limiting to auth endpoints
    if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
      await authLimiter.consume(key);
    } else {
      await generalLimiter.consume(key);
    }
    next();
  } catch (rateLimiterRes: any) {
    const remainingPoints = rateLimiterRes?.remainingPoints || 0;
    const msBeforeNext = rateLimiterRes?.msBeforeNext || 0;

    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': req.path.startsWith('/api/auth/') ? '5' : '100',
      'X-RateLimit-Remaining': String(remainingPoints),
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }
};