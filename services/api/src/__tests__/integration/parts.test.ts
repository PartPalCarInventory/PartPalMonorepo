import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Parts API Integration Tests', () => {
  let sellerToken: string;
  let sellerId: string;
  let sellerUserId: string;
  let vehicleId: string;
  let otherSellerToken: string;
  let otherSellerId: string;
  let otherVehicleId: string;
  let adminToken: string;
  let buyerToken: string;
  let categoryId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.category.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();

    // Create verified seller 1
    const seller1Response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seller1@test.com',
        password: 'Seller1Pass123!',
        name: 'Test Seller 1',
        role: 'SELLER'
      });
    sellerToken = seller1Response.body.data.accessToken;
    sellerUserId = seller1Response.body.data.user.id;

    await prisma.user.update({
      where: { id: sellerUserId },
      data: { isVerified: true }
    });

    const seller1 = await prisma.seller.create({
      data: {
        userId: sellerUserId,
        businessName: 'Test Auto Parts 1',
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
    sellerId = seller1.id;

    const vehicle1 = await prisma.vehicle.create({
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
    vehicleId = vehicle1.id;

    // Create verified seller 2
    const seller2Response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seller2@test.com',
        password: 'Seller2Pass123!',
        name: 'Test Seller 2',
        role: 'SELLER'
      });
    otherSellerToken = seller2Response.body.data.accessToken;
    const otherSellerUserId = seller2Response.body.data.user.id;

    await prisma.user.update({
      where: { id: otherSellerUserId },
      data: { isVerified: true }
    });

    const seller2 = await prisma.seller.create({
      data: {
        userId: otherSellerUserId,
        businessName: 'Test Auto Parts 2',
        businessType: 'DISMANTLER',
        street: '456 Parts Ave',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8000',
        country: 'South Africa',
        phone: '+27222222222',
        isVerified: true
      }
    });
    otherSellerId = seller2.id;

    const vehicle2 = await prisma.vehicle.create({
      data: {
        vin: '1HGCM82633A999999',
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        condition: 'EXCELLENT',
        acquisitionDate: new Date('2024-01-02'),
        sellerId: otherSellerId
      }
    });
    otherVehicleId = vehicle2.id;

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
  });

  describe('POST /api/parts', () => {
    it('should create a new part successfully', async () => {
      const partData = {
        vehicleId,
        name: 'Engine Block',
        partNumber: 'ENG-123',
        description: 'Complete engine block assembly',
        condition: 'GOOD',
        price: 5000,
        currency: 'ZAR',
        location: 'A1',
        categoryId
      };

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(partData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Engine Block');
      expect(response.body.data.price).toBe(5000);
      expect(response.body.data.vehicle).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          vehicleId,
          name: '',
          description: '',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate positive price', async () => {
      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: -100,
          location: 'A1'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject part for vehicle not owned by seller', async () => {
      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          vehicleId: otherVehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vehicle not found');
    });

    it('should reject inactive category', async () => {
      const inactiveCategory = await prisma.category.create({
        data: {
          name: 'Inactive Category',
          description: 'Test',
          isActive: false
        }
      });

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1',
          categoryId: inactiveCategory.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid category');
    });

    it('should require verified user', async () => {
      const unverifiedResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unverified@test.com',
          password: 'UnverifiedPass123!',
          name: 'Unverified Seller',
          role: 'SELLER'
        });

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${unverifiedResponse.body.data.accessToken}`)
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require seller profile', async () => {
      const noProfileResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noprofile@test.com',
          password: 'NoProfilePass123!',
          name: 'No Profile Seller',
          role: 'SELLER'
        });

      await prisma.user.update({
        where: { id: noProfileResponse.body.data.user.id },
        data: { isVerified: true }
      });

      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${noProfileResponse.body.data.accessToken}`)
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Seller profile not found');
    });

    it('should reject buyer access', async () => {
      const response = await request(app)
        .post('/api/parts')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/parts')
        .send({
          vehicleId,
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          location: 'A1'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/parts', () => {
    beforeEach(async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Engine Block',
            description: 'Complete engine block',
            condition: 'GOOD',
            price: 5000,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A1',
            images: '[]',
            isListedOnMarketplace: true
          },
          {
            vehicleId,
            sellerId,
            name: 'Transmission',
            description: 'Manual transmission',
            condition: 'EXCELLENT',
            price: 3000,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A2',
            images: '[]',
            isListedOnMarketplace: false
          },
          {
            vehicleId,
            sellerId,
            name: 'Alternator',
            description: 'Alternator unit',
            condition: 'FAIR',
            price: 500,
            currency: 'ZAR',
            status: 'SOLD',
            location: 'A3',
            images: '[]',
            isListedOnMarketplace: false
          }
        ]
      });

      await prisma.part.create({
        data: {
          vehicleId: otherVehicleId,
          sellerId: otherSellerId,
          name: 'Brake Pads',
          description: 'Front brake pads',
          condition: 'NEW',
          price: 200,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'B1',
          images: '[]',
          isListedOnMarketplace: true
        }
      });
    });

    it('should list parts for authenticated seller', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.totalCount).toBe(3);
    });

    it('should only show seller their own parts', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].sellerId).toBe(otherSellerId);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page: 1, pageSize: 2 })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should filter by vehicle', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ vehicleId })
        .expect(200);

      expect(response.body.data.items.every((p: any) => p.vehicleId === vehicleId)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ status: 'AVAILABLE' })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every((p: any) => p.status === 'AVAILABLE')).toBe(true);
    });

    it('should filter by condition', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ condition: 'GOOD' })
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].condition).toBe('GOOD');
    });

    it('should filter by marketplace listing', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ isListedOnMarketplace: 'true' })
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].isListedOnMarketplace).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ priceMin: 1000, priceMax: 6000 })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every((p: any) => p.price >= 1000 && p.price <= 6000)).toBe(true);
    });

    it('should sort by price ascending', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ sortBy: 'price_asc' })
        .expect(200);

      const prices = response.body.data.items.map((p: any) => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
      }
    });

    it('should sort by price descending', async () => {
      const response = await request(app)
        .get('/api/parts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ sortBy: 'price_desc' })
        .expect(200);

      const prices = response.body.data.items.map((p: any) => p.price);
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/parts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/parts/:id', () => {
    let partId: string;
    let otherPartId: string;
    let marketplacePart: string;

    beforeEach(async () => {
      const part1 = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Complete engine block',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]',
          isListedOnMarketplace: false
        }
      });
      partId = part1.id;

      const part2 = await prisma.part.create({
        data: {
          vehicleId: otherVehicleId,
          sellerId: otherSellerId,
          name: 'Brake Pads',
          description: 'Front brake pads',
          condition: 'NEW',
          price: 200,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'B1',
          images: '[]',
          isListedOnMarketplace: false
        }
      });
      otherPartId = part2.id;

      const part3 = await prisma.part.create({
        data: {
          vehicleId: otherVehicleId,
          sellerId: otherSellerId,
          name: 'Oil Filter',
          description: 'Engine oil filter',
          condition: 'NEW',
          price: 50,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'B2',
          images: '[]',
          isListedOnMarketplace: true
        }
      });
      marketplacePart = part3.id;
    });

    it('should get part by ID', async () => {
      const response = await request(app)
        .get(`/api/parts/${partId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(partId);
      expect(response.body.data.name).toBe('Engine Block');
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .get('/api/parts/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Part not found');
    });

    it('should prevent seller from viewing other seller non-marketplace parts', async () => {
      const response = await request(app)
        .get(`/api/parts/${otherPartId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow viewing marketplace parts from other sellers', async () => {
      const response = await request(app)
        .get(`/api/parts/${marketplacePart}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isListedOnMarketplace).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/parts/${partId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/parts/:id', () => {
    let partId: string;

    beforeEach(async () => {
      const part = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Complete engine block',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });
      partId = part.id;
    });

    it('should update part successfully', async () => {
      const updateData = {
        name: 'Updated Engine Block',
        price: 5500,
        condition: 'EXCELLENT'
      };

      const response = await request(app)
        .put(`/api/parts/${partId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Engine Block');
      expect(response.body.data.price).toBe(5500);
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .put('/api/parts/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Updated Part' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update any part', async () => {
      const response = await request(app)
        .put(`/api/parts/${partId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated Part' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/parts/${partId}`)
        .send({ name: 'Updated Part' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/parts/:id/marketplace', () => {
    let partId: string;

    beforeEach(async () => {
      const part = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Complete engine block',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]',
          isListedOnMarketplace: false
        }
      });
      partId = part.id;
    });

    it('should list part on marketplace', async () => {
      const response = await request(app)
        .patch(`/api/parts/${partId}/marketplace`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ isListedOnMarketplace: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isListedOnMarketplace).toBe(true);
    });

    it('should remove part from marketplace', async () => {
      await prisma.part.update({
        where: { id: partId },
        data: { isListedOnMarketplace: true }
      });

      const response = await request(app)
        .patch(`/api/parts/${partId}/marketplace`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ isListedOnMarketplace: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isListedOnMarketplace).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/parts/${partId}/marketplace`)
        .send({ isListedOnMarketplace: true })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/parts/:id/status', () => {
    let partId: string;

    beforeEach(async () => {
      const part = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Complete engine block',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });
      partId = part.id;
    });

    it('should update part status to RESERVED', async () => {
      const response = await request(app)
        .patch(`/api/parts/${partId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'RESERVED' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('RESERVED');
    });

    it('should update part status to SOLD', async () => {
      const response = await request(app)
        .patch(`/api/parts/${partId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'SOLD' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('SOLD');
    });

    it('should increment seller totalSales when part sold', async () => {
      const sellerBefore = await prisma.seller.findUnique({
        where: { id: sellerId },
        select: { totalSales: true }
      });

      await request(app)
        .patch(`/api/parts/${partId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'SOLD' })
        .expect(200);

      const sellerAfter = await prisma.seller.findUnique({
        where: { id: sellerId },
        select: { totalSales: true }
      });

      expect(sellerAfter!.totalSales).toBe(sellerBefore!.totalSales + 1);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/parts/${partId}/status`)
        .send({ status: 'SOLD' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/parts/:id', () => {
    let partId: string;

    beforeEach(async () => {
      const part = await prisma.part.create({
        data: {
          vehicleId,
          sellerId,
          name: 'Engine Block',
          description: 'Complete engine block',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });
      partId = part.id;
    });

    it('should delete part successfully', async () => {
      const response = await request(app)
        .delete(`/api/parts/${partId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedPart = await prisma.part.findUnique({ where: { id: partId } });
      expect(deletedPart).toBeNull();
    });

    it('should return 404 for non-existent part', async () => {
      const response = await request(app)
        .delete('/api/parts/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete any part', async () => {
      const response = await request(app)
        .delete(`/api/parts/${partId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/parts/${partId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    let part1Id: string;
    let part2Id: string;
    let part3Id: string;

    beforeEach(async () => {
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Part 1',
            description: 'Description 1',
            condition: 'GOOD',
            price: 100,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A1',
            images: '[]'
          },
          {
            vehicleId,
            sellerId,
            name: 'Part 2',
            description: 'Description 2',
            condition: 'GOOD',
            price: 200,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A2',
            images: '[]'
          },
          {
            vehicleId,
            sellerId,
            name: 'Part 3',
            description: 'Description 3',
            condition: 'GOOD',
            price: 300,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A3',
            images: '[]'
          }
        ]
      });

      const createdParts = await prisma.part.findMany({
        where: { sellerId },
        orderBy: { price: 'asc' }
      });
      part1Id = createdParts[0].id;
      part2Id = createdParts[1].id;
      part3Id = createdParts[2].id;
    });

    it('should update multiple parts status', async () => {
      const response = await request(app)
        .post('/api/parts/bulk/update-status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          partIds: [part1Id, part2Id],
          status: 'SOLD'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
    });

    it('should reject empty partIds array', async () => {
      const response = await request(app)
        .post('/api/parts/bulk/update-status')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          partIds: [],
          status: 'SOLD'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should list multiple parts on marketplace', async () => {
      const response = await request(app)
        .post('/api/parts/bulk/toggle-marketplace')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          partIds: [part1Id, part2Id, part3Id],
          isListedOnMarketplace: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(3);
    });

    it('should delete multiple parts', async () => {
      const response = await request(app)
        .post('/api/parts/bulk/delete')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          partIds: [part1Id, part2Id]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(2);
    });
  });
});
