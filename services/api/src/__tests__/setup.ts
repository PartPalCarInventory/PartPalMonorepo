import { beforeAll } from 'vitest';

// Setup test environment variables
beforeAll(() => {
  // JWT Configuration for testing
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  process.env.JWT_EXPIRES_IN = '15m';

  // Database - tests should use the DATABASE_URL from .env or default
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./test.db';
  }

  // Node environment
  process.env.NODE_ENV = 'test';

  // Port configuration
  process.env.PORT = '3334';

  // CORS
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';

  // Frontend URLs
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.IMS_FRONTEND_URL = 'http://localhost:3001';
  process.env.API_BASE_URL = 'http://localhost:3334';

  // Disable external services for testing
  process.env.SMTP_HOST = '';
  process.env.CLOUDINARY_CLOUD_NAME = '';
  process.env.MAPBOX_ACCESS_TOKEN = '';
  process.env.GOOGLE_ANALYTICS_ID = '';
});
