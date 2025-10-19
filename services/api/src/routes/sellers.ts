import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, Seller, PaginatedResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router: express.Router = express.Router();

// Validation schemas
const updateSellerSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessType: z.enum(['SCRAP_YARD', 'DISMANTLER', 'PRIVATE']).optional(),
  description: z.string().max(1000).optional(),
  street: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  province: z.string().min(2).optional(),
  postalCode: z.string().min(4).optional(),
  phone: z.string().regex(/^(\+27|0)[0-9]{9}$/).optional(),
  whatsapp: z.string().regex(/^(\+27|0)[0-9]{9}$/).optional(),
  website: z.string().url().optional(),
  businessHours: z.object({
    monday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    tuesday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    wednesday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    thursday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    friday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    saturday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
    sunday: z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
  }).optional(),
});

const verifySellerSchema = z.object({
  isVerified: z.boolean(),
});

const updateSubscriptionSchema = z.object({
  subscriptionPlan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

// Get all sellers (public endpoint for marketplace)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    // Query filters
    const province = req.query.province as string;
    const city = req.query.city as string;
    const businessType = req.query.businessType as string;
    const isVerified = req.query.isVerified === 'true';

    // Build where clause
    let whereClause: any = {};

    if (province) whereClause.province = province;
    if (city) whereClause.city = city;
    if (businessType) whereClause.businessType = businessType;
    if (req.query.isVerified !== undefined) {
      whereClause.isVerified = isVerified;
    }

    const [sellers, totalCount] = await Promise.all([
      prisma.seller.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          businessName: true,
          businessType: true,
          description: true,
          city: true,
          province: true,
          phone: true,
          whatsapp: true,
          website: true,
          isVerified: true,
          rating: true,
          totalSales: true,
          subscriptionPlan: true,
          businessHours: true,
          createdAt: true,
          _count: {
            select: {
              vehicles: true,
              parts: {
                where: {
                  isListedOnMarketplace: true,
                  status: 'AVAILABLE',
                },
              },
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { totalSales: 'desc' },
        ],
      }),
      prisma.seller.count({ where: whereClause }),
    ]);

    const response: ApiResponse<PaginatedResponse<Seller & {
      vehicleCount: number;
      availablePartsCount: number;
    }>> = {
      success: true,
      data: {
        items: sellers.map(seller => ({
          ...seller,
          vehicleCount: seller._count.vehicles,
          availablePartsCount: seller._count.parts,
        })) as any,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      message: 'Sellers retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get seller by ID (public endpoint for marketplace)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            year: true,
            make: true,
            model: true,
            variant: true,
            condition: true,
            _count: {
              select: {
                parts: {
                  where: {
                    isListedOnMarketplace: true,
                    status: 'AVAILABLE',
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        parts: {
          where: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
          select: {
            id: true,
            name: true,
            condition: true,
            price: true,
            currency: true,
            images: true,
            vehicle: {
              select: {
                year: true,
                make: true,
                model: true,
                variant: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to recent parts for performance
        },
      },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Seller> = {
      success: true,
      data: seller as any,
      message: 'Seller retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get current seller profile (authenticated)
router.get('/profile/me', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            parts: true,
          },
        },
      },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller profile not found',
        message: 'Seller profile not found for this user',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Seller & { vehicleCount: number; partsCount: number }> = {
      success: true,
      data: {
        ...seller,
        vehicleCount: seller._count.vehicles,
        partsCount: seller._count.parts,
      } as any,
      message: 'Seller profile retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update seller profile
router.put('/profile/me', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = updateSellerSchema.parse(req.body);

    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller profile not found',
        message: 'Seller profile not found for this user',
      };
      return res.status(404).json(response);
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: validatedData as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });

    const response: ApiResponse<Seller> = {
      success: true,
      data: updatedSeller as any,
      message: 'Seller profile updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get seller analytics/dashboard data
router.get('/analytics/dashboard', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller profile not found',
        message: 'Seller profile not found for this user',
      };
      return res.status(404).json(response);
    }

    // Get dashboard statistics
    const [
      totalVehicles,
      totalParts,
      availableParts,
      soldParts,
      marketplaceParts,
      recentParts,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { sellerId: seller.id },
      }),
      prisma.part.count({
        where: { sellerId: seller.id },
      }),
      prisma.part.count({
        where: { sellerId: seller.id, status: 'AVAILABLE' },
      }),
      prisma.part.count({
        where: { sellerId: seller.id, status: 'SOLD' },
      }),
      prisma.part.count({
        where: { sellerId: seller.id, isListedOnMarketplace: true },
      }),
      prisma.part.findMany({
        where: { sellerId: seller.id },
        select: {
          id: true,
          name: true,
          status: true,
          price: true,
          currency: true,
          createdAt: true,
          vehicle: {
            select: {
              year: true,
              make: true,
              model: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate monthly revenue (last 30 days of sold parts)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlySales = await prisma.part.findMany({
      where: {
        sellerId: seller.id,
        status: 'SOLD',
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        price: true,
        currency: true,
      },
    });

    const monthlyRevenue = monthlySales.reduce((total, part) => {
      if (part.currency === 'ZAR') {
        return total + Number(part.price);
      }
      return total;
    }, 0);

    const dashboardData = {
      totalVehicles,
      totalParts,
      availableParts,
      soldParts,
      marketplaceParts,
      monthlyRevenue,
      recentParts,
      analytics: {
        conversionRate: totalParts > 0 ? (soldParts / totalParts) * 100 : 0,
        marketplaceListingRate: totalParts > 0 ? (marketplaceParts / totalParts) * 100 : 0,
      },
    };

    const response: ApiResponse<typeof dashboardData> = {
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Admin: Verify seller
router.patch('/:id/verify', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = verifySellerSchema.parse(req.body);

    const seller = await prisma.seller.findUnique({
      where: { id },
      select: { id: true, businessName: true },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: {
        isVerified: validatedData.isVerified,
      },
    });

    const response: ApiResponse<{ isVerified: boolean }> = {
      success: true,
      data: {
        isVerified: updatedSeller.isVerified,
      },
      message: `Seller ${validatedData.isVerified ? 'verified' : 'unverified'} successfully`,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Admin: Update seller subscription
router.patch('/:id/subscription', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateSubscriptionSchema.parse(req.body);

    const seller = await prisma.seller.findUnique({
      where: { id },
      select: { id: true, businessName: true },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    const updatedSeller = await prisma.seller.update({
      where: { id },
      data: {
        subscriptionPlan: validatedData.subscriptionPlan,
      },
    });

    const response: ApiResponse<{ subscriptionPlan: string }> = {
      success: true,
      data: {
        subscriptionPlan: updatedSeller.subscriptionPlan,
      },
      message: 'Seller subscription updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get seller locations for map/filtering
router.get('/locations/provinces', async (req, res, next) => {
  try {
    const provinces = await prisma.seller.findMany({
      where: {
        isVerified: true,
      },
      select: {
        province: true,
      },
      distinct: ['province'],
      orderBy: {
        province: 'asc',
      },
    });

    const response: ApiResponse<string[]> = {
      success: true,
      data: provinces.map(p => p.province),
      message: 'Provinces retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/locations/cities', async (req, res, next) => {
  try {
    const province = req.query.province as string;

    let whereClause: any = {
      isVerified: true,
    };

    if (province) {
      whereClause.province = province;
    }

    const cities = await prisma.seller.findMany({
      where: whereClause,
      select: {
        city: true,
        province: true,
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc',
      },
    });

    const response: ApiResponse<{ city: string; province: string }[]> = {
      success: true,
      data: cities,
      message: 'Cities retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;