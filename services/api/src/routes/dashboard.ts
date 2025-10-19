import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, DashboardStats } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Helper function to get date range based on period
function getDateRange(period: string): Date {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// Get dashboard statistics
router.get('/stats', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const period = (req.query.period as string) || '30d';
    const startDate = getDateRange(period);

    // Get seller profile
    let sellerId: string | null = null;
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
          message: 'Please complete seller registration first',
        };
        return res.status(404).json(response);
      }

      sellerId = seller.id;
    }

    // Build where clause for seller-specific data
    const whereClause: any = {};
    if (sellerId) {
      whereClause.sellerId = sellerId;
    }

    // Get total vehicles
    const totalVehicles = await prisma.vehicle.count({
      where: {
        ...whereClause,
        createdAt: { gte: startDate },
      },
    });

    // Get total parts
    const totalParts = await prisma.part.count({
      where: {
        ...whereClause,
        createdAt: { gte: startDate },
      },
    });

    // Get recent sales (parts sold in period)
    const recentSales = await prisma.part.count({
      where: {
        ...whereClause,
        status: 'SOLD',
        updatedAt: { gte: startDate },
      },
    });

    // Calculate monthly revenue from sold parts
    const soldParts = await prisma.part.findMany({
      where: {
        ...whereClause,
        status: 'SOLD',
        updatedAt: { gte: startDate },
      },
      select: {
        price: true,
      },
    });

    const monthlyRevenue = soldParts.reduce((sum, part) => sum + part.price, 0);

    // Get top selling parts
    const topSellingPartsData = await prisma.part.findMany({
      where: {
        ...whereClause,
        status: 'SOLD',
        updatedAt: { gte: startDate },
      },
      take: 10,
      include: {
        vehicle: {
          select: {
            id: true,
            year: true,
            make: true,
            model: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Group by part name to get sales count
    const partSalesMap = new Map<string, { part: any; salesCount: number }>();
    topSellingPartsData.forEach((part) => {
      const key = part.name;
      if (partSalesMap.has(key)) {
        const existing = partSalesMap.get(key)!;
        existing.salesCount++;
      } else {
        partSalesMap.set(key, {
          part: part as any,
          salesCount: 1,
        });
      }
    });

    const topSellingParts = Array.from(partSalesMap.values())
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: sellerId ? { sellerId } : {},
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
    });

    const stats: DashboardStats = {
      totalVehicles,
      totalParts,
      recentSales,
      monthlyRevenue,
      topSellingParts,
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        type: activity.type as any,
        description: activity.description,
        timestamp: activity.timestamp,
        userId: activity.userId,
      })) as any,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get revenue data for charts
router.get('/revenue', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const period = (req.query.period as string) || '30d';
    const startDate = getDateRange(period);

    // Get seller profile
    let sellerId: string | null = null;
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
          message: 'Please complete seller registration first',
        };
        return res.status(404).json(response);
      }

      sellerId = seller.id;
    }

    // Build where clause
    const whereClause: any = {
      status: 'SOLD',
      updatedAt: { gte: startDate },
    };
    if (sellerId) {
      whereClause.sellerId = sellerId;
    }

    // Get sold parts grouped by date
    const soldParts = await prisma.part.findMany({
      where: whereClause,
      select: {
        price: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    // Group by date
    const revenueByDate = new Map<string, { revenue: number; sales: number }>();
    soldParts.forEach((part) => {
      const date = part.updatedAt.toISOString().split('T')[0];
      if (revenueByDate.has(date)) {
        const existing = revenueByDate.get(date)!;
        existing.revenue += part.price;
        existing.sales++;
      } else {
        revenueByDate.set(date, {
          revenue: part.price,
          sales: 1,
        });
      }
    });

    // Convert to array
    const revenueData = Array.from(revenueByDate.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      sales: data.sales,
    }));

    const response: ApiResponse<typeof revenueData> = {
      success: true,
      data: revenueData,
      message: 'Revenue data retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get inventory data for charts
router.get('/inventory', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const period = (req.query.period as string) || '30d';

    // Get seller profile
    let sellerId: string | null = null;
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
          message: 'Please complete seller registration first',
        };
        return res.status(404).json(response);
      }

      sellerId = seller.id;
    }

    // Build where clause
    const whereClause: any = {};
    if (sellerId) {
      whereClause.sellerId = sellerId;
    }

    // Get parts by category
    const partsByCategory = await prisma.part.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Get category details
    const categoryIds = partsByCategory
      .map((item) => item.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

    const inventoryData = partsByCategory.map((item) => ({
      category: categoryMap.get(item.categoryId || '') || 'Uncategorized',
      count: item._count.id,
    }));

    const response: ApiResponse<typeof inventoryData> = {
      success: true,
      data: inventoryData,
      message: 'Inventory data retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
