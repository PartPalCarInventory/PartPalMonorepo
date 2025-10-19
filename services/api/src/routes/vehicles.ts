import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, Vehicle, PaginatedResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth';
import { z } from 'zod';

const router: express.Router = express.Router();

// Validation schemas
const createVehicleSchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  variant: z.string().max(100).optional(),
  engineSize: z.string().max(20).optional(),
  fuelType: z.string().max(20).optional(),
  transmission: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  mileage: z.number().int().min(0).optional(),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  acquisitionDate: z.string().transform(str => new Date(str)),
});

const updateVehicleSchema = createVehicleSchema.partial().omit({ vin: true });

// Get all vehicles for authenticated seller
router.get('/', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    // Query filters
    const search = req.query.search as string;
    const make = req.query.make as string;
    const model = req.query.model as string;
    const yearFrom = req.query.yearFrom ? parseInt(req.query.yearFrom as string) : undefined;
    const yearTo = req.query.yearTo ? parseInt(req.query.yearTo as string) : undefined;
    const condition = req.query.condition as string;
    const sortBy = (req.query.sortBy as string) || 'newest';

    // Build where clause
    let whereClause: any = {};

    if (userRole === 'SELLER') {
      // Sellers can only see their own vehicles
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
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
        { variant: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (make) whereClause.make = { contains: make, mode: 'insensitive' };
    if (model) whereClause.model = { contains: model, mode: 'insensitive' };
    if (yearFrom || yearTo) {
      whereClause.year = {};
      if (yearFrom) whereClause.year.gte = yearFrom;
      if (yearTo) whereClause.year.lte = yearTo;
    }
    if (condition) whereClause.condition = condition;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'make':
        orderBy = { make: 'asc' };
        break;
      case 'model':
        orderBy = { model: 'asc' };
        break;
      case 'year':
        orderBy = { year: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
          seller: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
            },
          },
          _count: {
            select: {
              parts: true,
            },
          },
        },
        orderBy,
      }),
      prisma.vehicle.count({ where: whereClause }),
    ]);

    const response: ApiResponse<PaginatedResponse<Vehicle & { partsCount: number }>> = {
      success: true,
      data: {
        items: vehicles.map(vehicle => ({
          ...vehicle,
          partsCount: vehicle._count.parts,
        })) as any,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      message: 'Vehicles retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            businessType: true,
            city: true,
            province: true,
            phone: true,
            isVerified: true,
          },
        },
        parts: {
          select: {
            id: true,
            name: true,
            condition: true,
            price: true,
            currency: true,
            status: true,
            isListedOnMarketplace: true,
            images: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Vehicle not found',
        message: 'Vehicle with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Check permissions
    if (userRole === 'SELLER' && vehicle.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only view your own vehicles',
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse<Vehicle> = {
      success: true,
      data: vehicle as any,
      message: 'Vehicle retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Create new vehicle
router.post('/', authenticateToken, requireRole(['SELLER', 'ADMIN']), requireVerified, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createVehicleSchema.parse(req.body);

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

    // Check if VIN already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin: validatedData.vin },
    });

    if (existingVehicle) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'VIN already exists',
        message: 'A vehicle with this VIN is already registered',
      };
      return res.status(409).json(response);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...validatedData,
        sellerId: seller.id,
      } as any,
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
          },
        },
      },
    });

    const response: ApiResponse<Vehicle> = {
      success: true,
      data: vehicle as any,
      message: 'Vehicle created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Update vehicle
router.put('/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const validatedData = updateVehicleSchema.parse(req.body);

    // Check if vehicle exists and user has permission
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true },
        },
      },
    });

    if (!existingVehicle) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Vehicle not found',
        message: 'Vehicle with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingVehicle.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only update your own vehicles',
      };
      return res.status(403).json(response);
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: validatedData,
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
          },
        },
      },
    });

    const response: ApiResponse<Vehicle> = {
      success: true,
      data: updatedVehicle as any,
      message: 'Vehicle updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, requireRole(['SELLER', 'ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Check if vehicle exists and user has permission
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        seller: {
          select: { userId: true },
        },
        _count: {
          select: { parts: true },
        },
      },
    });

    if (!existingVehicle) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Vehicle not found',
        message: 'Vehicle with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (userRole === 'SELLER' && existingVehicle.seller.userId !== userId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own vehicles',
      };
      return res.status(403).json(response);
    }

    if (existingVehicle._count.parts > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Cannot delete vehicle',
        message: 'Vehicle has associated parts. Please remove parts first.',
      };
      return res.status(400).json(response);
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Vehicle deleted successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;