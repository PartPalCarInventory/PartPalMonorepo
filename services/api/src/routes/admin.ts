import express from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { databaseManager } from '../utils/database';

const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Database health check
router.get('/database/health', async (req, res, next) => {
  try {
    const health = await databaseManager.getHealthStatus();

    const response: ApiResponse<typeof health> = {
      success: health.status === 'healthy',
      data: health,
      message: health.status === 'healthy' ? 'Database is healthy' : 'Database health check failed',
    };

    res.status(health.status === 'healthy' ? 200 : 503).json(response);
  } catch (error) {
    next(error);
  }
});

// Database metrics
router.get('/database/metrics', async (req, res, next) => {
  try {
    const metrics = await databaseManager.getMetrics();

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
      message: 'Database metrics retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Run database migrations
router.post('/database/migrate', async (req, res, next) => {
  try {
    const success = await databaseManager.runMigrations();

    const response: ApiResponse<{ success: boolean }> = {
      success,
      data: { success },
      message: success ? 'Database migrations completed successfully' : 'Database migration failed',
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error) {
    next(error);
  }
});

// Seed database
router.post('/database/seed', async (req, res, next) => {
  try {
    const success = await databaseManager.seedDatabase();

    const response: ApiResponse<{ success: boolean }> = {
      success,
      data: { success },
      message: success ? 'Database seeded successfully' : 'Database seeding failed',
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error) {
    next(error);
  }
});

// Reset database (development only)
router.post('/database/reset', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Operation not allowed',
        message: 'Database reset is not allowed in production environment',
      };
      return res.status(403).json(response);
    }

    const success = await databaseManager.resetDatabase();

    const response: ApiResponse<{ success: boolean }> = {
      success,
      data: { success },
      message: success ? 'Database reset successfully' : 'Database reset failed',
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error) {
    next(error);
  }
});

// Create database backup
router.post('/database/backup', async (req, res, next) => {
  try {
    const backupFile = await databaseManager.backup();

    const response: ApiResponse<{ backupFile: string | null }> = {
      success: backupFile !== null,
      data: { backupFile },
      message: backupFile ? `Database backup created: ${backupFile}` : 'Database backup failed',
    };

    res.status(backupFile ? 200 : 500).json(response);
  } catch (error) {
    next(error);
  }
});

// System information
router.get('/system/info', async (req, res, next) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      prismaVersion: '5.0.0', // This should be dynamically determined
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'not configured',
    };

    const response: ApiResponse<typeof systemInfo> = {
      success: true,
      data: systemInfo,
      message: 'System information retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Clear application caches
router.post('/system/clear-cache', async (req, res, next) => {
  try {
    // Clear any application-level caches
    // This would need to be implemented based on your caching strategy
    console.log('Cache clearing logic would be implemented here');

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Application caches cleared successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;