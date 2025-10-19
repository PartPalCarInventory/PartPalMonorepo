import { DatabaseConfig, checkDatabaseHealth } from './config';

// Database performance monitoring and metrics collection
export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  rowsAffected?: number;
  parameters?: any;
}

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number; // queries per second
  };
}

export class DatabaseMonitor {
  private metrics: QueryMetrics[] = [];
  private connectionMetrics = {
    active: 0,
    idle: 0,
    total: 0,
    waiting: 0
  };
  private cacheMetrics = {
    hits: 0,
    misses: 0,
    size: 0
  };
  private readonly maxMetricsHistory = 10000;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private config = DatabaseConfig.monitoring) {
    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  // Record query execution metrics
  recordQuery(metrics: QueryMetrics): void {
    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow queries
    if (metrics.duration > DatabaseConfig.performance.slowQueryThreshold) {
      this.logSlowQuery(metrics);
    }
  }

  // Update connection pool metrics
  updateConnectionMetrics(metrics: Partial<DatabaseMetrics['connectionPool']>): void {
    this.connectionMetrics = { ...this.connectionMetrics, ...metrics };
  }

  // Update cache metrics
  updateCacheMetrics(hits: number, misses: number, size: number): void {
    this.cacheMetrics = { hits, misses, size };
  }

  // Get comprehensive database metrics
  getMetrics(timeWindow?: number): DatabaseMetrics {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    const relevantMetrics = this.metrics.filter(m =>
      m.timestamp.getTime() >= windowStart
    );

    const successful = relevantMetrics.filter(m => m.success);
    const failed = relevantMetrics.filter(m => !m.success);
    const durations = successful.map(m => m.duration);
    const slowQueries = durations.filter(d =>
      d > DatabaseConfig.performance.slowQueryThreshold
    );

    const sortedDurations = durations.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p99Index = Math.floor(sortedDurations.length * 0.99);

    return {
      connectionPool: this.connectionMetrics,
      queries: {
        total: relevantMetrics.length,
        successful: successful.length,
        failed: failed.length,
        averageDuration: durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
        slowQueries: slowQueries.length
      },
      cache: {
        ...this.cacheMetrics,
        hitRate: this.cacheMetrics.hits + this.cacheMetrics.misses > 0
          ? this.cacheMetrics.hits / (this.cacheMetrics.hits + this.cacheMetrics.misses)
          : 0
      },
      performance: {
        averageResponseTime: durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0,
        p95ResponseTime: sortedDurations[p95Index] || 0,
        p99ResponseTime: sortedDurations[p99Index] || 0,
        throughput: timeWindow && timeWindow > 0
          ? (relevantMetrics.length / (timeWindow / 1000))
          : 0
      }
    };
  }

  // Get slow query report
  getSlowQueries(limit = 10, timeWindow?: number): QueryMetrics[] {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    return this.metrics
      .filter(m =>
        m.timestamp.getTime() >= windowStart &&
        m.duration > DatabaseConfig.performance.slowQueryThreshold
      )
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Get query frequency analysis
  getQueryFrequency(timeWindow?: number): Array<{ query: string; count: number; avgDuration: number }> {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    const relevantMetrics = this.metrics.filter(m =>
      m.timestamp.getTime() >= windowStart
    );

    const queryStats = new Map<string, { count: number; totalDuration: number }>();

    relevantMetrics.forEach(m => {
      const normalizedQuery = this.normalizeQuery(m.query);
      const stats = queryStats.get(normalizedQuery) || { count: 0, totalDuration: 0 };
      stats.count++;
      stats.totalDuration += m.duration;
      queryStats.set(normalizedQuery, stats);
    });

    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Generate performance alerts
  generateAlerts(): Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> {
    const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];
    const metrics = this.getMetrics(5 * 60 * 1000); // Last 5 minutes

    // High error rate
    if (metrics.queries.total > 0) {
      const errorRate = metrics.queries.failed / metrics.queries.total;
      if (errorRate > 0.05) { // 5% error rate
        alerts.push({
          type: 'high_error_rate',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.1 ? 'high' : 'medium'
        });
      }
    }

    // Slow average response time
    if (metrics.performance.averageResponseTime > 1000) {
      alerts.push({
        type: 'slow_response',
        message: `Average response time is ${metrics.performance.averageResponseTime.toFixed(0)}ms`,
        severity: metrics.performance.averageResponseTime > 2000 ? 'high' : 'medium'
      });
    }

    // High connection pool usage
    if (this.connectionMetrics.total > 0) {
      const poolUsage = this.connectionMetrics.active / this.connectionMetrics.total;
      if (poolUsage > 0.8) {
        alerts.push({
          type: 'high_pool_usage',
          message: `Connection pool usage is ${(poolUsage * 100).toFixed(1)}%`,
          severity: poolUsage > 0.9 ? 'high' : 'medium'
        });
      }
    }

    // Low cache hit rate
    if (metrics.cache.hitRate < 0.5 && (metrics.cache.hits + metrics.cache.misses) > 100) {
      alerts.push({
        type: 'low_cache_hit_rate',
        message: `Cache hit rate is ${(metrics.cache.hitRate * 100).toFixed(1)}%`,
        severity: metrics.cache.hitRate < 0.3 ? 'medium' : 'low'
      });
    }

    // Too many slow queries
    if (metrics.queries.total > 0) {
      const slowQueryRate = metrics.queries.slowQueries / metrics.queries.total;
      if (slowQueryRate > 0.1) { // 10% slow queries
        alerts.push({
          type: 'high_slow_query_rate',
          message: `${(slowQueryRate * 100).toFixed(1)}% of queries are slow`,
          severity: slowQueryRate > 0.2 ? 'high' : 'medium'
        });
      }
    }

    return alerts;
  }

  // Health check
  async performHealthCheck(prisma: any): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{ name: string; status: boolean; details?: string }>;
    metrics: DatabaseMetrics;
  }> {
    const checks = [];

    // Database connectivity
    const dbHealth = await checkDatabaseHealth(prisma);
    checks.push({
      name: 'database_connectivity',
      status: dbHealth.status === 'healthy',
      details: dbHealth.error || `Latency: ${Date.now() - (dbHealth.latency || 0)}ms`
    });

    // Connection pool health
    const poolHealthy = this.connectionMetrics.total > 0 &&
                       this.connectionMetrics.active / this.connectionMetrics.total < 0.9;
    checks.push({
      name: 'connection_pool',
      status: poolHealthy,
      details: `${this.connectionMetrics.active}/${this.connectionMetrics.total} connections active`
    });

    // Query performance
    const metrics = this.getMetrics(5 * 60 * 1000); // Last 5 minutes
    const performanceHealthy = metrics.performance.averageResponseTime < 1000;
    checks.push({
      name: 'query_performance',
      status: performanceHealthy,
      details: `Average response time: ${metrics.performance.averageResponseTime.toFixed(0)}ms`
    });

    const healthyChecks = checks.filter(c => c.status).length;
    const totalChecks = checks.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      metrics
    };
  }

  // Start monitoring
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  // Collect periodic metrics
  private collectMetrics(): void {
    const metrics = this.getMetrics(this.config.interval);

    if (DatabaseConfig.performance.enableStats) {
      console.log('Database Metrics:', {
        timestamp: new Date().toISOString(),
        queries: metrics.queries,
        performance: metrics.performance,
        cache: metrics.cache
      });
    }

    // Generate and log alerts
    const alerts = this.generateAlerts();
    if (alerts.length > 0) {
      console.warn('Database Alerts:', alerts);
    }
  }

  // Log slow queries
  private logSlowQuery(metrics: QueryMetrics): void {
    if (DatabaseConfig.performance.logSlowQueries) {
      console.warn('Slow Query Detected:', {
        duration: `${metrics.duration}ms`,
        query: this.normalizeQuery(metrics.query),
        timestamp: metrics.timestamp.toISOString(),
        parameters: metrics.parameters
      });
    }
  }

  // Normalize query for grouping (remove parameters)
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace Prisma parameters
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

// Query execution wrapper with monitoring
export const withMonitoring = <T extends any[], R>(
  monitor: DatabaseMonitor,
  queryName: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      monitor.recordQuery({
        query: queryName,
        duration,
        timestamp,
        success: true,
        rowsAffected: Array.isArray(result) ? result.length : 1
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      monitor.recordQuery({
        query: queryName,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  };
};

// Global monitor instance
export const databaseMonitor = new DatabaseMonitor();

export default DatabaseMonitor;