import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper for Express routes
 * Catches promise rejections and forwards them to Express error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
