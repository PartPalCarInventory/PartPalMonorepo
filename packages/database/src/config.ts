// Database Performance Configuration
export const DatabaseConfig = {
  // Connection Pool Settings
  connectionPool: {
    // Maximum number of connections in the pool
    max: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),

    // Minimum number of connections in the pool
    min: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '2'),

    // Maximum time a client can be idle before being released
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'), // 5 minutes

    // Time to wait for a connection from the pool
    connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'), // 10 seconds

    // Frequency to check for idle connections to close
    reapIntervalMillis: parseInt(process.env.DATABASE_REAP_INTERVAL || '10000'), // 10 seconds
  },

  // Query Performance Settings
  performance: {
    // Enable query result caching
    enableCaching: process.env.DATABASE_ENABLE_CACHING !== 'false',

    // Cache TTL in milliseconds
    cacheTTL: parseInt(process.env.DATABASE_CACHE_TTL || '300000'), // 5 minutes

    // Maximum cache size (number of entries)
    maxCacheSize: parseInt(process.env.DATABASE_MAX_CACHE_SIZE || '1000'),

    // Enable slow query logging
    logSlowQueries: process.env.DATABASE_LOG_SLOW_QUERIES === 'true',

    // Slow query threshold in milliseconds
    slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000'), // 1 second

    // Enable query statistics
    enableStats: process.env.DATABASE_ENABLE_STATS === 'true',
  },

  // Search Optimization Settings
  search: {
    // Default page size for search results
    defaultPageSize: parseInt(process.env.DATABASE_DEFAULT_PAGE_SIZE || '20'),

    // Maximum page size allowed
    maxPageSize: parseInt(process.env.DATABASE_MAX_PAGE_SIZE || '100'),

    // Enable full-text search optimizations
    enableFullTextSearch: process.env.DATABASE_ENABLE_FULLTEXT !== 'false',

    // Minimum query length for full-text search
    minQueryLength: parseInt(process.env.DATABASE_MIN_QUERY_LENGTH || '3'),

    // Maximum search results to cache
    maxSearchCache: parseInt(process.env.DATABASE_MAX_SEARCH_CACHE || '500'),
  },

  // Bulk Operations Settings
  bulk: {
    // Batch size for bulk operations
    batchSize: parseInt(process.env.DATABASE_BULK_BATCH_SIZE || '1000'),

    // Maximum concurrent bulk operations
    maxConcurrency: parseInt(process.env.DATABASE_BULK_MAX_CONCURRENCY || '5'),

    // Timeout for bulk operations in milliseconds
    timeout: parseInt(process.env.DATABASE_BULK_TIMEOUT || '30000'), // 30 seconds
  },

  // Monitoring Settings
  monitoring: {
    // Enable performance monitoring
    enabled: process.env.DATABASE_MONITORING_ENABLED === 'true',

    // Metrics collection interval in milliseconds
    interval: parseInt(process.env.DATABASE_MONITORING_INTERVAL || '60000'), // 1 minute

    // Enable database health checks
    healthChecks: process.env.DATABASE_HEALTH_CHECKS !== 'false',

    // Health check interval in milliseconds
    healthCheckInterval: parseInt(process.env.DATABASE_HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
  },

  // Environment-specific optimizations
  getOptimalSettings() {
    const env = process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        return {
          connectionPool: {
            ...this.connectionPool,
            max: Math.max(this.connectionPool.max, 30),
            min: Math.max(this.connectionPool.min, 5),
          },
          performance: {
            ...this.performance,
            enableCaching: true,
            logSlowQueries: true,
            enableStats: true,
          },
          monitoring: {
            ...this.monitoring,
            enabled: true,
            healthChecks: true,
          }
        };

      case 'staging':
        return {
          connectionPool: {
            ...this.connectionPool,
            max: Math.max(this.connectionPool.max, 15),
            min: Math.max(this.connectionPool.min, 3),
          },
          performance: {
            ...this.performance,
            enableCaching: true,
            logSlowQueries: true,
          },
          monitoring: {
            ...this.monitoring,
            enabled: true,
          }
        };

      case 'development':
      default:
        return {
          connectionPool: {
            ...this.connectionPool,
            max: Math.min(this.connectionPool.max, 10),
            min: Math.min(this.connectionPool.min, 2),
          },
          performance: {
            ...this.performance,
            enableCaching: false, // Disable caching in development
            logSlowQueries: true,
            slowQueryThreshold: 500, // Lower threshold for development
          },
          monitoring: {
            ...this.monitoring,
            enabled: false,
          }
        };
    }
  }
};

// Database URL parsing and validation
export const validateDatabaseConfig = () => {
  const requiredEnvVars = ['DATABASE_URL'];
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  return true;
};

// Connection health check
export const checkDatabaseHealth = async (prisma: any) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default DatabaseConfig;