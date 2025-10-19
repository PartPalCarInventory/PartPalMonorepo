import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, Part, PaginatedResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createPartSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  name: z.string().min(1).max(200),
  partNumber: z.string().max(100).optional(),
  description: z.string().min(1),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3).default('ZAR'),
  location: z.string().min(1).max(100),
  categoryId: z.string().optional(),
  images: z.array(z.string().url()).default([]),
});

const updatePartSchema = createPartSchema.partial().omit({ vehicleId: true });

const toggleMarketplaceSchema = z.object({
  isListedOnMarketplace: z.boolean(),
});

const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD']),
});

// Get all parts for authenticated user/seller
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    // Query filters
    const search = req.query.search as string;
    const vehicleId = req.query.vehicleId as string;
    const status = req.query.status as string;
    const condition = req.query.condition as string;
    const categoryId = req.query.categoryId as string;
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined;
    const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined;
    const isListedOnMarketplace = req.query.isListedOnMarketplace === 'true';
    const sortBy = (req.query.sortBy as string) || 'newest';

    // Build where clause
    let whereClause: any = {};

    if (userRole === 'SELLER') {
      // Sellers can only see their own parts
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

      whereClause.sellerId = seller.id;
    }

    // Add filters
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (vehicleId) whereClause.vehicleId = vehicleId;
    if (status) whereClause.status = status;
    if (condition) whereClause.condition = condition;
    if (categoryId) whereClause.categoryId = categoryId;
    if (priceMin !== undefined || priceMax !== undefined) {
      whereClause.price = {};
      if (priceMin !== undefined) whereClause.price.gte = priceMin;
      if (priceMax !== undefined) whereClause.price.lte = priceMax;
    }
    if (req.query.isListedOnMarketplace !== undefined) {
      whereClause.isListedOnMarketplace = isListedOnMarketplace;
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [parts, totalCount] = await Promise.all([
      prisma.part.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
          vehicle: {
            select: {
              id: true,
              vin: true,
              year: true,
              make: true,
              model: true,
              variant: true,
            },
          },
          seller: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
              city: true,
              province: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
      }),
      prisma.part.count({ where: whereClause }),
    ]);

    const response: ApiResponse<PaginatedResponse<Part>> = {
      success: true,
      data: {
        items: parts as any,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      message: 'Parts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get part by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            vin: true,
            year: true,
            make: true,
            model: true,
            variant: true,
            engineSize: true,
            fuelType: true,
            transmission: true,
            color: true,
            mileage: true,
            condition: true,
          },
        },
        seller: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessType: true,
            description: true,
            street: true,
            city: true,
            province: true,
            phone: true,
            whatsapp: true,
            website: true,
            isVerified: true,
            rating: true,
            businessHours: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!part) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Check permissions for non-marketplace listings
    if (userRole === 'SELLER' && part.seller.userId !== userId && !part.isListedOnMarketplace) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only view your own parts or marketplace listings',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse<Part> = {
      success: true,
      data: part as any,
      message: 'Part retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create new part
router.post('/', authenticateToken, requireRole(['SELLER', 'ADMIN']), requireVerified, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createPartSchema.parse(req.body);

    // Get seller profile
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

    // Verify vehicle belongs to seller
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
      select: { sellerId: true },
    });

    if (!vehicle || vehicle.sellerId !== seller.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Vehicle not found',
        message: 'Vehicle not found or you do not have permission to add parts to it',
      };
      return res.status(404).json(response);
    }

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category || !category.isActive) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid category',
          message: 'Category not found or inactive',
        };
        return res.status(400).json(response);
      }
    }

    const part = await prisma.part.create({
      data: {
        ...validatedData,
        images: JSON.stringify(validatedData.images),
        sellerId: seller.id,
      } as any,
      include: {
        vehicle: {
          select: {
            id: true,
            vin: true,
            year: true,
            make: true,
            model: true,
            variant: true,
          },
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse<Part> = {
      success: true,
      data: part as any,
      message: 'Part created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Update part
router.put('/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const validatedData = updatePartSchema.parse(req.body);

    // Check if part exists and user has permission
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true },
        },
      },
    });

    if (!existingPart) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingPart.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only update your own parts',
      };
      return res.status(403).json(response);
    }

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category || !category.isActive) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid category',
          message: 'Category not found or inactive',
        };
        return res.status(400).json(response);
      }
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.images && { images: JSON.stringify(validatedData.images) }),
      } as any,
      include: {
        vehicle: {
          select: {
            id: true,
            vin: true,
            year: true,
            make: true,
            model: true,
            variant: true,
          },
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse<Part> = {
      success: true,
      data: updatedPart as any,
      message: 'Part updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Toggle marketplace listing
router.patch('/:id/marketplace', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const validatedData = toggleMarketplaceSchema.parse(req.body);

    // Check if part exists and user has permission
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true, isVerified: true },
        },
      },
    });

    if (!existingPart) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingPart.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only update your own parts',
      };
      return res.status(403).json(response);
    }

    // Only verified sellers can list on marketplace
    if (validatedData.isListedOnMarketplace && !existingPart.seller.isVerified) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Verification required',
        message: 'Only verified sellers can list parts on the marketplace',
      };
      return res.status(403).json(response);
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: {
        isListedOnMarketplace: validatedData.isListedOnMarketplace,
      },
    });

    const response: ApiResponse<{ isListedOnMarketplace: boolean }> = {
      success: true,
      data: {
        isListedOnMarketplace: updatedPart.isListedOnMarketplace,
      },
      message: validatedData.isListedOnMarketplace
        ? 'Part listed on marketplace successfully'
        : 'Part removed from marketplace successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update part status
router.patch('/:id/status', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const validatedData = updateStatusSchema.parse(req.body);

    // Check if part exists and user has permission
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true },
        },
      },
    });

    if (!existingPart) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingPart.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only update your own parts',
      };
      return res.status(403).json(response);
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
    });

    // Update seller's total sales if part is sold
    if (validatedData.status === 'SOLD' && existingPart.status !== 'SOLD') {
      await prisma.seller.update({
        where: { id: existingPart.sellerId },
        data: {
          totalSales: {
            increment: 1,
          },
        },
      });
    }

    const response: ApiResponse<{ status: string }> = {
      success: true,
      data: {
        status: updatedPart.status,
      },
      message: 'Part status updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Delete part
router.delete('/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Check if part exists and user has permission
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true },
        },
      },
    });

    if (!existingPart) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingPart.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own parts',
      };
      return res.status(403).json(response);
    }

    await prisma.part.delete({
      where: { id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Part deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Bulk operations
router.post('/bulk/update-status', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { partIds, status } = req.body;

    if (!Array.isArray(partIds) || partIds.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid input',
        message: 'partIds must be a non-empty array',
      };
      return res.status(400).json(response);
    }

    if (!['AVAILABLE', 'RESERVED', 'SOLD'].includes(status)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid status',
        message: 'Status must be AVAILABLE, RESERVED, or SOLD',
      };
      return res.status(400).json(response);
    }

    // Check permissions
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
        };
        return res.status(404).json(response);
      }

      // Verify all parts belong to seller
      const parts = await prisma.part.findMany({
        where: {
          id: { in: partIds },
          sellerId: seller.id,
        },
      });

      if (parts.length !== partIds.length) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Access denied',
          message: 'Some parts do not belong to you',
        };
        return res.status(403).json(response);
      }
    }

    // Update parts
    const result = await prisma.part.updateMany({
      where: { id: { in: partIds } },
      data: { status },
    });

    const response: ApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount: result.count },
      message: `${result.count} parts updated successfully`,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/bulk/toggle-marketplace', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { partIds, isListedOnMarketplace } = req.body;

    if (!Array.isArray(partIds) || partIds.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid input',
        message: 'partIds must be a non-empty array',
      };
      return res.status(400).json(response);
    }

    // Check permissions
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true, isVerified: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
        };
        return res.status(404).json(response);
      }

      if (isListedOnMarketplace && !seller.isVerified) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Verification required',
          message: 'Only verified sellers can list parts on the marketplace',
        };
        return res.status(403).json(response);
      }

      // Verify all parts belong to seller
      const parts = await prisma.part.findMany({
        where: {
          id: { in: partIds },
          sellerId: seller.id,
        },
      });

      if (parts.length !== partIds.length) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Access denied',
          message: 'Some parts do not belong to you',
        };
        return res.status(403).json(response);
      }
    }

    // Update parts
    const result = await prisma.part.updateMany({
      where: { id: { in: partIds } },
      data: { isListedOnMarketplace },
    });

    const response: ApiResponse<{ updatedCount: number }> = {
      success: true,
      data: { updatedCount: result.count },
      message: `${result.count} parts ${isListedOnMarketplace ? 'listed on' : 'removed from'} marketplace`,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/bulk/delete', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { partIds } = req.body;

    if (!Array.isArray(partIds) || partIds.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid input',
        message: 'partIds must be a non-empty array',
      };
      return res.status(400).json(response);
    }

    // Check permissions
    if (userRole === 'SELLER') {
      const seller = await prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!seller) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Seller profile not found',
        };
        return res.status(404).json(response);
      }

      // Verify all parts belong to seller
      const parts = await prisma.part.findMany({
        where: {
          id: { in: partIds },
          sellerId: seller.id,
        },
      });

      if (parts.length !== partIds.length) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Access denied',
          message: 'Some parts do not belong to you',
        };
        return res.status(403).json(response);
      }
    }

    // Delete parts
    const result = await prisma.part.deleteMany({
      where: { id: { in: partIds } },
    });

    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      data: { deletedCount: result.count },
      message: `${result.count} parts deleted successfully`,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;