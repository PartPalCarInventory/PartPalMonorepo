import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, SearchResult, SearchFilters } from '@partpal/shared-types';
import { z } from 'zod';

const router: express.Router = express.Router();

// Search validation schema
const searchSchema = z.object({
  query: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  partName: z.string().optional(),
  partNumber: z.string().optional(),
  location: z.object({
    province: z.string().optional(),
    city: z.string().optional(),
    radius: z.number().min(1).max(500).optional(), // km
  }).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  condition: z.array(z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'])).optional(),
  sellerType: z.array(z.enum(['SCRAP_YARD', 'DISMANTLER', 'PRIVATE'])).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Main search endpoint for marketplace
router.post('/parts', async (req, res, next) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    const { page, pageSize, ...filters } = validatedData;
    const skip = (page - 1) * pageSize;

    // Build where clause for parts
    let whereClause: any = {
      isListedOnMarketplace: true,
      status: 'AVAILABLE',
    };

    // Text search
    if (filters.query) {
      whereClause.OR = [
        {
          name: {
            contains: filters.query,
          },
        },
        {
          description: {
            contains: filters.query,
          },
        },
        {
          partNumber: {
            contains: filters.query,
          },
        },
      ];
    }

    // Part-specific filters
    if (filters.partName) {
      whereClause.name = {
        contains: filters.partName,
      };
    }

    if (filters.partNumber) {
      whereClause.partNumber = {
        contains: filters.partNumber,
      };
    }

    if (filters.condition && filters.condition.length > 0) {
      whereClause.condition = {
        in: filters.condition,
      };
    }

    // Price range filter
    if (filters.priceRange) {
      whereClause.price = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max,
      };
    }

    // Vehicle filters
    if (filters.vehicleYear || filters.vehicleMake || filters.vehicleModel) {
      whereClause.vehicle = {};

      if (filters.vehicleYear) {
        whereClause.vehicle.year = filters.vehicleYear;
      }

      if (filters.vehicleMake) {
        whereClause.vehicle.make = {
          contains: filters.vehicleMake,
        };
      }

      if (filters.vehicleModel) {
        whereClause.vehicle.model = {
          contains: filters.vehicleModel,
        };
      }
    }

    // Seller filters
    if (filters.location || filters.sellerType) {
      whereClause.seller = {};

      if (filters.location?.province) {
        whereClause.seller.province = {
          contains: filters.location.province,
        };
      }

      if (filters.location?.city) {
        whereClause.seller.city = {
          contains: filters.location.city,
        };
      }

      if (filters.sellerType && filters.sellerType.length > 0) {
        whereClause.seller.businessType = {
          in: filters.sellerType,
        };
      }

      // Only verified sellers
      whereClause.seller.isVerified = true;
    } else {
      // Ensure only verified sellers when no seller filters
      whereClause.seller = {
        isVerified: true,
      };
    }

    // Execute search with pagination
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
              businessName: true,
              businessType: true,
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
            },
          },
        },
        orderBy: [
          { seller: { isVerified: 'desc' } },
          { seller: { rating: 'desc' } },
          { createdAt: 'desc' },
        ],
      }),
      prisma.part.count({ where: whereClause }),
    ]);

    // Generate facets for filtering
    const facets = await generateFacets(whereClause);

    const searchResult: SearchResult = {
      parts: parts as any,
      totalCount,
      facets: facets as any,
    };

    const response: ApiResponse<{
      results: SearchResult;
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
      };
    }> = {
      success: true,
      data: {
        results: searchResult,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
      message: 'Search completed successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Helper function to generate search facets
async function generateFacets(baseWhereClause: any) {
  // Remove specific filters to get broader facet data
  const facetWhereClause = {
    ...baseWhereClause,
  };

  // Remove vehicle and condition filters for facet generation
  delete facetWhereClause.vehicle;
  delete facetWhereClause.condition;

  const [makes, models, conditions, sellers] = await Promise.all([
    // Vehicle makes
    prisma.part.findMany({
      where: facetWhereClause,
      select: {
        vehicle: {
          select: { make: true },
        },
      },
      distinct: ['vehicleId'],
    }),
    // Vehicle models (for current make if specified)
    prisma.part.findMany({
      where: facetWhereClause,
      select: {
        vehicle: {
          select: { model: true },
        },
      },
      distinct: ['vehicleId'],
    }),
    // Conditions
    prisma.part.groupBy({
      by: ['condition'],
      where: facetWhereClause,
      _count: true,
    }),
    // Business types
    prisma.part.findMany({
      where: facetWhereClause,
      select: {
        seller: {
          select: { businessType: true },
        },
      },
      distinct: ['sellerId'],
    }),
  ]);

  // Process makes
  const makesCounts = makes.reduce((acc, part) => {
    const make = part.vehicle.make;
    acc[make] = (acc[make] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Process models
  const modelsCounts = models.reduce((acc, part) => {
    const model = part.vehicle.model;
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate price ranges
  const priceRanges = [
    { range: '0-1000', min: 0, max: 1000 },
    { range: '1000-5000', min: 1000, max: 5000 },
    { range: '5000-10000', min: 5000, max: 10000 },
    { range: '10000-25000', min: 10000, max: 25000 },
    { range: '25000+', min: 25000, max: 999999999 },
  ];

  const priceRangeCounts = await Promise.all(
    priceRanges.map(async (range) => {
      const count = await prisma.part.count({
        where: {
          ...facetWhereClause,
          price: {
            gte: range.min,
            lte: range.max,
          },
        },
      });
      return { range: range.range, count };
    })
  );

  return {
    makes: Object.entries(makesCounts).map(([value, count]) => ({ value, count })),
    models: Object.entries(modelsCounts).map(([value, count]) => ({ value, count })),
    conditions: conditions.map(c => ({ value: c.condition, count: c._count })),
    priceRanges: priceRangeCounts.filter(r => r.count > 0),
  };
}

// Quick search endpoint (simplified)
router.get('/quick', async (req, res, next) => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      const response: ApiResponse<any[]> = {
        success: true,
        data: [],
        message: 'Query too short',
      };
      return res.json(response);
    }

    const results = await prisma.part.findMany({
      where: {
        isListedOnMarketplace: true,
        status: 'AVAILABLE',
        seller: {
          isVerified: true,
        },
        OR: [
          {
            name: {
              contains: query,
            },
          },
          {
            partNumber: {
              contains: query,
            },
          },
          {
            vehicle: {
              OR: [
                {
                  make: {
                    contains: query,
                  },
                },
                {
                  model: {
                    contains: query,
                  },
                },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        partNumber: true,
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
        seller: {
          select: {
            businessName: true,
            city: true,
            province: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      message: 'Quick search completed',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get popular search terms/suggestions
router.get('/suggestions', async (req, res, next) => {
  try {
    const type = req.query.type as string;

    let suggestions: string[] = [];

    switch (type) {
      case 'makes':
        const makes = await prisma.vehicle.findMany({
          select: { make: true },
          distinct: ['make'],
          where: {
            parts: {
              some: {
                isListedOnMarketplace: true,
                status: 'AVAILABLE',
              },
            },
          },
          orderBy: { make: 'asc' },
          take: 20,
        });
        suggestions = makes.map(v => v.make);
        break;

      case 'models':
        const make = req.query.make as string;
        const whereClause: any = {
          parts: {
            some: {
              isListedOnMarketplace: true,
              status: 'AVAILABLE',
            },
          },
        };

        if (make) {
          whereClause.make = {
            contains: make,
          };
        }

        const models = await prisma.vehicle.findMany({
          select: { model: true },
          distinct: ['model'],
          where: whereClause,
          orderBy: { model: 'asc' },
          take: 20,
        });
        suggestions = models.map(v => v.model);
        break;

      case 'parts':
        const partNames = await prisma.part.groupBy({
          by: ['name'],
          where: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
          _count: true,
          orderBy: {
            _count: {
              name: 'desc',
            },
          },
          take: 20,
        });
        suggestions = partNames.map(p => p.name);
        break;

      default:
        suggestions = [];
    }

    const response: ApiResponse<string[]> = {
      success: true,
      data: suggestions,
      message: 'Suggestions retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;