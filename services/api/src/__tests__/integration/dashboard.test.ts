import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Dashboard API Integration Tests', () => {
  let sellerToken: string;
  let sellerId: string;
  let sellerUserId: string;
  let adminToken: string;
  let buyerToken: string;
  let vehicleId: string;
  let categoryId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany();
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.activityLog.deleteMany();
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();

    // Create admin
    const hashedPassword = await (await import('../../utils/auth')).hashPassword('AdminPass123!');
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'ADMIN',
        isVerified: true
      }
    });

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLoginResponse.body.data.accessToken;

    // Create seller
    const sellerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'SellerPass123!',
        name: 'Test Seller',
        role: 'SELLER'
      });
    sellerToken = sellerResponse.body.data.accessToken;
    sellerUserId = sellerResponse.body.data.user.id;

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

    // Create buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'buyer@test.com',
        password: 'BuyerPass123!',
        name: 'Test Buyer',
        role: 'BUYER'
      });
    buyerToken = buyerResponse.body.data.accessToken;

    // Create category
    const category = await prisma.category.create({
      data: {
        name: 'Engine Parts',
        description: 'Engine components',
        isActive: true
      }
    });
    categoryId = category.id;

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: new Date(),
        sellerId
      }
    });
    vehicleId = vehicle.id;
  });

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard stats for seller', async () => {
      // Create test data
      await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Test',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'A1',
          images: '[]',
          categoryId
        }
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalVehicles');
      expect(response.body.data).toHaveProperty('totalParts');
      expect(response.body.data).toHaveProperty('recentSales');
      expect(response.body.data).toHaveProperty('monthlyRevenue');
      expect(response.body.data).toHaveProperty('topSellingParts');
      expect(response.body.data).toHaveProperty('recentActivity');
    });

    it('should return 404 for seller without profile', async () => {
      // Create user without seller profile
      const noProfileResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noseller@test.com',
          password: 'NoSeller123!',
          name: 'No Seller Profile',
          role: 'SELLER'
        });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${noProfileResponse.body.data.accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Seller profile not found');
    });

    it('should count vehicles created in period', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ period: '30d' })
        .expect(200);

      expect(response.body.data.totalVehicles).toBe(1);
    });

    it('should calculate monthly revenue from sold parts', async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Part 1',
            description: 'Test',
            condition: 'GOOD',
            price: 3000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A1',
            images: '[]'
          },
          {
            vehicleId,
            sellerId,
            name: 'Part 2',
            description: 'Test',
            condition: 'GOOD',
            price: 2000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A2',
            images: '[]'
          }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.data.recentSales).toBe(2);
      expect(response.body.data.monthlyRevenue).toBe(5000);
    });

    it('should return top selling parts', async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Engine Block',
            description: 'Test',
            condition: 'GOOD',
            price: 5000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A1',
            images: '[]',
            categoryId
          },
          {
            vehicleId,
            sellerId,
            name: 'Engine Block',
            description: 'Test',
            condition: 'GOOD',
            price: 5000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A2',
            images: '[]',
            categoryId
          }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.data.topSellingParts).toHaveLength(1);
      expect(response.body.data.topSellingParts[0].salesCount).toBe(2);
    });

    it('should filter stats by time period', async () => {
      const oldDate = new Date('2023-01-01');
      await prisma.vehicle.create({
        data: {
          vin: '1HGCM82633A999999',
          year: 2019,
          make: 'Honda',
          model: 'Civic',
          condition: 'GOOD',
          acquisitionDate: oldDate,
          sellerId,
          createdAt: oldDate
        }
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ period: '7d' })
        .expect(200);

      // Should only count recent vehicle
      expect(response.body.data.totalVehicles).toBe(1);
    });

    it('should allow admin to see all stats', async () => {
      await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Test',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'A1',
          images: '[]'
        }
      });

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalVehicles');
    });

    it('should require seller or admin role', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/revenue', () => {
    it('should get revenue data for seller', async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Part 1',
            description: 'Test',
            condition: 'GOOD',
            price: 3000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A1',
            images: '[]'
          },
          {
            vehicleId,
            sellerId,
            name: 'Part 2',
            description: 'Test',
            condition: 'GOOD',
            price: 2000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A2',
            images: '[]'
          }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/revenue')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('date');
      expect(response.body.data[0]).toHaveProperty('revenue');
      expect(response.body.data[0]).toHaveProperty('sales');
    });

    it('should return 404 for seller without profile', async () => {
      const noProfileResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'norevenue@test.com',
          password: 'NoRevenue123!',
          name: 'No Profile',
          role: 'SELLER'
        });

      const response = await request(app)
        .get('/api/dashboard/revenue')
        .set('Authorization', `Bearer ${noProfileResponse.body.data.accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should group revenue by date', async () => {
      const today = new Date();
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Part 1',
            description: 'Test',
            condition: 'GOOD',
            price: 1000,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A1',
            images: '[]',
            updatedAt: today
          },
          {
            vehicleId,
            sellerId,
            name: 'Part 2',
            description: 'Test',
            condition: 'GOOD',
            price: 1500,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A2',
            images: '[]',
            updatedAt: today
          }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/revenue')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const todayDate = today.toISOString().split('T')[0];
      const todayData = response.body.data.find((d: any) => d.date === todayDate);
      expect(todayData.revenue).toBe(2500);
      expect(todayData.sales).toBe(2);
    });

    it('should filter by time period', async () => {
      const oldDate = new Date('2023-01-01');
      await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Old Part',
          description: 'Test',
          condition: 'GOOD',
          price: 999,
          currency: 'ZAR',
          status: 'SOLD',
          location: 'A1',
          images: '[]',
          updatedAt: oldDate
        }
      });

      const response = await request(app)
        .get('/api/dashboard/revenue')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ period: '7d' })
        .expect(200);

      // Should not include old sale
      const hasOldSale = response.body.data.some((d: any) => d.revenue === 999);
      expect(hasOldSale).toBe(false);
    });

    it('should require seller or admin role', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/dashboard/inventory', () => {
    it('should get inventory data grouped by category', async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Engine Block',
            description: 'Test',
            condition: 'GOOD',
            price: 5000,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A1',
            images: '[]',
            categoryId
          },
          {
            vehicleId,
            sellerId,
            name: 'Piston',
            description: 'Test',
            condition: 'GOOD',
            price: 500,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A2',
            images: '[]',
            categoryId
          }
        ]
      });

      const response = await request(app)
        .get('/api/dashboard/inventory')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('count');
      expect(response.body.data[0].category).toBe('Engine Parts');
      expect(response.body.data[0].count).toBe(2);
    });

    it('should return 404 for seller without profile', async () => {
      const noProfileResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noinventory@test.com',
          password: 'NoInventory123!',
          name: 'No Profile',
          role: 'SELLER'
        });

      const response = await request(app)
        .get('/api/dashboard/inventory')
        .set('Authorization', `Bearer ${noProfileResponse.body.data.accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle uncategorized parts', async () => {
      await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'No Category Part',
          description: 'Test',
          condition: 'GOOD',
          price: 1000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });

      const response = await request(app)
        .get('/api/dashboard/inventory')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const uncategorized = response.body.data.find((d: any) => d.category === 'Uncategorized');
      expect(uncategorized).toBeDefined();
      expect(uncategorized.count).toBe(1);
    });

    it('should allow admin to see all inventory', async () => {
      await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Test Part',
          description: 'Test',
          condition: 'GOOD',
          price: 1000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]',
          categoryId
        }
      });

      const response = await request(app)
        .get('/api/dashboard/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should require seller or admin role', async () => {
      const response = await request(app)
        .get('/api/dashboard/inventory')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/dashboard/inventory')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
