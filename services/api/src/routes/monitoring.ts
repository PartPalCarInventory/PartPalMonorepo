import express from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { performanceService } from '../services/performanceService';
import { databaseManager } from '../utils/database';
import { performanceReporter } from '../utils/performanceReporter';

const router = express.Router();

// All monitoring routes require ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get performance metrics overview
router.get('/performance/overview', async (req, res, next) => {
  try {
    const period = (req.query.period as any) || '1h';
    const summary = performanceService.getPerformanceSummary(period);

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
      message: 'Performance overview retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get detailed performance metrics
router.get('/performance/metrics', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const metrics = performanceService.getMetrics(limit);

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
      message: 'Performance metrics retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get system metrics
router.get('/system/metrics', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 60;
    const systemMetrics = performanceService.getSystemMetrics(limit);

    const response: ApiResponse<typeof systemMetrics> = {
      success: true,
      data: systemMetrics,
      message: 'System metrics retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get current system status
router.get('/system/status', async (req, res, next) => {
  try {
    const [dbHealth, dbMetrics] = await Promise.all([
      databaseManager.getHealthStatus(),
      databaseManager.getMetrics(),
    ]);

    const systemMetrics = performanceService.getSystemMetrics(1)[0];

    const status = {
      timestamp: new Date(),
      services: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime,
          connections: dbMetrics?.overview || {},
        },
        api: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
      system: systemMetrics || null,
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: 'System status retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get performance alerts
router.get('/performance/alerts', async (req, res, next) => {
  try {
    const severity = req.query.severity as any;
    const alerts = performanceService.getAlerts(severity);

    const response: ApiResponse<typeof alerts> = {
      success: true,
      data: alerts,
      message: 'Performance alerts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get database performance metrics
router.get('/database/performance', async (req, res, next) => {
  try {
    const dbPerformance = await performanceService.getDatabasePerformanceMetrics();

    const response: ApiResponse<typeof dbPerformance> = {
      success: true,
      data: dbPerformance,
      message: 'Database performance metrics retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get endpoint performance breakdown
router.get('/performance/endpoints', async (req, res, next) => {
  try {
    const period = (req.query.period as any) || '1h';
    const summary = performanceService.getPerformanceSummary(period);

    const endpointPerformance = {
      slowestEndpoints: summary.slowestEndpoints,
      totalRequests: summary.requests.total,
      averageResponseTime: summary.requests.averageResponseTime,
      errorRate: summary.errors.rate,
    };

    const response: ApiResponse<typeof endpointPerformance> = {
      success: true,
      data: endpointPerformance,
      message: 'Endpoint performance data retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get real-time metrics
router.get('/realtime/metrics', async (req, res, next) => {
  try {
    const recentMetrics = performanceService.getMetrics(10);
    const recentSystemMetrics = performanceService.getSystemMetrics(1);
    const currentAlerts = performanceService.getAlerts('high').concat(
      performanceService.getAlerts('critical')
    ).slice(-5);

    const realTimeData = {
      timestamp: new Date(),
      latestRequests: recentMetrics,
      currentSystem: recentSystemMetrics[0] || null,
      activeAlerts: currentAlerts,
      stats: {
        requestsLastMinute: recentMetrics.filter(
          m => Date.now() - m.timestamp.getTime() < 60000
        ).length,
        averageResponseTime: recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
          : 0,
      },
    };

    const response: ApiResponse<typeof realTimeData> = {
      success: true,
      data: realTimeData,
      message: 'Real-time metrics retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Performance health check for external monitoring
router.get('/health', async (req, res, next) => {
  try {
    const summary = performanceService.getPerformanceSummary('1h');
    const alerts = performanceService.getAlerts('critical');

    const healthStatus = {
      status: alerts.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date(),
      metrics: {
        averageResponseTime: summary.requests.averageResponseTime,
        errorRate: summary.errors.rate,
        criticalAlerts: alerts.length,
      },
      uptime: process.uptime(),
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus,
      message: `System is ${healthStatus.status}`,
    });
  } catch (error) {
    next(error);
  }
});

// Force garbage collection (development only)
router.post('/system/gc', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Operation not allowed',
        message: 'Garbage collection cannot be forced in production',
      };
      return res.status(403).json(response);
    }

    if (global.gc) {
      const memoryBefore = process.memoryUsage();
      global.gc();
      const memoryAfter = process.memoryUsage();

      const response: ApiResponse<{
        memoryBefore: NodeJS.MemoryUsage;
        memoryAfter: NodeJS.MemoryUsage;
        freed: number;
      }> = {
        success: true,
        data: {
          memoryBefore,
          memoryAfter,
          freed: memoryBefore.heapUsed - memoryAfter.heapUsed,
        },
        message: 'Garbage collection completed',
      };

      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: 'GC not available',
        message: 'Garbage collection is not exposed. Start with --expose-gc flag.',
      };
      res.status(400).json(response);
    }
  } catch (error) {
    next(error);
  }
});

// Generate performance report
router.get('/performance/report', async (req, res, next) => {
  try {
    const period = (req.query.period as any) || '24h';
    const format = req.query.format as string;

    const report = await performanceReporter.generateReport(period);

    if (format === 'html') {
      const htmlReport = await performanceReporter.generateHtmlReport(report);
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlReport);
    }

    const response: ApiResponse<typeof report> = {
      success: true,
      data: report,
      message: 'Performance report generated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Send performance report via email
router.post('/performance/report/email', async (req, res, next) => {
  try {
    const { email, period = '24h' } = req.body;

    if (!email) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Email required',
        message: 'Please provide an email address',
      };
      return res.status(400).json(response);
    }

    const success = await performanceReporter.sendPerformanceReport(email, period);

    const response: ApiResponse<{ sent: boolean }> = {
      success,
      data: { sent: success },
      message: success ? 'Performance report sent successfully' : 'Failed to send performance report',
    };

    res.status(success ? 200 : 500).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;