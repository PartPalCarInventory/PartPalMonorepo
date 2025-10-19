import { prisma } from '@partpal/database';
import { PrismaClient } from '@prisma/client';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: PrismaClient;

  constructor() {
    this.client = prisma;
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async getHealthStatus() {
    try {
      const start = Date.now();
      await this.client.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      const [userCount, vehicleCount, partCount, sellerCount] = await Promise.all([
        this.client.user.count(),
        this.client.vehicle.count(),
        this.client.part.count(),
        this.client.seller.count(),
      ]);

      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
        stats: {
          users: userCount,
          vehicles: vehicleCount,
          parts: partCount,
          sellers: sellerCount,
        },
        version: process.env.DATABASE_VERSION || 'unknown',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runMigrations(): Promise<boolean> {
    try {
      // Note: In production, migrations should be run via Prisma CLI
      // This is mainly for development/testing environments
      console.log('Checking migration status...');

      // Check if database is accessible
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to database');
      }

      console.log('Database connection verified');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  async seedDatabase(): Promise<boolean> {
    try {
      console.log('Starting database seeding...');

      // Check if database is already seeded
      const userCount = await this.client.user.count();
      if (userCount > 0) {
        console.log('Database already has data, skipping seed');
        return true;
      }

      // Run the seed script programmatically
      const { execSync } = require('child_process');
      execSync('npm run db:seed', {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

      console.log('Database seeding completed');
      return true;
    } catch (error) {
      console.error('Database seeding failed:', error);
      return false;
    }
  }

  async resetDatabase(): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database reset not allowed in production');
      }

      console.log('Resetting database...');

      // Delete all data in reverse dependency order
      await this.client.part.deleteMany();
      await this.client.vehicle.deleteMany();
      await this.client.refreshToken.deleteMany();
      await this.client.seller.deleteMany();
      await this.client.user.deleteMany();
      await this.client.category.deleteMany();

      console.log('Database reset completed');
      return true;
    } catch (error) {
      console.error('Database reset failed:', error);
      return false;
    }
  }

  async backup(): Promise<string | null> {
    try {
      if (process.env.NODE_ENV === 'production') {
        console.log('Database backup should be handled by infrastructure in production');
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup-${timestamp}.sql`;

      console.log(`Creating database backup: ${backupFile}`);

      // Note: This would need to be implemented based on your database provider
      // For PostgreSQL, you would use pg_dump
      // For now, we'll just log the intent
      console.log('Backup creation logic should be implemented based on database provider');

      return backupFile;
    } catch (error) {
      console.error('Database backup failed:', error);
      return null;
    }
  }

  async getMetrics() {
    try {
      const [
        totalUsers,
        totalSellers,
        verifiedSellers,
        totalVehicles,
        totalParts,
        marketplaceParts,
        availableParts,
        soldParts,
        totalCategories,
      ] = await Promise.all([
        this.client.user.count(),
        this.client.seller.count(),
        this.client.seller.count({ where: { isVerified: true } }),
        this.client.vehicle.count(),
        this.client.part.count(),
        this.client.part.count({ where: { isListedOnMarketplace: true } }),
        this.client.part.count({ where: { status: 'AVAILABLE' } }),
        this.client.part.count({ where: { status: 'SOLD' } }),
        this.client.category.count({ where: { isActive: true } }),
      ]);

      // Get top makes
      const topMakes = await this.client.vehicle.groupBy({
        by: ['make'],
        _count: { make: true },
        orderBy: { _count: { make: 'desc' } },
        take: 10,
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await Promise.all([
        this.client.user.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        this.client.part.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        this.client.vehicle.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
      ]);

      return {
        overview: {
          totalUsers,
          totalSellers,
          verifiedSellers,
          totalVehicles,
          totalParts,
          marketplaceParts,
          availableParts,
          soldParts,
          totalCategories,
        },
        activity: {
          newUsersLast7Days: recentActivity[0],
          newPartsLast7Days: recentActivity[1],
          newVehiclesLast7Days: recentActivity[2],
        },
        insights: {
          topMakes: topMakes.map(m => ({
            make: m.make,
            count: m._count.make,
          })),
          marketplaceListingRate: totalParts > 0 ? (marketplaceParts / totalParts) * 100 : 0,
          sellerVerificationRate: totalSellers > 0 ? (verifiedSellers / totalSellers) * 100 : 0,
          partSalesRate: totalParts > 0 ? (soldParts / totalParts) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Failed to get database metrics:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

export const databaseManager = DatabaseManager.getInstance();

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await databaseManager.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await databaseManager.disconnect();
  process.exit(0);
});