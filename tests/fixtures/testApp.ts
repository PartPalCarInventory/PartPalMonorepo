import express, { Express } from 'express';
import cors from 'cors';
import { createMockApiRoutes } from './mockRoutes';

export function createTestApp(): Express {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test routes
  app.use('/api', createMockApiRoutes());

  // Error handling
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Test app error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  });

  return app;
}