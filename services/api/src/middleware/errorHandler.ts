import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@partpal/shared-types';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
    res.status(400).json(response);
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid',
    };
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Token expired',
      message: 'Authentication token has expired',
    };
    res.status(401).json(response);
    return;
  }

  // Prisma errors
  if (error.code === 'P2002') {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
    };
    res.status(409).json(response);
    return;
  }

  // Default error response
  const response: ApiResponse<null> = {
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  };

  res.status(500).json(response);
};