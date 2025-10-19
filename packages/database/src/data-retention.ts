import { PrismaClient } from '@prisma/client';
import { securityConfig } from './security';
import { databaseMonitor } from './monitoring';

// Data retention and compliance management
export interface RetentionPolicy {
  entity: string;
  retentionDays: number;
  archiveBeforeDelete: boolean;
  anonymizeBeforeDelete: boolean;
  conditions?: any;
  exemptions?: string[];
}

export interface ComplianceRequirement {
  name: string;
  description: string;
  retentionDays: number;
  deletionRequired: boolean;
  auditRequired: boolean;
  encryptionRequired: boolean;
}

export interface PolicyComplianceStatus {
  entity: string;
  retentionDays: number;
  status: string;
}

export interface DataVolumeInfo {
  entity: string;
  totalRecords: number;
  oldRecords: number;
  retentionOverdue: number;
}

export interface ComplianceReport {
  reportDate: Date;
  complianceStatus: string;
  policies: PolicyComplianceStatus[];
  dataVolumes: DataVolumeInfo[];
  recommendations: string[];
}

export class DataRetentionManager {
  private policies: RetentionPolicy[] = [];
  private complianceRequirements: ComplianceRequirement[] = [];

  constructor(private prisma: PrismaClient) {
    this.initializeDefaultPolicies();
    this.initializeComplianceRequirements();
  }

  // Initialize default retention policies
  private initializeDefaultPolicies(): void {
    this.policies = [
      {
        entity: 'refresh_tokens',
        retentionDays: 90, // 3 months
        archiveBeforeDelete: false,
        anonymizeBeforeDelete: false,
        conditions: { expiresAt: { lt: new Date() } }
      },
      {
        entity: 'audit_logs',
        retentionDays: securityConfig.audit.retentionDays,
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: false
      },
      {
        entity: 'user_sessions',
        retentionDays: 30,
        archiveBeforeDelete: false,
        anonymizeBeforeDelete: true,
        conditions: { lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      },
      {
        entity: 'parts',
        retentionDays: securityConfig.compliance.dataRetentionDays,
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: false,
        conditions: { status: 'SOLD' },
        exemptions: ['legal_hold', 'dispute']
      },
      {
        entity: 'vehicles',
        retentionDays: securityConfig.compliance.dataRetentionDays,
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: false,
        exemptions: ['active_parts', 'legal_hold']
      },
      {
        entity: 'users',
        retentionDays: securityConfig.compliance.dataRetentionDays,
        archiveBeforeDelete: true,
        anonymizeBeforeDelete: true,
        conditions: { isDeleted: true },
        exemptions: ['active_seller', 'legal_hold']
      }
    ];
  }

  // Initialize compliance requirements
  private initializeComplianceRequirements(): void {
    this.complianceRequirements = [
      {
        name: 'GDPR',
        description: 'EU General Data Protection Regulation',
        retentionDays: 2555, // 7 years
        deletionRequired: true,
        auditRequired: true,
        encryptionRequired: true
      },
      {
        name: 'POPI',
        description: 'South African Protection of Personal Information Act',
        retentionDays: 2555, // 7 years
        deletionRequired: true,
        auditRequired: true,
        encryptionRequired: true
      },
      {
        name: 'SOX',
        description: 'Sarbanes-Oxley Act (if applicable)',
        retentionDays: 2555, // 7 years
        deletionRequired: false,
        auditRequired: true,
        encryptionRequired: true
      }
    ];
  }

  // Execute retention policies
  async executeRetentionPolicies(): Promise<{
    policy: string;
    processed: number;
    archived: number;
    anonymized: number;
    deleted: number;
    errors: string[];
  }[]> {
    const results = [];

    for (const policy of this.policies) {
      try {
        const result = await this.executePolicy(policy);
        results.push(result);
      } catch (error) {
        results.push({
          policy: policy.entity,
          processed: 0,
          archived: 0,
          anonymized: 0,
          deleted: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  // Execute a specific retention policy
  private async executePolicy(policy: RetentionPolicy): Promise<{
    policy: string;
    processed: number;
    archived: number;
    anonymized: number;
    deleted: number;
    errors: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    const where = {
      createdAt: { lt: cutoffDate },
      ...policy.conditions
    };

    // Add exemption conditions
    if (policy.exemptions) {
      // This would need to be customized per entity type
      // For now, we'll add a generic approach
    }

    let processed = 0;
    let archived = 0;
    let anonymized = 0;
    let deleted = 0;
    const errors: string[] = [];

    try {
      // Get records to process
      const records = await this.getRecordsForRetention(policy.entity, where);
      processed = records.length;

      if (processed === 0) {
        return { policy: policy.entity, processed, archived, anonymized, deleted, errors };
      }

      // Archive before processing if required
      if (policy.archiveBeforeDelete) {
        archived = await this.archiveRecords(policy.entity, records);
      }

      // Anonymize if required
      if (policy.anonymizeBeforeDelete) {
        anonymized = await this.anonymizeRecords(policy.entity, records);
      } else {
        // Delete records
        deleted = await this.deleteRecords(policy.entity, records);
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return { policy: policy.entity, processed, archived, anonymized, deleted, errors };
  }

  // Get records for retention processing
  private async getRecordsForRetention(entity: string, where: any): Promise<any[]> {
    switch (entity) {
      case 'refresh_tokens':
        return this.prisma.refreshToken.findMany({ where });
      case 'users':
        return this.prisma.user.findMany({ where });
      case 'parts':
        return this.prisma.part.findMany({ where });
      case 'vehicles':
        return this.prisma.vehicle.findMany({ where });
      default:
        return [];
    }
  }

  // Archive records to cold storage
  private async archiveRecords(entity: string, records: any[]): Promise<number> {
    // In a real implementation, this would move data to cold storage
    // For now, we'll simulate archiving
    console.log(`Archiving ${records.length} ${entity} records`);

    // Create archive entries (would typically be in a separate archive database)
    const archiveData = records.map(record => ({
      originalId: record.id,
      entity,
      data: JSON.stringify(record),
      archivedAt: new Date()
    }));

    // In production, save to archive storage
    console.log(`Archive data prepared for ${entity}:`, archiveData.length, 'records');

    return records.length;
  }

  // Anonymize records for GDPR compliance
  private async anonymizeRecords(entity: string, records: any[]): Promise<number> {
    let anonymized = 0;

    for (const record of records) {
      try {
        const anonymizedData = this.anonymizeRecord(entity, record);

        switch (entity) {
          case 'users':
            await this.prisma.user.update({
              where: { id: record.id },
              data: anonymizedData
            });
            break;
          case 'sellers':
            await this.prisma.seller.update({
              where: { id: record.id },
              data: anonymizedData
            });
            break;
        }

        anonymized++;
      } catch (error) {
        console.error(`Failed to anonymize ${entity} record ${record.id}:`, error);
      }
    }

    return anonymized;
  }

  // Anonymize individual record
  private anonymizeRecord(entity: string, record: any): any {
    const anonymized = { ...record };

    switch (entity) {
      case 'users':
        return {
          email: `anonymous_${record.id.substring(0, 8)}@example.com`,
          name: 'Anonymous User',
          password: '[REDACTED]',
          isAnonymized: true,
          anonymizedAt: new Date()
        };

      case 'sellers':
        return {
          businessName: 'Anonymous Business',
          description: '[REDACTED]',
          phone: '[REDACTED]',
          whatsapp: null,
          website: null,
          isAnonymized: true,
          anonymizedAt: new Date()
        };

      default:
        return anonymized;
    }
  }

  // Delete records permanently
  private async deleteRecords(entity: string, records: any[]): Promise<number> {
    const ids = records.map(r => r.id);

    try {
      switch (entity) {
        case 'refresh_tokens':
          const deletedTokens = await this.prisma.refreshToken.deleteMany({
            where: { id: { in: ids } }
          });
          return deletedTokens.count;

        case 'parts':
          const deletedParts = await this.prisma.part.deleteMany({
            where: { id: { in: ids } }
          });
          return deletedParts.count;

        case 'vehicles':
          const deletedVehicles = await this.prisma.vehicle.deleteMany({
            where: { id: { in: ids } }
          });
          return deletedVehicles.count;

        default:
          return 0;
      }
    } catch (error) {
      console.error(`Failed to delete ${entity} records:`, error);
      return 0;
    }
  }

  // Generate compliance report
  async generateComplianceReport(): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      reportDate: new Date(),
      complianceStatus: 'compliant',
      policies: [],
      dataVolumes: [],
      recommendations: []
    };

    // Check each policy
    for (const policy of this.policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      const where = {
        createdAt: { lt: cutoffDate },
        ...policy.conditions
      };

      try {
        const oldRecords = await this.getRecordsForRetention(policy.entity, where);
        const totalRecords = await this.getTotalRecords(policy.entity);

        report.policies.push({
          entity: policy.entity,
          retentionDays: policy.retentionDays,
          status: oldRecords.length > 0 ? 'overdue' : 'compliant'
        });

        report.dataVolumes.push({
          entity: policy.entity,
          totalRecords,
          oldRecords: oldRecords.length,
          retentionOverdue: oldRecords.length
        });

        if (oldRecords.length > 0) {
          report.complianceStatus = 'overdue';
          report.recommendations.push(
            `Execute retention policy for ${policy.entity}: ${oldRecords.length} records overdue`
          );
        }

      } catch (error) {
        report.policies.push({
          entity: policy.entity,
          retentionDays: policy.retentionDays,
          status: 'unknown'
        });
        report.complianceStatus = 'unknown';
      }
    }

    return report;
  }

  // Get total records for an entity
  private async getTotalRecords(entity: string): Promise<number> {
    try {
      switch (entity) {
        case 'users':
          return this.prisma.user.count();
        case 'sellers':
          return this.prisma.seller.count();
        case 'vehicles':
          return this.prisma.vehicle.count();
        case 'parts':
          return this.prisma.part.count();
        case 'refresh_tokens':
          return this.prisma.refreshToken.count();
        default:
          return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Handle data subject requests (GDPR Article 17 - Right to be forgotten)
  async processDataSubjectRequest(
    userId: string,
    requestType: 'access' | 'portability' | 'deletion' | 'rectification'
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          seller: {
            include: {
              vehicles: true,
              parts: true
            }
          }
        }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      switch (requestType) {
        case 'access':
          return {
            success: true,
            message: 'Data access provided',
            data: this.sanitizeUserData(user)
          };

        case 'portability':
          return {
            success: true,
            message: 'Data export provided',
            data: this.exportUserData(user)
          };

        case 'deletion':
          await this.deleteUserData(userId);
          return {
            success: true,
            message: 'User data deleted successfully'
          };

        case 'rectification':
          return {
            success: true,
            message: 'Data rectification process initiated'
          };

        default:
          return { success: false, message: 'Invalid request type' };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private sanitizeUserData(user: any): any {
    // Remove sensitive fields for data access requests
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
  }

  private exportUserData(user: any): any {
    // Format data for portability (JSON, CSV, etc.)
    return {
      personal_data: this.sanitizeUserData(user),
      export_date: new Date().toISOString(),
      format: 'JSON'
    };
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Implement cascade deletion with proper audit trail
    await this.prisma.$transaction(async (tx: PrismaClient) => {
      // Archive first if required
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user) {
        await this.archiveRecords('users', [user]);
      }

      // Delete related data
      await tx.refreshToken.deleteMany({ where: { userId } });

      // Anonymize seller data if exists
      const seller = await tx.seller.findUnique({ where: { userId } });
      if (seller) {
        await this.anonymizeRecords('sellers', [seller]);
      }

      // Mark user as deleted (don't actually delete to maintain referential integrity)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@example.com`,
          name: 'Deleted User',
          password: '[DELETED]',
          isVerified: false
        }
      });
    });
  }
}

// Global data retention manager
import { prisma } from './index';

export const dataRetentionManager = new DataRetentionManager(prisma);

export default DataRetentionManager;