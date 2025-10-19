import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import { performanceService } from '../services/performanceService';

// Extend Prisma client with performance monitoring
export function createMonitoredPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Monitor query performance
  prisma.$on('query', (e) => {
    const queryTime = e.duration;
    const requestId = getCurrentRequestId(); // Would need to implement context passing

    if (requestId) {
      performanceService.recordDatabaseQuery(requestId, queryTime);
    }

    // Log slow queries
    if (queryTime > 1000) { // 1 second threshold
      console.warn(`Slow query detected (${queryTime}ms):`, {
        query: e.query,
        params: e.params,
        duration: queryTime,
        timestamp: e.timestamp,
      });
    }
  });

  // Monitor database errors
  prisma.$on('error', (e) => {
    console.error('Database error:', {
      message: e.message,
      timestamp: e.timestamp,
    });
  });

  // Monitor warnings
  prisma.$on('warn', (e) => {
    console.warn('Database warning:', {
      message: e.message,
      timestamp: e.timestamp,
    });
  });

  return prisma;
}

// Helper function to get current request ID from context
// This would need proper async context implementation
function getCurrentRequestId(): string | null {
  // In a real implementation, you would use AsyncLocalStorage or similar
  // to track request context across async operations
  return null;
}

// Query performance wrapper
export function withQueryMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId?: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      if (requestId) {
        performanceService.recordDatabaseQuery(requestId, queryTime);
      }

      // Log slow operations
      if (queryTime > 500) {
        console.warn(`Slow database operation: ${operationName} (${queryTime.toFixed(2)}ms)`);
      }

      resolve(result);
    } catch (error) {
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.error(`Database operation failed: ${operationName} (${queryTime.toFixed(2)}ms)`, error);
      reject(error);
    }
  });
}

// Batch operation monitoring
export async function withBatchMonitoring<T>(
  operations: Array<() => Promise<T>>,
  batchName: string,
  requestId?: string
): Promise<T[]> {
  const startTime = performance.now();

  try {
    const results = await Promise.all(operations.map(op => op()));
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    if (requestId) {
      performanceService.recordDatabaseQuery(requestId, totalTime);
    }

    console.log(`Batch operation completed: ${batchName} (${operations.length} operations, ${totalTime.toFixed(2)}ms)`);

    return results;
  } catch (error) {
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.error(`Batch operation failed: ${batchName} (${totalTime.toFixed(2)}ms)`, error);
    throw error;
  }
}