import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, Part, Vehicle, Seller, PaginatedResponse } from '@partpal/shared-types';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const searchParamsSchema = z.object({
  q: z.string().optional(),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  partName: z.string().optional(),
  partNumber: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  condition: z.union([z.string(), z.array(z.string())]).optional(),
  sellerType: z.union([z.string(), z.array(z.string())]).optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  radius: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.enum(['relevance', 'price_low', 'price_high', 'newest', 'condition']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Search parts - PUBLIC endpoint
router.get('/parts/search', async (req, res, next) => {
  try {
    const validatedQuery = searchParamsSchema.parse(req.query);

    const page = parseInt(validatedQuery.page || '1');
    const pageSize = Math.min(parseInt(validatedQuery.pageSize || '20'), 100);
    const skip = (page - 1) * pageSize;

    // Build where clause for marketplace parts
    let whereClause: any = {
      isListedOnMarketplace: true,
      status: 'AVAILABLE',
      seller: {
        isVerified: true,
      },
    };

    // Text search across multiple fields
    if (validatedQuery.q) {
      whereClause.OR = [
        { name: { contains: validatedQuery.q } },
        { description: { contains: validatedQuery.q } },
        { partNumber: { contains: validatedQuery.q } },
      ];
    }

    // Part-specific filters
    if (validatedQuery.partName) {
      whereClause.name = { contains: validatedQuery.partName };
    }

    if (validatedQuery.partNumber) {
      whereClause.partNumber = { contains: validatedQuery.partNumber };
    }

    // Condition filter
    if (validatedQuery.condition) {
      const conditions = Array.isArray(validatedQuery.condition)
        ? validatedQuery.condition
        : [validatedQuery.condition];
      whereClause.condition = { in: conditions };
    }

    // Price range filter
    if (validatedQuery.minPrice || validatedQuery.maxPrice) {
      whereClause.price = {};
      if (validatedQuery.minPrice) {
        whereClause.price.gte = parseFloat(validatedQuery.minPrice);
      }
      if (validatedQuery.maxPrice) {
        whereClause.price.lte = parseFloat(validatedQuery.maxPrice);
      }
    }

    // Vehicle filters
    if (validatedQuery.year || validatedQuery.make || validatedQuery.model) {
      whereClause.vehicle = {};

      if (validatedQuery.year) {
        whereClause.vehicle.year = parseInt(validatedQuery.year);
      }

      if (validatedQuery.make) {
        whereClause.vehicle.make = { contains: validatedQuery.make };
      }

      if (validatedQuery.model) {
        whereClause.vehicle.model = { contains: validatedQuery.model };
      }
    }

    // Location filters
    if (validatedQuery.province) {
      whereClause.seller = {
        ...whereClause.seller,
        province: { contains: validatedQuery.province },
      };
    }

    if (validatedQuery.city) {
      whereClause.seller = {
        ...whereClause.seller,
        city: { contains: validatedQuery.city },
      };
    }

    // Seller type filter
    if (validatedQuery.sellerType) {
      const sellerTypes = Array.isArray(validatedQuery.sellerType)
        ? validatedQuery.sellerType
        : [validatedQuery.sellerType];
      whereClause.seller = {
        ...whereClause.seller,
        businessType: { in: sellerTypes },
      };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // newest by default

    if (validatedQuery.sortBy) {
      switch (validatedQuery.sortBy) {
        case 'price_low':
          orderBy = { price: 'asc' };
          break;
        case 'price_high':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'condition':
          orderBy = { condition: 'desc' };
          break;
        case 'relevance':
          // Keep relevance-based ordering (seller rating, then date)
          orderBy = [
            { seller: { rating: 'desc' } },
            { createdAt: 'desc' },
          ];
          break;
      }
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
              totalSales: true,
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
        orderBy,
      }),
      prisma.part.count({ where: whereClause }),
    ]);

    // Generate facets for filtering
    const facets = await generateSearchFacets(whereClause);

    const response: ApiResponse<{
      parts: typeof parts;
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
      facets: typeof facets;
    }> = {
      success: true,
      data: {
        parts: parts as any,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        facets,
      },
      message: 'Search completed successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get featured parts - PUBLIC endpoint
router.get('/parts/featured', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);

    // Get featured parts (top-rated sellers, newest listings)
    const featuredParts = await prisma.part.findMany({
      where: {
        isListedOnMarketplace: true,
        status: 'AVAILABLE',
        seller: {
          isVerified: true,
          rating: { gte: 4.0 },
        },
      },
      take: limit,
      include: {
        vehicle: {
          select: {
            id: true,
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
            city: true,
            province: true,
            isVerified: true,
            rating: true,
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
        { seller: { rating: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    const response: ApiResponse<typeof featuredParts> = {
      success: true,
      data: featuredParts as any,
      message: 'Featured parts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get part by ID - PUBLIC endpoint
router.get('/parts/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const part = await prisma.part.findUnique({
      where: {
        id,
        isListedOnMarketplace: true,
        status: 'AVAILABLE',
      },
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
            description: true,
            street: true,
            city: true,
            province: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            phone: true,
            email: true,
            whatsapp: true,
            website: true,
            isVerified: true,
            rating: true,
            totalSales: true,
            businessHours: true,
            createdAt: true,
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
        message: 'Part with this ID does not exist or is not available on marketplace',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof part> = {
      success: true,
      data: part as any,
      message: 'Part retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get part suggestions for autocomplete - PUBLIC endpoint
router.get('/parts/suggestions', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const type = (req.query.type as string) || 'parts';

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Query too short',
      });
    }

    let suggestions: string[] = [];

    switch (type) {
      case 'parts':
        // Get unique part names that match query
        const parts = await prisma.part.findMany({
          where: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
            name: {
              contains: query,
            },
          },
          select: { name: true },
          distinct: ['name'],
          take: 10,
        });
        suggestions = parts.map(p => p.name);
        break;

      case 'makes':
        // Get unique vehicle makes
        const makes = await prisma.vehicle.findMany({
          where: {
            make: {
              contains: query,
            },
            parts: {
              some: {
                isListedOnMarketplace: true,
                status: 'AVAILABLE',
              },
            },
          },
          select: { make: true },
          distinct: ['make'],
          take: 10,
          orderBy: { make: 'asc' },
        });
        suggestions = makes.map(v => v.make);
        break;

      case 'models':
        const makeFilter = req.query.make as string;
        const whereClause: any = {
          model: {
            contains: query,
          },
          parts: {
            some: {
              isListedOnMarketplace: true,
              status: 'AVAILABLE',
            },
          },
        };

        if (makeFilter) {
          whereClause.make = {
            contains: makeFilter,
          };
        }

        const models = await prisma.vehicle.findMany({
          where: whereClause,
          select: { model: true },
          distinct: ['model'],
          take: 10,
          orderBy: { model: 'asc' },
        });
        suggestions = models.map(v => v.model);
        break;
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

// Get vehicle makes - PUBLIC endpoint
router.get('/vehicles/makes', async (req, res, next) => {
  try {
    const makes = await prisma.vehicle.findMany({
      where: {
        parts: {
          some: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
        },
      },
      select: { make: true },
      distinct: ['make'],
      orderBy: { make: 'asc' },
    });

    const response: ApiResponse<string[]> = {
      success: true,
      data: makes.map(v => v.make),
      message: 'Vehicle makes retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get vehicle models by make - PUBLIC endpoint
router.get('/vehicles/models', async (req, res, next) => {
  try {
    const make = req.query.make as string;

    if (!make) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Make parameter is required',
        message: 'Please provide a vehicle make',
      };
      return res.status(400).json(response);
    }

    const models = await prisma.vehicle.findMany({
      where: {
        make: {
          equals: make,
        },
        parts: {
          some: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
        },
      },
      select: { model: true },
      distinct: ['model'],
      orderBy: { model: 'asc' },
    });

    const response: ApiResponse<string[]> = {
      success: true,
      data: models.map(v => v.model),
      message: 'Vehicle models retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get vehicle by ID - PUBLIC endpoint
router.get('/vehicles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            city: true,
            province: true,
          },
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
          },
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

    const response: ApiResponse<typeof vehicle> = {
      success: true,
      data: vehicle as any,
      message: 'Vehicle retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get seller by ID - PUBLIC endpoint
router.get('/sellers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({
      where: {
        id,
        isVerified: true,
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        description: true,
        street: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        whatsapp: true,
        website: true,
        isVerified: true,
        rating: true,
        totalSales: true,
        businessHours: true,
        createdAt: true,
      },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist or is not verified',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof seller> = {
      success: true,
      data: seller as any,
      message: 'Seller retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get seller parts - PUBLIC endpoint
router.get('/sellers/:id/parts', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    // Verify seller exists and is verified
    const seller = await prisma.seller.findUnique({
      where: { id, isVerified: true },
      select: { id: true },
    });

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist or is not verified',
      };
      return res.status(404).json(response);
    }

    const [parts, totalCount] = await Promise.all([
      prisma.part.findMany({
        where: {
          sellerId: id,
          isListedOnMarketplace: true,
          status: 'AVAILABLE',
        },
        skip,
        take: pageSize,
        include: {
          vehicle: {
            select: {
              id: true,
              year: true,
              make: true,
              model: true,
              variant: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.part.count({
        where: {
          sellerId: id,
          isListedOnMarketplace: true,
          status: 'AVAILABLE',
        },
      }),
    ]);

    const response: ApiResponse<PaginatedResponse<typeof parts[0]>> = {
      success: true,
      data: {
        items: parts as any,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      message: 'Seller parts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Search sellers - PUBLIC endpoint
router.get('/sellers/search', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const location = req.query.location as string;
    const businessType = req.query.businessType as string | string[];
    const isVerified = req.query.isVerified === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      isVerified: true, // Only show verified sellers publicly
    };

    if (query) {
      whereClause.OR = [
        { businessName: { contains: query } },
        { description: { contains: query } },
      ];
    }

    if (location) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { city: { contains: location } },
        { province: { contains: location } },
      ];
    }

    if (businessType) {
      const types = Array.isArray(businessType) ? businessType : [businessType];
      whereClause.businessType = { in: types };
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
          isVerified: true,
          rating: true,
          totalSales: true,
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
        orderBy: [
          { rating: 'desc' },
          { totalSales: 'desc' },
        ],
      }),
      prisma.seller.count({ where: whereClause }),
    ]);

    const response: ApiResponse<PaginatedResponse<typeof sellers[0]>> = {
      success: true,
      data: {
        items: sellers as any,
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

// Helper function to generate search facets
async function generateSearchFacets(baseWhereClause: any) {
  // Remove specific filters for facet generation
  const facetWhereClause = {
    isListedOnMarketplace: true,
    status: 'AVAILABLE',
    seller: {
      isVerified: true,
    },
  };

  const [vehicleMakes, conditions, locations] = await Promise.all([
    // Vehicle makes
    prisma.vehicle.findMany({
      where: {
        parts: {
          some: facetWhereClause,
        },
      },
      select: { make: true },
      distinct: ['make'],
    }),
    // Conditions
    prisma.part.groupBy({
      by: ['condition'],
      where: facetWhereClause,
      _count: true,
    }),
    // Locations (provinces)
    prisma.seller.findMany({
      where: {
        isVerified: true,
        parts: {
          some: {
            isListedOnMarketplace: true,
            status: 'AVAILABLE',
          },
        },
      },
      select: {
        province: true,
        city: true,
      },
      distinct: ['province', 'city'],
    }),
  ]);

  // Count parts per make
  const makesCounts = await Promise.all(
    vehicleMakes.map(async ({ make }) => {
      const count = await prisma.part.count({
        where: {
          ...facetWhereClause,
          vehicle: { make },
        },
      });
      return { value: make, count };
    })
  );

  // Generate models facet (empty initially, populated when make is selected)
  const models: { value: string; count: number }[] = [];

  // Process locations
  const locationMap = new Map<string, number>();
  await Promise.all(
    locations.map(async (loc) => {
      if (loc.province) {
        const count = await prisma.part.count({
          where: {
            ...facetWhereClause,
            seller: {
              isVerified: true,
              province: loc.province,
            },
          },
        });
        const current = locationMap.get(loc.province) || 0;
        locationMap.set(loc.province, current + count);
      }
    })
  );

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
    makes: makesCounts.sort((a, b) => b.count - a.count),
    models,
    conditions: conditions.map(c => ({ value: c.condition, count: c._count })),
    priceRanges: priceRangeCounts.filter(r => r.count > 0),
    locations: Array.from(locationMap.entries()).map(([value, count]) => ({ value, count })),
  };
}

export default router;
