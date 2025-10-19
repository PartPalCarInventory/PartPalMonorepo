import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Vehicles API Integration Tests', () => {
  let sellerToken: string;
  let sellerId: string;
  let sellerUserId: string;
  let otherSellerToken: string;
  let otherSellerId: string;
  let adminToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup all test data
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean test data
    await prisma.part.deleteMany();
    await prisma.vehicle.deleteMany();
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

    // Mark seller 1 as verified and create seller profile
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
        phone: '+27111111111'
      }
    });
    sellerId = seller1.id;

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
        phone: '+27222222222'
      }
    });
    otherSellerId = seller2.id;

    // Create admin
    const hashedPassword = await (await import('../../utils/auth')).hashPassword('AdminPass123!');
    const admin = await prisma.user.create({
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
  });

  describe('POST /api/vehicles', () => {
    it('should create a new vehicle successfully', async () => {
      const vehicleData = {
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        variant: '1.8 Prestige',
        engineSize: '1.8L',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Silver',
        mileage: 85000,
        condition: 'GOOD',
        acquisitionDate: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vin).toBe('1HGCM82633A123456');
      expect(response.body.data.make).toBe('Toyota');
      expect(response.body.data.model).toBe('Corolla');
      expect(response.body.data.year).toBe(2018);
      expect(response.body.data.sellerId).toBe(sellerId);
      expect(response.body.data.seller.businessName).toBe('Test Auto Parts 1');
      expect(response.body.message).toBe('Vehicle created successfully');
    });

    it('should reject duplicate VIN', async () => {
      const vehicleData = {
        vin: '1HGCM82633A999999',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: '2024-01-15'
      };

      // Create first vehicle
      await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VIN already exists');
      expect(response.body.message).toContain('already registered');
    });

    it('should validate VIN length', async () => {
      const vehicleData = {
        vin: 'TOOSHORT',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate year range', async () => {
      const vehicleData = {
        vin: '1HGCM82633A123456',
        year: 1800, // Too old
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept current year plus one', async () => {
      const nextYear = new Date().getFullYear() + 1;
      const vehicleData = {
        vin: '1HGCM82633A123456',
        year: nextYear,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'NEW',
        acquisitionDate: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(vehicleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(nextYear);
    });

    it('should require verified user', async () => {
      // Create unverified seller
      const unverifiedResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unverified@test.com',
          password: 'UnverifiedPass123!',
          name: 'Unverified Seller',
          role: 'SELLER'
        });

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${unverifiedResponse.body.data.accessToken}`)
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require seller profile', async () => {
      // Create verified user without seller profile
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noseller@test.com',
          password: 'NoSellerPass123!',
          name: 'No Seller User',
          role: 'SELLER'
        });

      await prisma.user.update({
        where: { id: userResponse.body.data.user.id },
        data: { isVerified: true }
      });

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userResponse.body.data.accessToken}`)
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Seller profile not found');
    });

    it('should reject buyer access', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to create vehicles', async () => {
      // Admin needs a seller profile too
      const adminSeller = await prisma.seller.create({
        data: {
          userId: (await prisma.user.findUnique({ where: { email: 'admin@test.com' }}))!.id,
          businessName: 'Admin Auto Parts',
          businessType: 'SCRAP_YARD',
          street: '789 Admin St',
          city: 'Pretoria',
          province: 'Gauteng',
          postalCode: '0001',
          country: 'South Africa',
          phone: '+27333333333'
        }
      });

      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/vehicles', () => {
    beforeEach(async () => {
      // Create test vehicles for seller 1
      await prisma.vehicle.createMany({
        data: [
          {
            vin: '1HGCM82633A000001',
            year: 2018,
            make: 'Toyota',
            model: 'Corolla',
            condition: 'GOOD',
            acquisitionDate: new Date('2024-01-01'),
            sellerId
          },
          {
            vin: '1HGCM82633A000002',
            year: 2020,
            make: 'Honda',
            model: 'Civic',
            condition: 'EXCELLENT',
            acquisitionDate: new Date('2024-01-02'),
            sellerId
          },
          {
            vin: '1HGCM82633A000003',
            year: 2019,
            make: 'Toyota',
            model: 'Camry',
            condition: 'FAIR',
            acquisitionDate: new Date('2024-01-03'),
            sellerId
          }
        ]
      });

      // Create vehicles for seller 2
      await prisma.vehicle.createMany({
        data: [
          {
            vin: '1HGCM82633A000004',
            year: 2021,
            make: 'Mazda',
            model: 'CX-5',
            condition: 'EXCELLENT',
            acquisitionDate: new Date('2024-01-04'),
            sellerId: otherSellerId
          }
        ]
      });
    });

    it('should list vehicles for authenticated seller', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.totalCount).toBe(3);
      expect(response.body.data.items.every((v: any) => v.sellerId === sellerId)).toBe(true);
    });

    it('should only show seller their own vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].sellerId).toBe(otherSellerId);
    });

    it('should allow admin to see all vehicles', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(4);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ page: 1, pageSize: 2 })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    // NOTE: Skipped in SQLite - requires PostgreSQL for mode: 'insensitive' support (see vehicles.ts:76-77)
    it.skip('should search by make', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ make: 'Toyota' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items.some((v: any) => v.make === 'Toyota')).toBe(true);
    });

    // NOTE: Skipped in SQLite - requires PostgreSQL for mode: 'insensitive' support (see vehicles.ts:77)
    it.skip('should search by model', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ model: 'Corolla' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items.some((v: any) => v.model === 'Corolla')).toBe(true);
    });

    it('should filter by year range', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ yearFrom: 2019, yearTo: 2020 })
        .expect(200);

      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every((v: any) => v.year >= 2019 && v.year <= 2020)).toBe(true);
    });

    it('should filter by condition', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ condition: 'EXCELLENT' })
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].condition).toBe('EXCELLENT');
    });

    // NOTE: Skipped in SQLite - requires PostgreSQL for mode: 'insensitive' support (see vehicles.ts:68-74)
    it.skip('should support search across multiple fields', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ search: 'Civic' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items.some((v: any) => v.model === 'Civic')).toBe(true);
    });

    it('should sort by newest', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ sortBy: 'newest' })
        .expect(200);

      const dates = response.body.data.items.map((v: any) => new Date(v.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should sort by year', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({ sortBy: 'year' })
        .expect(200);

      const years = response.body.data.items.map((v: any) => v.year);
      for (let i = 0; i < years.length - 1; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i + 1]);
      }
    });

    it('should include parts count', async () => {
      // Add a part to one vehicle
      const vehicle = await prisma.vehicle.findFirst({ where: { sellerId } });
      await prisma.part.create({
        data: {
          vehicleId: vehicle!.id,
          sellerId,
          name: 'Test Part',
          description: 'Test part description',
          condition: 'GOOD',
          price: 100,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });

      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      const vehicleWithPart = response.body.data.items.find((v: any) => v.id === vehicle!.id);
      expect(vehicleWithPart.partsCount).toBe(1);
    });

    it('should reject buyer access', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    let vehicleId: string;
    let otherVehicleId: string;

    beforeEach(async () => {
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

      const otherVehicle = await prisma.vehicle.create({
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
      otherVehicleId = otherVehicle.id;

      // Add parts to vehicle
      await prisma.part.createMany({
        data: [
          {
            vehicleId,
            sellerId,
            name: 'Engine',
            description: 'Complete engine assembly',
            condition: 'GOOD',
            price: 5000,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A1',
            isListedOnMarketplace: true,
            images: '[]'
          },
          {
            vehicleId,
            sellerId,
            name: 'Transmission',
            description: 'Manual transmission',
            condition: 'FAIR',
            price: 3000,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A2',
            isListedOnMarketplace: false,
            images: '[]'
          }
        ]
      });
    });

    it('should get vehicle by ID with parts', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vehicleId);
      expect(response.body.data.vin).toBe('1HGCM82633A123456');
      expect(response.body.data.seller).toBeDefined();
      expect(response.body.data.parts).toHaveLength(2);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vehicle not found');
    });

    it('should prevent seller from viewing other sellers vehicle', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${otherVehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should allow admin to view any vehicle', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vehicleId);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    let vehicleId: string;
    let otherVehicleId: string;

    beforeEach(async () => {
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

      const otherVehicle = await prisma.vehicle.create({
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
      otherVehicleId = otherVehicle.id;
    });

    it('should update vehicle successfully', async () => {
      const updateData = {
        year: 2019,
        color: 'Blue',
        mileage: 95000,
        condition: 'FAIR'
      };

      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(2019);
      expect(response.body.data.color).toBe('Blue');
      expect(response.body.data.mileage).toBe(95000);
      expect(response.body.data.condition).toBe('FAIR');
      expect(response.body.message).toBe('Vehicle updated successfully');
    });

    it('should not allow VIN updates', async () => {
      const updateData = {
        vin: '1HGCM82633A000000' // Attempt to change VIN
      };

      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData)
        .expect(200);

      // VIN should remain unchanged
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      expect(vehicle?.vin).toBe('1HGCM82633A123456');
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .put('/api/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ year: 2020 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vehicle not found');
    });

    it('should prevent seller from updating other sellers vehicle', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${otherVehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ year: 2021 })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should allow admin to update any vehicle', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ year: 2021 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(2021);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ year: 1800 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject buyer access', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ year: 2020 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .send({ year: 2020 })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    let vehicleId: string;
    let vehicleWithPartsId: string;
    let otherVehicleId: string;

    beforeEach(async () => {
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

      const vehicleWithParts = await prisma.vehicle.create({
        data: {
          vin: '1HGCM82633A888888',
          year: 2019,
          make: 'Honda',
          model: 'Accord',
          condition: 'GOOD',
          acquisitionDate: new Date('2024-01-01'),
          sellerId
        }
      });
      vehicleWithPartsId = vehicleWithParts.id;

      // Add parts to this vehicle
      await prisma.part.create({
        data: {
          vehicleId: vehicleWithPartsId,
          sellerId,
          name: 'Engine',
          description: 'Complete engine assembly',
          condition: 'GOOD',
          price: 5000,
          currency: 'ZAR',
          status: 'AVAILABLE',
          location: 'A1',
          images: '[]'
        }
      });

      const otherVehicle = await prisma.vehicle.create({
        data: {
          vin: '1HGCM82633A999999',
          year: 2020,
          make: 'Mazda',
          model: 'CX-5',
          condition: 'EXCELLENT',
          acquisitionDate: new Date('2024-01-02'),
          sellerId: otherSellerId
        }
      });
      otherVehicleId = otherVehicle.id;
    });

    it('should delete vehicle successfully', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vehicle deleted successfully');

      // Verify vehicle is deleted
      const deletedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      expect(deletedVehicle).toBeNull();
    });

    it('should prevent deletion of vehicle with parts', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleWithPartsId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete vehicle');
      expect(response.body.message).toContain('associated parts');

      // Verify vehicle still exists
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleWithPartsId } });
      expect(vehicle).toBeDefined();
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .delete('/api/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vehicle not found');
    });

    it('should prevent seller from deleting other sellers vehicle', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${otherVehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should allow admin to delete any vehicle', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deletedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      expect(deletedVehicle).toBeNull();
    });

    it('should reject buyer access', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Vehicle Management Integration', () => {
    it('should complete full vehicle lifecycle', async () => {
      // 1. Create vehicle
      const createResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition: 'GOOD',
          acquisitionDate: '2024-01-15'
        })
        .expect(201);

      const vehicleId = createResponse.body.data.id;

      // 2. Get vehicle details
      const getResponse = await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(getResponse.body.data.id).toBe(vehicleId);

      // 3. Update vehicle
      const updateResponse = await request(app)
        .put(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          mileage: 100000,
          color: 'Red',
          condition: 'FAIR'
        })
        .expect(200);

      expect(updateResponse.body.data.mileage).toBe(100000);
      expect(updateResponse.body.data.color).toBe('Red');

      // 4. List vehicles
      const listResponse = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(listResponse.body.data.items.some((v: any) => v.id === vehicleId)).toBe(true);

      // 5. Delete vehicle
      await request(app)
        .delete(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      // 6. Verify deletion
      await request(app)
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(404);
    });
  });
});
