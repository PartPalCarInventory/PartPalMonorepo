import { Request, Response, NextFunction } from 'express';
import { performanceService } from '../services/performanceService';

interface PerformanceRequest extends Request {
  performanceId?: string;
  startTime?: number;
}

export const performanceMonitoring = (req: PerformanceRequest, res: Response, next: NextFunction) => {
  // Generate unique request ID
  const requestId = performanceService.generateRequestId();
  req.performanceId = requestId;

  // Record request start
  performanceService.recordRequestStart(requestId);

  // Override res.end to capture response metrics
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any): any {
    // Record request end
    const userId = (req as any).user?.id;
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    performanceService.recordRequestEnd(
      requestId,
      endpoint,
      method,
      statusCode,
      userId
    );

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const databaseQueryMonitoring = (queryTime: number, requestId?: string) => {
  if (requestId) {
    performanceService.recordDatabaseQuery(requestId, queryTime);
  }
};

// Middleware to add request ID to req object for database monitoring
export const addRequestContext = (req: PerformanceRequest, res: Response, next: NextFunction) => {
  // Make request ID available for database queries
  (req as any).requestId = req.performanceId;
  next();
};