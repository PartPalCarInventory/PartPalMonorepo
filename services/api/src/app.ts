import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { redisRateLimiter } from './middleware/redisRateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { RedisClient } from './config/redis';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import protectedRoutes from './routes/protected';
import vehicleRoutes from './routes/vehicles';
import partRoutes from './routes/parts';
import sellerRoutes from './routes/sellers';
import searchRoutes from './routes/search';
import categoryRoutes from './routes/categories';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import monitoringRoutes from './routes/monitoring';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import marketplaceRoutes from './routes/marketplace';
import analyticsRoutes from './routes/analytics';
import locationRoutes from './routes/location';
import { databaseManager } from './utils/database';
import { performanceMonitoring, addRequestContext } from './middleware/performanceMiddleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

// Rate limiting (Redis-based for production)
app.use(redisRateLimiter);

// Performance monitoring
app.use(performanceMonitoring);
app.use(addRequestContext);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check with database and Redis status
app.get('/health', async (_req, res) => {
  try {
    const [dbHealth, redisHealthy] = await Promise.all([
      databaseManager.getHealthStatus(),
      RedisClient.healthCheck(),
    ]);

    const isHealthy = dbHealth.status === 'healthy' && redisHealthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'OK' : 'Degraded',
      database: dbHealth.status,
      redis: redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'Error',
      database: 'unknown',
      redis: 'unknown',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes - Public marketplace routes (no auth required)
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/location', locationRoutes);

// API routes - Protected routes (auth required)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', protectedRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
