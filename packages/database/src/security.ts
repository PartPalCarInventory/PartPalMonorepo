import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Database security and compliance utilities
export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  audit: {
    enabled: boolean;
    logQueries: boolean;
    logFailures: boolean;
    retentionDays: number;
  };
  access: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    sessionTimeoutMinutes: number;
    requireStrongPasswords: boolean;
  };
  compliance: {
    gdprCompliant: boolean;
    pciCompliant: boolean;
    auditTrail: boolean;
    dataRetentionDays: number;
  };
}

export const securityConfig: SecurityConfig = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  },
  audit: {
    enabled: process.env.DATABASE_AUDIT_ENABLED === 'true',
    logQueries: process.env.DATABASE_LOG_QUERIES === 'true',
    logFailures: true,
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90')
  },
  access: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15'),
    sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
    requireStrongPasswords: process.env.REQUIRE_STRONG_PASSWORDS !== 'false'
  },
  compliance: {
    gdprCompliant: process.env.GDPR_COMPLIANCE === 'true',
    pciCompliant: process.env.PCI_COMPLIANCE === 'true',
    auditTrail: process.env.AUDIT_TRAIL_ENABLED !== 'false',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555') // 7 years default
  }
};

// Data encryption utilities
export class DatabaseEncryption {
  private encryptionKey: Buffer;

  constructor(key?: string) {
    this.encryptionKey = key
      ? Buffer.from(key, 'hex')
      : this.generateEncryptionKey();
  }

  // Encrypt sensitive data
  encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(securityConfig.encryption.ivLength);
    const cipher = crypto.createCipher(securityConfig.encryption.algorithm, this.encryptionKey);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = (cipher as any).getAuthTag?.()?.toString('hex') || '';

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(securityConfig.encryption.algorithm, this.encryptionKey);

    if (encryptedData.tag) {
      (decipher as any).setAuthTag?.(Buffer.from(encryptedData.tag, 'hex'));
    }

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Generate new encryption key
  private generateEncryptionKey(): Buffer {
    return crypto.randomBytes(securityConfig.encryption.keyLength);
  }

  // Hash passwords securely
  static async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    if (!securityConfig.access.requireStrongPasswords) {
      return { isValid: true, errors: [], score: 100 };
    }

    // Minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 20;
    }

    // Contains uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 20;
    }

    // Contains lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 20;
    }

    // Contains numbers
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 20;
    }

    // Contains special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 20;
    }

    // Additional length bonus
    if (password.length >= 12) {
      score += 10;
    }

    // No common patterns
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      errors.push('Password contains common patterns');
      score -= 30;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, Math.min(100, score))
    };
  }
}

// Access control and permissions
export class DatabaseAccessControl {
  constructor(private prisma: PrismaClient) {}

  // Create secure database roles
  async setupDatabaseRoles(): Promise<void> {
    // This would typically be done at the database level
    // Here we're documenting the recommended role structure

    const roles = {
      // Read-only role for analytics/reporting
      'partpal_readonly': {
        permissions: ['SELECT'],
        tables: ['users', 'sellers', 'vehicles', 'parts', 'categories'],
        description: 'Read-only access for reporting and analytics'
      },

      // Application role for normal operations
      'partpal_app': {
        permissions: ['SELECT', 'INSERT', 'UPDATE'],
        tables: ['users', 'sellers', 'vehicles', 'parts', 'categories', 'refresh_tokens'],
        restrictions: ['NO DELETE on users', 'NO UPDATE on audit_logs'],
        description: 'Standard application access'
      },

      // Admin role for maintenance
      'partpal_admin': {
        permissions: ['ALL'],
        tables: ['ALL'],
        description: 'Full administrative access'
      },

      // Backup role
      'partpal_backup': {
        permissions: ['SELECT', 'REPLICATION'],
        tables: ['ALL'],
        description: 'Backup and replication access'
      }
    };

    console.log('Database roles configuration:', roles);
  }

  // Implement row-level security policies
  async setupRowLevelSecurity(): Promise<void> {
    // Example RLS policies that should be implemented at database level

    const policies = {
      // Users can only see their own data
      'users_own_data': {
        table: 'users',
        policy: 'Users can only access their own records',
        condition: 'user_id = current_user_id()'
      },

      // Sellers can only see their own parts/vehicles
      'sellers_own_inventory': {
        table: 'parts',
        policy: 'Sellers can only access their own inventory',
        condition: 'seller_id IN (SELECT id FROM sellers WHERE user_id = current_user_id())'
      },

      // Marketplace parts are visible to all authenticated users
      'marketplace_parts_public': {
        table: 'parts',
        policy: 'Marketplace parts visible to authenticated users',
        condition: 'is_listed_on_marketplace = true'
      }
    };

    console.log('Row-level security policies:', policies);
  }

  // Validate user permissions for operations
  async validateUserPermission(
    userId: string,
    operation: 'read' | 'write' | 'delete',
    resource: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { seller: true }
      });

      if (!user) return false;

      // Admin users have all permissions
      if (user.role === 'ADMIN') return true;

      // Check specific resource permissions
      switch (resource) {
        case 'parts':
          return this.validatePartPermission(user, operation, resourceId);
        case 'vehicles':
          return this.validateVehiclePermission(user, operation, resourceId);
        case 'sellers':
          return this.validateSellerPermission(user, operation, resourceId);
        default:
          return false;
      }
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }

  private async validatePartPermission(
    user: any,
    operation: 'read' | 'write' | 'delete',
    partId?: string
  ): Promise<boolean> {
    if (!partId) return user.role === 'SELLER' || user.role === 'ADMIN';

    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      select: { sellerId: true, isListedOnMarketplace: true }
    });

    if (!part) return false;

    // Anyone can read marketplace parts
    if (operation === 'read' && part.isListedOnMarketplace) return true;

    // Only the seller can modify their parts
    if ((operation === 'write' || operation === 'delete') && user.seller) {
      return part.sellerId === user.seller.id;
    }

    return false;
  }

  private async validateVehiclePermission(
    user: any,
    operation: 'read' | 'write' | 'delete',
    vehicleId?: string
  ): Promise<boolean> {
    if (!vehicleId) return user.role === 'SELLER' || user.role === 'ADMIN';

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { sellerId: true }
    });

    if (!vehicle || !user.seller) return false;

    // Only the seller can access their vehicles
    return vehicle.sellerId === user.seller.id;
  }

  private async validateSellerPermission(
    user: any,
    operation: 'read' | 'write' | 'delete',
    sellerId?: string
  ): Promise<boolean> {
    // Anyone can read seller public information
    if (operation === 'read') return true;

    // Only the user can modify their own seller profile
    if ((operation === 'write' || operation === 'delete') && user.seller) {
      return !sellerId || sellerId === user.seller.id;
    }

    return false;
  }
}

// Audit logging
export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export class DatabaseAuditLogger {
  constructor(private prisma: PrismaClient) {}

  // Log database operations
  async logOperation(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!securityConfig.audit.enabled) return;

    try {
      // In a real implementation, this would write to a separate audit table
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };

      // Log to console for now (in production, use proper audit storage)
      console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));

      // Store in audit table (would need to create this table)
      // await this.prisma.auditLog.create({ data: auditEntry });

    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  // Log authentication attempts
  async logAuthAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logOperation({
      action: 'authentication',
      resource: 'user',
      oldValues: { email },
      ipAddress,
      userAgent,
      success,
      errorMessage
    });
  }

  // Log data access
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    ipAddress?: string
  ): Promise<void> {
    await this.logOperation({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      ipAddress,
      success: true
    });
  }

  // Get audit trail for compliance
  async getAuditTrail(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    // This would query the audit log table
    // For now, return empty array
    console.log('Audit trail query:', filters);
    return [];
  }

  // Clean up old audit logs based on retention policy
  async cleanupOldLogs(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - securityConfig.audit.retentionDays);

    console.log(`Cleaning up audit logs older than ${cutoffDate.toISOString()}`);

    // In production, this would delete from audit_logs table
    // const deleted = await this.prisma.auditLog.deleteMany({
    //   where: { timestamp: { lt: cutoffDate } }
    // });
    // return deleted.count;

    return 0;
  }
}

// SQL injection prevention
export class SqlInjectionPrevention {
  // Sanitize user input
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/['"`;\\]/g, '') // Remove dangerous characters
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate search queries
  static validateSearchQuery(query: string): { isValid: boolean; sanitized: string } {
    const sanitized = this.sanitizeInput(query);

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /([\'"]\s*(OR|AND)\s*[\'"]\s*=\s*[\'"]\s*)/i
    ];

    const isValid = !sqlPatterns.some(pattern => pattern.test(sanitized));

    return { isValid, sanitized };
  }

  // Validate identifiers (table names, column names, etc.)
  static validateIdentifier(identifier: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  }
}

// Data anonymization for GDPR compliance
export class DataAnonymization {
  private encryption: DatabaseEncryption;

  constructor() {
    this.encryption = new DatabaseEncryption();
  }

  // Anonymize personal data
  anonymizePersonalData(data: any): any {
    const anonymized = { ...data };

    // Anonymize email
    if (anonymized.email) {
      const domain = anonymized.email.split('@')[1] || 'example.com';
      anonymized.email = `anonymous_${crypto.randomBytes(4).toString('hex')}@${domain}`;
    }

    // Anonymize phone numbers
    if (anonymized.phone) {
      anonymized.phone = '+27XX-XXX-XXXX';
    }

    // Anonymize names
    if (anonymized.name) {
      anonymized.name = 'Anonymous User';
    }

    // Anonymize business names (for sellers)
    if (anonymized.businessName) {
      anonymized.businessName = 'Anonymous Business';
    }

    // Keep only essential non-personal data
    delete anonymized.whatsapp;
    delete anonymized.website;

    return anonymized;
  }

  // Encrypt sensitive fields
  encryptSensitiveData(data: any, sensitiveFields: string[]): any {
    const encrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encryption.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }
}

// Export instances
export const dbEncryption = new DatabaseEncryption();
import { prisma } from './index';

export const dbAccessControl = new DatabaseAccessControl(prisma);
export const dbAuditLogger = new DatabaseAuditLogger(prisma);
export const dataAnonymization = new DataAnonymization();

export default {
  DatabaseEncryption,
  DatabaseAccessControl,
  DatabaseAuditLogger,
  SqlInjectionPrevention,
  DataAnonymization,
  securityConfig
};