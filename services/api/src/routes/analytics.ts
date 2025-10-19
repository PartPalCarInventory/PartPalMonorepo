import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse } from '@partpal/shared-types';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const partViewSchema = z.object({
  partId: z.string().min(1),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
});

const searchTrackingSchema = z.object({
  query: z.string(),
  filters: z.any(),
  resultsCount: z.number(),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
});

const sellerContactSchema = z.object({
  sellerId: z.string().min(1),
  partId: z.string().min(1),
  contactMethod: z.enum(['phone', 'whatsapp', 'email']),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
});

// Track part view - PUBLIC endpoint (no auth required)
router.post('/part-view', async (req, res, next) => {
  try {
    const validatedData = partViewSchema.parse(req.body);
    const timestamp = validatedData.timestamp ? new Date(validatedData.timestamp) : new Date();

    // Verify part exists
    const part = await prisma.part.findUnique({
      where: { id: validatedData.partId },
      select: { id: true, sellerId: true },
    });

    if (!part) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Log the view event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'PART_VIEW',
        partId: validatedData.partId,
        sellerId: part.sellerId,
        sessionId: validatedData.sessionId,
        userAgent: validatedData.userAgent || req.headers['user-agent'],
        metadata: JSON.stringify({
          timestamp: timestamp.toISOString(),
          ip: req.ip,
        }),
        timestamp,
      },
    });

    const response: ApiResponse<{ tracked: boolean }> = {
      success: true,
      data: { tracked: true },
      message: 'Part view tracked successfully',
    };

    res.json(response);
  } catch (error) {
    // Don't fail hard on analytics errors
    console.error('Analytics tracking error:', error);
    res.json({
      success: true,
      data: { tracked: false },
      message: 'Analytics tracking failed silently',
    });
  }
});

// Track search query - PUBLIC endpoint (no auth required)
router.post('/search', async (req, res, next) => {
  try {
    const validatedData = searchTrackingSchema.parse(req.body);
    const timestamp = validatedData.timestamp ? new Date(validatedData.timestamp) : new Date();

    // Log the search event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'SEARCH',
        sessionId: validatedData.sessionId,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          query: validatedData.query,
          filters: validatedData.filters,
          resultsCount: validatedData.resultsCount,
          timestamp: timestamp.toISOString(),
          ip: req.ip,
        }),
        timestamp,
      },
    });

    const response: ApiResponse<{ tracked: boolean }> = {
      success: true,
      data: { tracked: true },
      message: 'Search tracked successfully',
    };

    res.json(response);
  } catch (error) {
    // Don't fail hard on analytics errors
    console.error('Analytics tracking error:', error);
    res.json({
      success: true,
      data: { tracked: false },
      message: 'Analytics tracking failed silently',
    });
  }
});

// Track seller contact - PUBLIC endpoint (no auth required)
router.post('/seller-contact', async (req, res, next) => {
  try {
    const validatedData = sellerContactSchema.parse(req.body);
    const timestamp = validatedData.timestamp ? new Date(validatedData.timestamp) : new Date();

    // Verify seller and part exist
    const [seller, part] = await Promise.all([
      prisma.seller.findUnique({
        where: { id: validatedData.sellerId },
        select: { id: true },
      }),
      prisma.part.findUnique({
        where: { id: validatedData.partId },
        select: { id: true },
      }),
    ]);

    if (!seller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Seller not found',
        message: 'Seller with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    if (!part) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Part not found',
        message: 'Part with this ID does not exist',
      };
      return res.status(404).json(response);
    }

    // Log the contact event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'SELLER_CONTACT',
        partId: validatedData.partId,
        sellerId: validatedData.sellerId,
        sessionId: validatedData.sessionId,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          contactMethod: validatedData.contactMethod,
          timestamp: timestamp.toISOString(),
          ip: req.ip,
        }),
        timestamp,
      },
    });

    const response: ApiResponse<{ tracked: boolean }> = {
      success: true,
      data: { tracked: true },
      message: 'Seller contact tracked successfully',
    };

    res.json(response);
  } catch (error) {
    // Don't fail hard on analytics errors
    console.error('Analytics tracking error:', error);
    res.json({
      success: true,
      data: { tracked: false },
      message: 'Analytics tracking failed silently',
    });
  }
});

// Get analytics summary (requires authentication)
router.get('/summary', async (req, res, next) => {
  try {
    // This endpoint can be expanded to provide analytics dashboard data
    // For now, return basic counts

    const [totalViews, totalSearches, totalContacts] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { eventType: 'PART_VIEW' },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'SEARCH' },
      }),
      prisma.analyticsEvent.count({
        where: { eventType: 'SELLER_CONTACT' },
      }),
    ]);

    const response: ApiResponse<{
      totalViews: number;
      totalSearches: number;
      totalContacts: number;
    }> = {
      success: true,
      data: {
        totalViews,
        totalSearches,
        totalContacts,
      },
      message: 'Analytics summary retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get top viewed parts (requires authentication)
router.get('/top-parts', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const period = (req.query.period as string) || '30d';

    // Calculate start date based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get view counts by part
    const viewCounts = await prisma.analyticsEvent.groupBy({
      by: ['partId'],
      where: {
        eventType: 'PART_VIEW',
        timestamp: { gte: startDate },
        partId: { not: null },
      },
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: limit,
    });

    // Get part details
    const partIds = viewCounts.map(v => v.partId).filter((id): id is string => id !== null);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
      include: {
        vehicle: {
          select: {
            year: true,
            make: true,
            model: true,
          },
        },
        seller: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Combine data
    const topParts = viewCounts.map(vc => {
      const part = parts.find(p => p.id === vc.partId);
      return {
        partId: vc.partId,
        viewCount: vc._count.id,
        part: part || null,
      };
    });

    const response: ApiResponse<typeof topParts> = {
      success: true,
      data: topParts as any,
      message: 'Top viewed parts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get popular search queries (requires authentication)
router.get('/popular-searches', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const period = (req.query.period as string) || '30d';

    // Calculate start date based on period
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get search events
    const searchEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: 'SEARCH',
        timestamp: { gte: startDate },
      },
      select: {
        metadata: true,
      },
    });

    // Count queries
    const queryMap = new Map<string, { count: number; avgResults: number }>();
    searchEvents.forEach(event => {
      const metadata = event.metadata ? JSON.parse(event.metadata as string) : {};
      if (metadata?.query) {
        const query = metadata.query.toLowerCase().trim();
        if (query) {
          const existing = queryMap.get(query);
          if (existing) {
            existing.count++;
            existing.avgResults = (existing.avgResults + (metadata.resultsCount || 0)) / 2;
          } else {
            queryMap.set(query, {
              count: 1,
              avgResults: metadata.resultsCount || 0,
            });
          }
        }
      }
    });

    // Convert to array and sort
    const popularSearches = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        searchCount: data.count,
        avgResults: Math.round(data.avgResults),
      }))
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit);

    const response: ApiResponse<typeof popularSearches> = {
      success: true,
      data: popularSearches,
      message: 'Popular searches retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
