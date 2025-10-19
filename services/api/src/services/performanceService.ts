import { performance } from 'perf_hooks';
import os from 'os';
import { prisma } from '@partpal/database';

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  endpoint: string;
  method: string;
  statusCode: number;
  userId?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  dbQueryTime?: number;
  dbQueryCount?: number;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
    heap: NodeJS.MemoryUsage;
  };
  process: {
    uptime: number;
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  database: {
    connectionCount: number;
    activeQueries: number;
    avgResponseTime: number;
  };
}

export interface PerformanceAlert {
  type: 'high_response_time' | 'high_memory_usage' | 'high_cpu_usage' | 'slow_database_query' | 'high_error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  endpoint?: string;
}

export interface PerformanceSummary {
  period: '1h' | '6h' | '24h' | '7d';
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  slowestEndpoints: Array<{
    endpoint: string;
    averageResponseTime: number;
    callCount: number;
  }>;
  errors: {
    total: number;
    rate: number;
    topErrors: Array<{
      message: string;
      count: number;
    }>;
  };
  system: {
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
  };
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private readonly MAX_STORED_METRICS = 10000;
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private performanceStartTimes = new Map<string, number>();
  private dbQueryMetrics = new Map<string, { count: number; totalTime: number }>();

  // Performance thresholds
  private readonly THRESHOLDS = {
    responseTime: 2000, // 2 seconds
    memoryUsage: 0.85, // 85% of available memory
    cpuUsage: 0.8, // 80% CPU usage
    dbQueryTime: 1000, // 1 second
    errorRate: 0.05, // 5% error rate
  };

  constructor() {
    this.startSystemMonitoring();
    this.startPeriodicCleanup();
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  recordRequestStart(requestId: string): void {
    this.performanceStartTimes.set(requestId, performance.now());
  }

  recordRequestEnd(
    requestId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    userId?: string
  ): PerformanceMetrics {
    const endTime = performance.now();
    const startTime = this.performanceStartTimes.get(requestId) || endTime;
    const responseTime = endTime - startTime;

    this.performanceStartTimes.delete(requestId);

    const dbMetrics = this.dbQueryMetrics.get(requestId);
    this.dbQueryMetrics.delete(requestId);

    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      responseTime,
      endpoint,
      method,
      statusCode,
      userId,
      memoryUsage: process.memoryUsage(),
      cpuUsage: this.getCurrentCpuUsage(),
      dbQueryTime: dbMetrics?.totalTime,
      dbQueryCount: dbMetrics?.count,
    };

    this.metrics.push(metric);
    this.checkPerformanceThresholds(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_STORED_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_STORED_METRICS);
    }

    return metric;
  }

  recordDatabaseQuery(requestId: string, queryTime: number): void {
    const existing = this.dbQueryMetrics.get(requestId) || { count: 0, totalTime: 0 };
    this.dbQueryMetrics.set(requestId, {
      count: existing.count + 1,
      totalTime: existing.totalTime + queryTime,
    });
  }

  private getCurrentCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return 1 - (totalIdle / totalTick);
  }

  private getCurrentSystemMetrics(): SystemMetrics {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      timestamp: new Date(),
      cpu: {
        usage: this.getCurrentCpuUsage(),
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: usedMemory / totalMemory,
        heap: process.memoryUsage(),
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      database: {
        connectionCount: this.getDatabaseConnectionCount(),
        activeQueries: this.getActiveQueryCount(),
        avgResponseTime: this.getAverageDatabaseResponseTime(),
      },
    };
  }

  private getDatabaseConnectionCount(): number {
    // This would require integration with Prisma's connection pool
    return 10; // Placeholder
  }

  private getActiveQueryCount(): number {
    // This would require integration with database monitoring
    return this.dbQueryMetrics.size;
  }

  private getAverageDatabaseResponseTime(): number {
    const recentMetrics = this.metrics.slice(-100);
    const dbMetrics = recentMetrics.filter(m => m.dbQueryTime !== undefined);

    if (dbMetrics.length === 0) return 0;

    const totalTime = dbMetrics.reduce((sum, m) => sum + (m.dbQueryTime || 0), 0);
    return totalTime / dbMetrics.length;
  }

  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check response time
    if (metric.responseTime > this.THRESHOLDS.responseTime) {
      alerts.push({
        type: 'high_response_time',
        severity: metric.responseTime > this.THRESHOLDS.responseTime * 2 ? 'critical' : 'high',
        message: `High response time detected: ${metric.responseTime.toFixed(2)}ms`,
        value: metric.responseTime,
        threshold: this.THRESHOLDS.responseTime,
        timestamp: new Date(),
        endpoint: metric.endpoint,
      });
    }

    // Check memory usage
    const memoryUsagePercent = metric.memoryUsage.heapUsed / metric.memoryUsage.heapTotal;
    if (memoryUsagePercent > this.THRESHOLDS.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        severity: memoryUsagePercent > 0.95 ? 'critical' : 'high',
        message: `High memory usage: ${(memoryUsagePercent * 100).toFixed(1)}%`,
        value: memoryUsagePercent,
        threshold: this.THRESHOLDS.memoryUsage,
        timestamp: new Date(),
      });
    }

    // Check CPU usage
    if (metric.cpuUsage > this.THRESHOLDS.cpuUsage) {
      alerts.push({
        type: 'high_cpu_usage',
        severity: metric.cpuUsage > 0.95 ? 'critical' : 'high',
        message: `High CPU usage: ${(metric.cpuUsage * 100).toFixed(1)}%`,
        value: metric.cpuUsage,
        threshold: this.THRESHOLDS.cpuUsage,
        timestamp: new Date(),
      });
    }

    // Check database query time
    if (metric.dbQueryTime && metric.dbQueryTime > this.THRESHOLDS.dbQueryTime) {
      alerts.push({
        type: 'slow_database_query',
        severity: metric.dbQueryTime > this.THRESHOLDS.dbQueryTime * 2 ? 'critical' : 'medium',
        message: `Slow database query: ${metric.dbQueryTime.toFixed(2)}ms`,
        value: metric.dbQueryTime,
        threshold: this.THRESHOLDS.dbQueryTime,
        timestamp: new Date(),
        endpoint: metric.endpoint,
      });
    }

    this.alerts.push(...alerts);

    // Log critical alerts
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        console.error('CRITICAL PERFORMANCE ALERT:', alert);
      }
    });
  }

  private startSystemMonitoring(): void {
    setInterval(() => {
      const systemMetric = this.getCurrentSystemMetrics();
      this.systemMetrics.push(systemMetric);

      // Keep only last 24 hours of system metrics (1 per minute)
      if (this.systemMetrics.length > 1440) {
        this.systemMetrics = this.systemMetrics.slice(-1440);
      }
    }, 60000); // Every minute
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Clean old metrics
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
      this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
      this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);

      console.log('Performance metrics cleanup completed');
    }, this.CLEANUP_INTERVAL);
  }

  getMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return this.alerts;
  }

  getSystemMetrics(limit: number = 60): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  getPerformanceSummary(period: PerformanceSummary['period'] = '1h'): PerformanceSummary {
    const periodMs = this.getPeriodMs(period);
    const cutoffTime = new Date(Date.now() - periodMs);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    const averageResponseTime = totalRequests > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
      : 0;

    // Group by endpoint for slowest endpoints
    const endpointMetrics = new Map<string, { times: number[]; count: number }>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointMetrics.has(key)) {
        endpointMetrics.set(key, { times: [], count: 0 });
      }
      const endpoint = endpointMetrics.get(key)!;
      endpoint.times.push(m.responseTime);
      endpoint.count++;
    });

    const slowestEndpoints = Array.from(endpointMetrics.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        averageResponseTime: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
        callCount: data.count,
      }))
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
      .slice(0, 10);

    // System metrics
    const recentSystemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);
    const averageCpuUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentSystemMetrics.length
      : 0;

    const averageMemoryUsage = recentSystemMetrics.length > 0
      ? recentSystemMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / recentSystemMetrics.length
      : 0;

    const peakMemoryUsage = recentSystemMetrics.length > 0
      ? Math.max(...recentSystemMetrics.map(m => m.memory.usagePercent))
      : 0;

    return {
      period,
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: failedRequests,
        averageResponseTime,
      },
      slowestEndpoints,
      errors: {
        total: failedRequests,
        rate: totalRequests > 0 ? failedRequests / totalRequests : 0,
        topErrors: [], // Would need error logging integration
      },
      system: {
        averageCpuUsage,
        averageMemoryUsage,
        peakMemoryUsage,
      },
    };
  }

  private getPeriodMs(period: PerformanceSummary['period']): number {
    switch (period) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getDatabasePerformanceMetrics() {
    try {
      // Get slow query log (this would need database-specific implementation)
      const slowQueries = [];

      // Get connection pool status
      const connectionStats = {
        total: 10, // Would get from Prisma
        active: 5,
        idle: 5,
      };

      return {
        slowQueries,
        connectionPool: connectionStats,
        averageQueryTime: this.getAverageDatabaseResponseTime(),
      };
    } catch (error) {
      console.error('Failed to get database performance metrics:', error);
      return null;
    }
  }
}

export const performanceService = PerformanceService.getInstance();