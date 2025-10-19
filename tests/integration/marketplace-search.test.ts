import request from 'supertest';
import { Express } from 'express';
import { prisma } from '@partpal/database';
import { createTestApp } from '../fixtures/testApp';
import { createTestUser, createTestVehicle, createTestPart } from '../fixtures/testData';

describe('Marketplace Search Integration', () => {
  let app: Express;
  let testUsers: any[];
  let testVehicles: any[];
  let testParts: any[];

  beforeAll(async () => {
    app = createTestApp();

    // Create test data
    testUsers = await Promise.all([
      createTestUser({
        email: 'seller1@partpal.test',
        name: 'AutoParts Johannesburg',
        role: 'seller',
        isVerified: true,
      }),
      createTestUser({
        email: 'seller2@partpal.test',
        name: 'Cape Town Parts',
        role: 'seller',
        isVerified: true,
      }),
      createTestUser({
        email: 'buyer@partpal.test',
        name: 'Local Mechanic',
        role: 'buyer',
        isVerified: true,
      }),
    ]);

    // Create test vehicles
    testVehicles = await Promise.all([
      createTestVehicle({
        sellerId: testUsers[0].id,
        make: 'Toyota',
        model: 'Camry',
        year: 2015,
        vin: 'TOYOTA2015CAMRY001',
      }),
      createTestVehicle({
        sellerId: testUsers[1].id,
        make: 'BMW',
        model: 'X3',
        year: 2018,
        vin: 'BMW2018X3001',
      }),
      createTestVehicle({
        sellerId: testUsers[0].id,
        make: 'Ford',
        model: 'Focus',
        year: 2019,
        vin: 'FORD2019FOCUS001',
      }),
    ]);

    // Create test parts
    testParts = await Promise.all([
      createTestPart({
        sellerId: testUsers[0].id,
        vehicleId: testVehicles[0].id,
        name: 'Engine Block',
        partNumber: 'TOY-ENG-001',
        condition: 'excellent',
        price: 15000,
        isListedOnMarketplace: true,
      }),
      createTestPart({
        sellerId: testUsers[0].id,
        vehicleId: testVehicles[0].id,
        name: 'Brake Pads',
        partNumber: 'TOY-BRK-001',
        condition: 'good',
        price: 450,
        isListedOnMarketplace: true,
      }),
      createTestPart({
        sellerId: testUsers[1].id,
        vehicleId: testVehicles[1].id,
        name: 'Headlight Assembly',
        partNumber: 'BMW-HDL-001',
        condition: 'excellent',
        price: 3200,
        isListedOnMarketplace: true,
      }),
      createTestPart({
        sellerId: testUsers[0].id,
        vehicleId: testVehicles[2].id,
        name: 'Door Handle',
        partNumber: 'FORD-DHD-001',
        condition: 'fair',
        price: 180,
        isListedOnMarketplace: false, // Not listed
      }),
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.part.deleteMany({
      where: { id: { in: testParts.map(p => p.id) } },
    });
    await prisma.vehicle.deleteMany({
      where: { id: { in: testVehicles.map(v => v.id) } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: testUsers.map(u => u.id) } },
    });
  });

  describe('Part Search by Name', () => {
    it('should find parts by partial name match', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'engine' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.parts[0].name).toBe('Engine Block');
      expect(response.body.data.parts[0].isListedOnMarketplace).toBe(true);
    });

    it('should find parts by exact part number', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ partNumber: 'TOY-BRK-001' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.parts[0].partNumber).toBe('TOY-BRK-001');
      expect(response.body.data.parts[0].name).toBe('Brake Pads');
    });

    it('should return case-insensitive search results', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'BRAKE' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.parts[0].name).toBe('Brake Pads');
    });

    it('should only return parts listed on marketplace', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'door' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(0); // Door Handle is not listed
    });
  });

  describe('Vehicle-based Search', () => {
    it('should find parts by vehicle make', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ make: 'Toyota' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2); // Engine Block and Brake Pads

      const partNames = response.body.data.parts.map((p: any) => p.name);
      expect(partNames).toContain('Engine Block');
      expect(partNames).toContain('Brake Pads');
    });

    it('should find parts by vehicle make and model', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ make: 'BMW', model: 'X3' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.parts[0].name).toBe('Headlight Assembly');
      expect(response.body.data.parts[0].vehicle.make).toBe('BMW');
      expect(response.body.data.parts[0].vehicle.model).toBe('X3');
    });

    it('should find parts by vehicle make, model, and year', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ make: 'Toyota', model: 'Camry', year: 2015 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2);

      response.body.data.parts.forEach((part: any) => {
        expect(part.vehicle.make).toBe('Toyota');
        expect(part.vehicle.model).toBe('Camry');
        expect(part.vehicle.year).toBe(2015);
      });
    });

    it('should return empty results for non-matching vehicle criteria', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ make: 'Honda', model: 'Civic' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(0);
    });
  });

  describe('Price Filtering', () => {
    it('should filter parts by minimum price', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ minPrice: 1000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2); // Engine Block and Headlight

      response.body.data.parts.forEach((part: any) => {
        expect(part.price).toBeGreaterThanOrEqual(1000);
      });
    });

    it('should filter parts by maximum price', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ maxPrice: 500 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1); // Only Brake Pads
      expect(response.body.data.parts[0].name).toBe('Brake Pads');
      expect(response.body.data.parts[0].price).toBeLessThanOrEqual(500);
    });

    it('should filter parts by price range', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ minPrice: 400, maxPrice: 4000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2); // Brake Pads and Headlight

      response.body.data.parts.forEach((part: any) => {
        expect(part.price).toBeGreaterThanOrEqual(400);
        expect(part.price).toBeLessThanOrEqual(4000);
      });
    });
  });

  describe('Condition Filtering', () => {
    it('should filter parts by condition', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ condition: 'excellent' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2); // Engine Block and Headlight

      response.body.data.parts.forEach((part: any) => {
        expect(part.condition).toBe('excellent');
      });
    });

    it('should support multiple condition filters', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ condition: ['excellent', 'good'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(3); // All listed parts except fair condition

      response.body.data.parts.forEach((part: any) => {
        expect(['excellent', 'good']).toContain(part.condition);
      });
    });
  });

  describe('Pagination', () => {
    it('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.totalItems).toBe(3);
    });

    it('should return correct second page', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(2);
    });

    it('should handle out-of-range page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ page: 999, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(0);
      expect(response.body.data.pagination.currentPage).toBe(999);
    });
  });

  describe('Sorting', () => {
    it('should sort parts by price ascending', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ sortBy: 'price', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(3);

      const prices = response.body.data.parts.map((p: any) => p.price);
      expect(prices).toEqual([450, 3200, 15000]); // Brake Pads, Headlight, Engine Block
    });

    it('should sort parts by price descending', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ sortBy: 'price', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(3);

      const prices = response.body.data.parts.map((p: any) => p.price);
      expect(prices).toEqual([15000, 3200, 450]); // Engine Block, Headlight, Brake Pads
    });

    it('should sort parts by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(3);

      const dates = response.body.data.parts.map((p: any) => new Date(p.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('Complex Search Combinations', () => {
    it('should handle complex multi-criteria search', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({
          make: 'Toyota',
          q: 'brake',
          minPrice: 400,
          maxPrice: 500,
          condition: 'good',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(1);
      expect(response.body.data.parts[0].name).toBe('Brake Pads');
      expect(response.body.data.parts[0].vehicle.make).toBe('Toyota');
      expect(response.body.data.parts[0].condition).toBe('good');
      expect(response.body.data.parts[0].price).toBe(450);
    });

    it('should return no results when criteria do not match', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({
          make: 'Toyota',
          q: 'headlight', // Toyota doesn't have headlight in test data
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts).toHaveLength(0);
    });
  });

  describe('Search Performance and Analytics', () => {
    it('should track search analytics', async () => {
      const searchQuery = 'performance test';

      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: searchQuery })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify analytics tracking (would need to mock analytics service)
      // expect(mockAnalytics.trackPartSearch).toHaveBeenCalledWith(
      //   searchQuery,
      //   expect.any(Object),
      //   expect.any(Number)
      // );
    });

    it('should include seller information in results', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'engine' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts[0].seller).toBeDefined();
      expect(response.body.data.parts[0].seller.name).toBe('AutoParts Johannesburg');
      expect(response.body.data.parts[0].seller.isVerified).toBe(true);

      // Should not expose sensitive seller information
      expect(response.body.data.parts[0].seller).not.toHaveProperty('email');
      expect(response.body.data.parts[0].seller).not.toHaveProperty('phone');
    });

    it('should include vehicle information in results', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'brake' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.parts[0].vehicle).toBeDefined();
      expect(response.body.data.parts[0].vehicle.make).toBe('Toyota');
      expect(response.body.data.parts[0].vehicle.model).toBe('Camry');
      expect(response.body.data.parts[0].vehicle.year).toBe(2015);

      // Should not expose sensitive vehicle information
      expect(response.body.data.parts[0].vehicle).not.toHaveProperty('vin');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ minPrice: 'invalid', year: 'not-a-number' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid query parameters');
    });

    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(prisma.part, 'findMany').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/marketplace/search')
        .query({ q: 'test' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search service temporarily unavailable');

      // Restore mock
      (prisma.part.findMany as jest.Mock).mockRestore();
    });

    it('should validate required parameters', async () => {
      const response = await request(app)
        .get('/api/marketplace/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('At least one search parameter is required');
    });
  });
});