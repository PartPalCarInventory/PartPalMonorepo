import express, { Router } from 'express';
import { prisma } from '@partpal/database';

export function createMockApiRoutes(): Router {
  const router = express.Router();

  // Marketplace search endpoint
  router.get('/marketplace/search', async (req, res) => {
    try {
      const {
        q,
        make,
        model,
        year,
        partNumber,
        minPrice,
        maxPrice,
        condition,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Validate that at least one search parameter is provided
      if (!q && !make && !model && !year && !partNumber && !minPrice && !maxPrice && !condition) {
        return res.status(400).json({
          success: false,
          error: 'At least one search parameter is required',
        });
      }

      // Validate numeric parameters
      if (minPrice && isNaN(Number(minPrice))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          message: 'minPrice must be a number',
        });
      }

      if (maxPrice && isNaN(Number(maxPrice))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          message: 'maxPrice must be a number',
        });
      }

      if (year && isNaN(Number(year))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          message: 'year must be a number',
        });
      }

      // Build where clause
      const where: any = {
        isListedOnMarketplace: true,
      };

      // Text search
      if (q) {
        where.OR = [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
        ];
      }

      // Part number search
      if (partNumber) {
        where.partNumber = partNumber as string;
      }

      // Price filtering
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }

      // Condition filtering
      if (condition) {
        if (Array.isArray(condition)) {
          where.condition = { in: condition };
        } else {
          where.condition = condition;
        }
      }

      // Vehicle filtering
      if (make || model || year) {
        where.vehicle = {};
        if (make) where.vehicle.make = make as string;
        if (model) where.vehicle.model = model as string;
        if (year) where.vehicle.year = Number(year);
      }

      // Pagination
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

      // Execute query
      const [parts, totalCount] = await Promise.all([
        prisma.part.findMany({
          where,
          include: {
            vehicle: {
              select: {
                make: true,
                model: true,
                year: true,
                engineSize: true,
                fuelType: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                isVerified: true,
              },
            },
          },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.part.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,
        data: {
          parts,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Search service temporarily unavailable',
        message: 'Please try again in a few moments',
      });
    }
  });

  // Auth endpoints for testing
  router.post('/auth/login', async (req, res) => {
    // Mock login endpoint
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Simple mock authentication
    if (email === 'test@partpal.test' && password === 'testpass123') {
      return res.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 'test-user-id',
            email,
            name: 'Test User',
            role: 'seller',
            isVerified: true,
          },
        },
      });
    }

    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  });

  // Parts CRUD endpoints
  router.get('/parts', async (req, res) => {
    try {
      const parts = await prisma.part.findMany({
        include: {
          vehicle: true,
          seller: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: parts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch parts',
      });
    }
  });

  router.get('/parts/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const part = await prisma.part.findUnique({
        where: { id },
        include: {
          vehicle: true,
          seller: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              email: false, // Don't expose email
            },
          },
        },
      });

      if (!part) {
        return res.status(404).json({
          success: false,
          error: 'Part not found',
        });
      }

      res.json({
        success: true,
        data: part,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch part',
      });
    }
  });

  // Vehicle endpoints
  router.get('/vehicles', async (req, res) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            },
          },
          parts: {
            select: {
              id: true,
              name: true,
              partNumber: true,
              condition: true,
              price: true,
              isListedOnMarketplace: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vehicles',
      });
    }
  });

  // Seller contact endpoint
  router.post('/marketplace/contact-seller', async (req, res) => {
    try {
      const { sellerId, partId, message, contactMethod, buyerInfo } = req.body;

      if (!sellerId || !partId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // In a real implementation, this would send an email/SMS to the seller
      // For testing, we just return success

      res.json({
        success: true,
        message: 'Contact request sent successfully',
        data: {
          contactId: `contact_${Date.now()}`,
          status: 'sent',
          estimatedResponse: '24 hours',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to send contact request',
      });
    }
  });

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}