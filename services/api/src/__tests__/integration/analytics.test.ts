import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Analytics API Integration Tests', () => {
  let sellerId: string;
  let partId: string;
  let vehicleId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.analyticsEvent.deleteMany();
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.analyticsEvent.deleteMany();
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create seller with verified user
    const sellerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'SellerPass123!',
        name: 'Test Seller',
        role: 'SELLER'
      });

    const sellerUserId = sellerResponse.body.data.user.id;
    await prisma.user.update({
      where: { id: sellerUserId },
      data: { isVerified: true }
    });

    const seller = await prisma.seller.create({
      data: {
        userId: sellerUserId,
        businessName: 'Test Auto Parts',
        businessType: 'SCRAP_YARD',
        street: '123 Auto St',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
        phone: '+27111111111',
        isVerified: true
      }
    });
    sellerId = seller.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: new Date('2024-01-01'),
        sellerId
      }
    });
    vehicleId = vehicle.id;

    const part = await prisma.part.create({
      data: {
        vehicleId,
        sellerId,
        name: 'Engine Block',
        description: 'Test part',
        condition: 'GOOD',
        price: 5000,
        currency: 'ZAR',
        status: 'AVAILABLE',
        location: 'A1',
        images: '[]',
        isListedOnMarketplace: true
      }
    });
    partId = part.id;
  });

  describe('POST /api/analytics/part-view', () => {
    it('should track part view successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/part-view')
        .send({
          partId,
          sessionId: 'test-session-123',
          userAgent: 'Mozilla/5.0'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(true);

      // Verify event was created
      const event = await prisma.analyticsEvent.findFirst({
        where: {
          eventType: 'PART_VIEW',
          partId
        }
      });
      expect(event).toBeDefined();
      expect(event!.sellerId).toBe(sellerId);
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .post('/api/analytics/part-view')
        .send({
          partId: 'non-existent-id',
          sessionId: 'test-session-123'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Part not found');
    });

    it('should handle custom timestamp', async () => {
      const customTimestamp = new Date('2024-01-15T10:00:00Z').toISOString();

      const response = await request(app)
        .post('/api/analytics/part-view')
        .send({
          partId,
          timestamp: customTimestamp,
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'PART_VIEW', partId }
      });
      expect(event!.timestamp.toISOString()).toBe(customTimestamp);
    });

    it('should fail silently on validation error', async () => {
      const response = await request(app)
        .post('/api/analytics/part-view')
        .send({
          // Missing partId
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(false);
    });

    it('should capture session ID and user agent', async () => {
      const response = await request(app)
        .post('/api/analytics/part-view')
        .send({
          partId,
          sessionId: 'unique-session-456',
          userAgent: 'Chrome/120.0.0.0'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.analyticsEvent.findFirst({
        where: { partId }
      });
      expect(event!.sessionId).toBe('unique-session-456');
      expect(event!.userAgent).toBe('Chrome/120.0.0.0');
    });
  });

  describe('POST /api/analytics/search', () => {
    it('should track search successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/search')
        .send({
          query: 'engine parts',
          filters: { make: 'Toyota', year: 2018 },
          resultsCount: 15,
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(true);

      // Verify event was created
      const event = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'SEARCH' }
      });
      expect(event).toBeDefined();

      const metadata = JSON.parse(event!.metadata as string);
      expect(metadata.query).toBe('engine parts');
      expect(metadata.resultsCount).toBe(15);
    });

    it('should handle custom timestamp', async () => {
      const customTimestamp = new Date('2024-01-15T10:00:00Z').toISOString();

      const response = await request(app)
        .post('/api/analytics/search')
        .send({
          query: 'brake pads',
          filters: {},
          resultsCount: 5,
          timestamp: customTimestamp,
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'SEARCH' }
      });
      expect(event!.timestamp.toISOString()).toBe(customTimestamp);
    });

    it('should store filters in metadata', async () => {
      const filters = {
        make: 'Honda',
        model: 'Civic',
        year: 2020,
        priceRange: { min: 1000, max: 5000 }
      };

      const response = await request(app)
        .post('/api/analytics/search')
        .send({
          query: 'transmission',
          filters,
          resultsCount: 8
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'SEARCH' }
      });
      const metadata = JSON.parse(event!.metadata as string);
      expect(metadata.filters).toEqual(filters);
    });

    it('should fail silently on validation error', async () => {
      const response = await request(app)
        .post('/api/analytics/search')
        .send({
          // Missing required fields
          filters: {}
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(false);
    });
  });

  describe('POST /api/analytics/seller-contact', () => {
    it('should track seller contact successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/seller-contact')
        .send({
          sellerId,
          partId,
          contactMethod: 'phone',
          sessionId: 'test-session-123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(true);

      // Verify event was created
      const event = await prisma.analyticsEvent.findFirst({
        where: {
          eventType: 'SELLER_CONTACT',
          sellerId,
          partId
        }
      });
      expect(event).toBeDefined();

      const metadata = JSON.parse(event!.metadata as string);
      expect(metadata.contactMethod).toBe('phone');
    });

    it('should return 404 for non-existent seller', async () => {
      const response = await request(app)
        .post('/api/analytics/seller-contact')
        .send({
          sellerId: 'non-existent-id',
          partId,
          contactMethod: 'email'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Seller not found');
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .post('/api/analytics/seller-contact')
        .send({
          sellerId,
          partId: 'non-existent-id',
          contactMethod: 'whatsapp'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Part not found');
    });

    it('should track different contact methods', async () => {
      const contactMethods = ['phone', 'whatsapp', 'email'] as const;

      for (const method of contactMethods) {
        await request(app)
          .post('/api/analytics/seller-contact')
          .send({
            sellerId,
            partId,
            contactMethod: method,
            sessionId: `session-${method}`
          })
          .expect(200);
      }

      const events = await prisma.analyticsEvent.findMany({
        where: { eventType: 'SELLER_CONTACT' }
      });

      expect(events).toHaveLength(3);
      const methods = events.map(e => {
        const metadata = JSON.parse(e.metadata as string);
        return metadata.contactMethod;
      });
      expect(methods.sort()).toEqual(['email', 'phone', 'whatsapp']);
    });

    it('should handle custom timestamp', async () => {
      const customTimestamp = new Date('2024-01-15T10:00:00Z').toISOString();

      const response = await request(app)
        .post('/api/analytics/seller-contact')
        .send({
          sellerId,
          partId,
          contactMethod: 'phone',
          timestamp: customTimestamp
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.analyticsEvent.findFirst({
        where: { eventType: 'SELLER_CONTACT' }
      });
      expect(event!.timestamp.toISOString()).toBe(customTimestamp);
    });

    it('should fail silently on validation error', async () => {
      const response = await request(app)
        .post('/api/analytics/seller-contact')
        .send({
          // Missing required fields
          contactMethod: 'phone'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracked).toBe(false);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should return analytics summary', async () => {
      // Create test analytics events
      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() },
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() },
          { eventType: 'SEARCH', metadata: '{"query":"test"}', timestamp: new Date() },
          { eventType: 'SELLER_CONTACT', partId, sellerId, metadata: '{"contactMethod":"phone"}', timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalViews).toBe(2);
      expect(response.body.data.totalSearches).toBe(1);
      expect(response.body.data.totalContacts).toBe(1);
    });

    it('should return zero counts when no events', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalViews).toBe(0);
      expect(response.body.data.totalSearches).toBe(0);
      expect(response.body.data.totalContacts).toBe(0);
    });
  });

  describe('GET /api/analytics/top-parts', () => {
    it('should return top viewed parts', async () => {
      // Create multiple view events
      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() },
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() },
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/top-parts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].partId).toBe(partId);
      expect(response.body.data[0].viewCount).toBe(3);
      expect(response.body.data[0].part).toBeDefined();
      expect(response.body.data[0].part.name).toBe('Engine Block');
    });

    it('should respect limit parameter', async () => {
      // Create multiple parts with views
      const part2 = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Transmission',
          description: 'Test part 2',
          condition: 'GOOD',
          price: 3000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A2',
          images: '[]',
          isListedOnMarketplace: true
        }
      });

      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: new Date() },
          { eventType: 'PART_VIEW', partId: part2.id, sellerId, timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/top-parts')
        .query({ limit: 1 })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should filter by time period', async () => {
      const oldDate = new Date('2023-01-01');
      const recentDate = new Date();

      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: oldDate },
          { eventType: 'PART_VIEW', partId, sellerId, timestamp: recentDate }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/top-parts')
        .query({ period: '7d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should only count recent view
      expect(response.body.data[0].viewCount).toBe(1);
    });

    it('should return empty array when no views', async () => {
      const response = await request(app)
        .get('/api/analytics/top-parts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/analytics/popular-searches', () => {
    it('should return popular search queries', async () => {
      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'engine parts', resultsCount: 5 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'engine parts', resultsCount: 5 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'brake pads', resultsCount: 3 }), timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/popular-searches')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].query).toBe('engine parts');
      expect(response.body.data[0].searchCount).toBe(2);
      expect(response.body.data[1].query).toBe('brake pads');
      expect(response.body.data[1].searchCount).toBe(1);
    });

    it('should normalize queries to lowercase', async () => {
      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'Engine Parts', resultsCount: 5 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'engine parts', resultsCount: 5 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'ENGINE PARTS', resultsCount: 5 }), timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/popular-searches')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].query).toBe('engine parts');
      expect(response.body.data[0].searchCount).toBe(3);
    });

    it('should respect limit parameter', async () => {
      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'query1', resultsCount: 1 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'query2', resultsCount: 2 }), timestamp: new Date() },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'query3', resultsCount: 3 }), timestamp: new Date() }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/popular-searches')
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by time period', async () => {
      const oldDate = new Date('2023-01-01');
      const recentDate = new Date();

      await prisma.analyticsEvent.createMany({
        data: [
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'old query', resultsCount: 1 }), timestamp: oldDate },
          { eventType: 'SEARCH', metadata: JSON.stringify({ query: 'recent query', resultsCount: 2 }), timestamp: recentDate }
        ]
      });

      const response = await request(app)
        .get('/api/analytics/popular-searches')
        .query({ period: '7d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].query).toBe('recent query');
    });

    it('should return empty array when no searches', async () => {
      const response = await request(app)
        .get('/api/analytics/popular-searches')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });
});
