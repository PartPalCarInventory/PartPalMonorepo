import { PrismaClient } from '@prisma/client';
import { databaseMonitor } from './monitoring';
import { dbAuditLogger } from './security';

// Security monitoring and threat detection
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  metadata: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  SUSPICIOUS_LOGIN = 'suspicious_login',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNUSUAL_QUERY_PATTERN = 'unusual_query_pattern',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  MASS_DATA_ACCESS = 'mass_data_access',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  FAILED_AUTHENTICATION = 'failed_authentication'
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  type: SecurityEventType;
  enabled: boolean;
  threshold: number;
  timeWindow: number; // minutes
  conditions: any;
  actions: ThreatResponseAction[];
}

export enum ThreatResponseAction {
  LOG_EVENT = 'log_event',
  BLOCK_IP = 'block_ip',
  DISABLE_USER = 'disable_user',
  NOTIFY_ADMIN = 'notify_admin',
  FORCE_LOGOUT = 'force_logout',
  REQUIRE_2FA = 'require_2fa'
}

export class SecurityMonitor {
  private events: Map<string, SecurityEvent> = new Map();
  private detectionRules: ThreatDetectionRule[] = [];
  private loginAttempts: Map<string, Array<{ timestamp: Date; success: boolean }>> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();

  constructor(private prisma: PrismaClient) {
    this.initializeDetectionRules();
    this.startMonitoring();
  }

  // Initialize threat detection rules
  private initializeDetectionRules(): void {
    this.detectionRules = [
      {
        id: 'brute_force_detection',
        name: 'Brute Force Login Detection',
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        enabled: true,
        threshold: 5, // 5 failed attempts
        timeWindow: 15, // in 15 minutes
        conditions: { consecutiveFailures: true },
        actions: [
          ThreatResponseAction.LOG_EVENT,
          ThreatResponseAction.BLOCK_IP,
          ThreatResponseAction.NOTIFY_ADMIN
        ]
      },
      {
        id: 'sql_injection_detection',
        name: 'SQL Injection Attempt Detection',
        type: SecurityEventType.SQL_INJECTION_ATTEMPT,
        enabled: true,
        threshold: 1, // Any SQL injection attempt
        timeWindow: 1,
        conditions: { sqlPatterns: true },
        actions: [
          ThreatResponseAction.LOG_EVENT,
          ThreatResponseAction.BLOCK_IP,
          ThreatResponseAction.NOTIFY_ADMIN
        ]
      },
      {
        id: 'mass_data_access',
        name: 'Mass Data Access Detection',
        type: SecurityEventType.MASS_DATA_ACCESS,
        enabled: true,
        threshold: 1000, // More than 1000 records accessed
        timeWindow: 5, // in 5 minutes
        conditions: { recordCount: true },
        actions: [
          ThreatResponseAction.LOG_EVENT,
          ThreatResponseAction.NOTIFY_ADMIN
        ]
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Detection',
        type: SecurityEventType.PRIVILEGE_ESCALATION,
        enabled: true,
        threshold: 1,
        timeWindow: 1,
        conditions: { roleChange: true, adminAccess: true },
        actions: [
          ThreatResponseAction.LOG_EVENT,
          ThreatResponseAction.DISABLE_USER,
          ThreatResponseAction.NOTIFY_ADMIN
        ]
      },
      {
        id: 'unusual_query_pattern',
        name: 'Unusual Query Pattern Detection',
        type: SecurityEventType.UNUSUAL_QUERY_PATTERN,
        enabled: true,
        threshold: 50, // 50 complex queries
        timeWindow: 10, // in 10 minutes
        conditions: { complexQueries: true },
        actions: [
          ThreatResponseAction.LOG_EVENT,
          ThreatResponseAction.NOTIFY_ADMIN
        ]
      }
    ];
  }

  // Record login attempt
  recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const key = `${email}:${ipAddress}`;
    const attempts = this.loginAttempts.get(key) || [];

    attempts.push({ timestamp: new Date(), success });

    // Keep only recent attempts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.timestamp > oneHourAgo);

    this.loginAttempts.set(key, recentAttempts);

    // Check for brute force attempts
    if (!success) {
      this.checkBruteForceAttempt(email, ipAddress, userAgent, recentAttempts);
    }

    // Log the attempt
    dbAuditLogger.logAuthAttempt(email, success, ipAddress, userAgent);
  }

  // Check for brute force attempts
  private checkBruteForceAttempt(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    attempts: Array<{ timestamp: Date; success: boolean }> = []
  ): void {
    const rule = this.detectionRules.find(r => r.type === SecurityEventType.BRUTE_FORCE_ATTEMPT);
    if (!rule || !rule.enabled) return;

    const timeWindow = new Date(Date.now() - rule.timeWindow * 60 * 1000);
    const recentFailures = attempts.filter(a => !a.success && a.timestamp > timeWindow);

    if (recentFailures.length >= rule.threshold) {
      this.createSecurityEvent({
        type: SecurityEventType.BRUTE_FORCE_ATTEMPT,
        severity: 'high',
        source: 'authentication',
        ipAddress,
        userAgent,
        description: `Brute force attack detected: ${recentFailures.length} failed login attempts for ${email}`,
        metadata: {
          email,
          attemptCount: recentFailures.length,
          timeWindow: rule.timeWindow
        }
      });

      // Execute response actions
      this.executeResponseActions(rule.actions, { email, ipAddress });
    }
  }

  // Check for SQL injection attempts
  checkSQLInjectionAttempt(
    query: string,
    userId?: string,
    ipAddress?: string
  ): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /([\'"]\s*(OR|AND)\s*[\'"]\s*=\s*[\'"]\s*)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\b(EXEC|EXECUTE)\b.*\()/i
    ];

    const isSuspicious = sqlPatterns.some(pattern => pattern.test(query));

    if (isSuspicious) {
      this.createSecurityEvent({
        type: SecurityEventType.SQL_INJECTION_ATTEMPT,
        severity: 'critical',
        source: 'database',
        userId,
        ipAddress,
        description: 'SQL injection attempt detected',
        metadata: {
          query: query.substring(0, 500), // Truncate for security
          detectedPatterns: sqlPatterns.filter(p => p.test(query)).length
        }
      });

      const rule = this.detectionRules.find(r => r.type === SecurityEventType.SQL_INJECTION_ATTEMPT);
      if (rule) {
        this.executeResponseActions(rule.actions, { userId, ipAddress });
      }

      return true;
    }

    return false;
  }

  // Check for mass data access
  checkMassDataAccess(
    userId: string,
    recordCount: number,
    entity: string,
    ipAddress?: string
  ): void {
    const rule = this.detectionRules.find(r => r.type === SecurityEventType.MASS_DATA_ACCESS);
    if (!rule || !rule.enabled || recordCount < rule.threshold) return;

    this.createSecurityEvent({
      type: SecurityEventType.MASS_DATA_ACCESS,
      severity: 'medium',
      source: 'data_access',
      userId,
      ipAddress,
      description: `Mass data access detected: ${recordCount} ${entity} records accessed`,
      metadata: {
        entity,
        recordCount,
        threshold: rule.threshold
      }
    });

    this.executeResponseActions(rule.actions, { userId, ipAddress });
  }

  // Check for unusual query patterns
  checkUnusualQueryPattern(
    userId: string,
    queryComplexity: number,
    ipAddress?: string
  ): void {
    const userQueries = this.getUserQueryHistory(userId);
    const recentComplexQueries = userQueries.filter(q =>
      q.complexity > queryComplexity * 0.8 &&
      q.timestamp > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
    );

    const rule = this.detectionRules.find(r => r.type === SecurityEventType.UNUSUAL_QUERY_PATTERN);
    if (!rule || !rule.enabled || recentComplexQueries.length < rule.threshold) return;

    this.createSecurityEvent({
      type: SecurityEventType.UNUSUAL_QUERY_PATTERN,
      severity: 'medium',
      source: 'query_analysis',
      userId,
      ipAddress,
      description: `Unusual query pattern detected: ${recentComplexQueries.length} complex queries in short timeframe`,
      metadata: {
        complexQueryCount: recentComplexQueries.length,
        averageComplexity: queryComplexity,
        timeWindow: 10
      }
    });
  }

  // Create security event
  private createSecurityEvent(
    eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>
  ): SecurityEvent {
    const event: SecurityEvent = {
      ...eventData,
      id: this.generateEventId(),
      timestamp: new Date(),
      resolved: false
    };

    this.events.set(event.id, event);

    // Log event
    console.warn('SECURITY EVENT:', {
      id: event.id,
      type: event.type,
      severity: event.severity,
      description: event.description,
      timestamp: event.timestamp.toISOString()
    });

    return event;
  }

  // Execute threat response actions
  private executeResponseActions(
    actions: ThreatResponseAction[],
    context: { email?: string; userId?: string; ipAddress?: string }
  ): void {
    actions.forEach(action => {
      switch (action) {
        case ThreatResponseAction.BLOCK_IP:
          if (context.ipAddress) {
            this.blockIP(context.ipAddress);
          }
          break;

        case ThreatResponseAction.DISABLE_USER:
          if (context.userId) {
            this.disableUser(context.userId);
          }
          break;

        case ThreatResponseAction.NOTIFY_ADMIN:
          this.notifyAdministrators(context);
          break;

        case ThreatResponseAction.FORCE_LOGOUT:
          if (context.userId) {
            this.forceUserLogout(context.userId);
          }
          break;

        default:
          console.log(`Executing security action: ${action}`);
      }
    });
  }

  // Block IP address
  private blockIP(ipAddress: string): void {
    this.blockedIPs.add(ipAddress);
    console.warn(`IP address blocked: ${ipAddress}`);

    // In production, this would integrate with firewall/load balancer
  }

  // Disable user account
  private async disableUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: false } // Disable account
      });

      console.warn(`User account disabled: ${userId}`);
    } catch (error) {
      console.error(`Failed to disable user ${userId}:`, error);
    }
  }

  // Notify administrators
  private notifyAdministrators(context: any): void {
    // In production, this would send alerts via email, Slack, etc.
    console.warn('ADMIN NOTIFICATION: Security event detected', context);
  }

  // Force user logout
  private async forceUserLogout(userId: string): Promise<void> {
    try {
      // Invalidate all refresh tokens for the user
      await this.prisma.refreshToken.deleteMany({
        where: { userId }
      });

      console.warn(`Forced logout for user: ${userId}`);
    } catch (error) {
      console.error(`Failed to force logout for user ${userId}:`, error);
    }
  }

  // Check if IP is blocked
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  // Get security events
  getSecurityEvents(filters?: {
    type?: SecurityEventType;
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): SecurityEvent[] {
    let events = Array.from(this.events.values());

    if (filters) {
      if (filters.type) events = events.filter(e => e.type === filters.type);
      if (filters.severity) events = events.filter(e => e.severity === filters.severity);
      if (filters.resolved !== undefined) events = events.filter(e => e.resolved === filters.resolved);
      if (filters.limit) events = events.slice(0, filters.limit);
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Resolve security event
  resolveSecurityEvent(eventId: string, resolvedBy: string): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolvedBy = resolvedBy;

    return true;
  }

  // Get security metrics
  getSecurityMetrics(timeWindow: number = 24): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    resolvedEvents: number;
    criticalEvents: number;
  } {
    const since = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const recentEvents = Array.from(this.events.values())
      .filter(e => e.timestamp > since);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.blockedIPs.size,
      resolvedEvents: recentEvents.filter(e => e.resolved).length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length
    };
  }

  // Start monitoring
  private startMonitoring(): void {
    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);

    // Generate security report every 6 hours
    setInterval(() => {
      this.generateSecurityReport();
    }, 6 * 60 * 60 * 1000);
  }

  // Cleanup old events
  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoff && event.resolved) {
        this.events.delete(id);
      }
    }
  }

  // Generate security report
  private generateSecurityReport(): void {
    const metrics = this.getSecurityMetrics();
    const unresolved = this.getSecurityEvents({ resolved: false });

    console.log('SECURITY REPORT:', {
      timestamp: new Date().toISOString(),
      metrics,
      unresolvedEvents: unresolved.length,
      criticalUnresolved: unresolved.filter(e => e.severity === 'critical').length
    });
  }

  // Helper methods
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserQueryHistory(userId: string): Array<{ timestamp: Date; complexity: number }> {
    // In a real implementation, this would track user query history
    return [];
  }
}

// Global security monitor instance
import { prisma } from './index';

export const securityMonitor = new SecurityMonitor(prisma);

export default SecurityMonitor;