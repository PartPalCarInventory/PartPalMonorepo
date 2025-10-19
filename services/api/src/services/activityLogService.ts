import { prisma } from '@partpal/database';

export type ActivityType = 'vehicle_added' | 'part_listed' | 'part_sold' | 'marketplace_listing';

interface LogActivityParams {
  type: ActivityType;
  description: string;
  userId: string;
  sellerId?: string;
  vehicleId?: string;
  partId?: string;
  metadata?: Record<string, any>;
}

class ActivityLogService {
  /**
   * Log an activity event
   */
  async logActivity(params: LogActivityParams): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          type: params.type,
          description: params.description,
          userId: params.userId,
          sellerId: params.sellerId,
          vehicleId: params.vehicleId,
          partId: params.partId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          timestamp: new Date(),
        } as any,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - activity logging should not break the main flow
    }
  }

  /**
   * Log vehicle added activity
   */
  async logVehicleAdded(params: {
    userId: string;
    sellerId: string;
    vehicleId: string;
    vehicleName: string;
  }): Promise<void> {
    await this.logActivity({
      type: 'vehicle_added',
      description: `Added ${params.vehicleName} to inventory`,
      userId: params.userId,
      sellerId: params.sellerId,
      vehicleId: params.vehicleId,
      metadata: {
        vehicleName: params.vehicleName,
      },
    });
  }

  /**
   * Log part listed activity
   */
  async logPartListed(params: {
    userId: string;
    sellerId: string;
    partId: string;
    vehicleId: string;
    partName: string;
    price: number;
  }): Promise<void> {
    await this.logActivity({
      type: 'part_listed',
      description: `Listed ${params.partName} for R${params.price.toLocaleString()}`,
      userId: params.userId,
      sellerId: params.sellerId,
      partId: params.partId,
      vehicleId: params.vehicleId,
      metadata: {
        partName: params.partName,
        price: params.price,
      },
    });
  }

  /**
   * Log part sold activity
   */
  async logPartSold(params: {
    userId: string;
    sellerId: string;
    partId: string;
    vehicleId?: string;
    partName: string;
    price: number;
  }): Promise<void> {
    await this.logActivity({
      type: 'part_sold',
      description: `${params.partName} sold for R${params.price.toLocaleString()}`,
      userId: params.userId,
      sellerId: params.sellerId,
      partId: params.partId,
      vehicleId: params.vehicleId,
      metadata: {
        partName: params.partName,
        price: params.price,
      },
    });
  }

  /**
   * Log marketplace listing activity
   */
  async logMarketplaceListing(params: {
    userId: string;
    sellerId: string;
    partId: string;
    vehicleId?: string;
    partName: string;
    isListing: boolean;
  }): Promise<void> {
    await this.logActivity({
      type: 'marketplace_listing',
      description: params.isListing
        ? `${params.partName} listed on marketplace`
        : `${params.partName} removed from marketplace`,
      userId: params.userId,
      sellerId: params.sellerId,
      partId: params.partId,
      vehicleId: params.vehicleId,
      metadata: {
        partName: params.partName,
        isListing: params.isListing,
      },
    });
  }

  /**
   * Get recent activity for a seller
   */
  async getRecentActivity(sellerId: string, limit: number = 10) {
    return await prisma.activityLog.findMany({
      where: { sellerId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get activity by type for analytics
   */
  async getActivityByType(params: {
    sellerId?: string;
    type: ActivityType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = {
      type: params.type,
    };

    if (params.sellerId) {
      whereClause.sellerId = params.sellerId;
    }

    if (params.startDate || params.endDate) {
      whereClause.timestamp = {};
      if (params.startDate) whereClause.timestamp.gte = params.startDate;
      if (params.endDate) whereClause.timestamp.lte = params.endDate;
    }

    return await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Clean up old activity logs (optional - for data retention)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

export const activityLogService = new ActivityLogService();
