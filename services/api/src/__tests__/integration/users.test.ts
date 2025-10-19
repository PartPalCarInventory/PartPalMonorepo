import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Users API Integration Tests', () => {
  let buyerToken: string;
  let buyerId: string;
  let sellerToken: string;
  let sellerId: string;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup all test data
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean test data
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();

    // Create test buyer
    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'buyer@test.com',
        password: 'BuyerPass123!',
        name: 'Test Buyer',
        role: 'BUYER'
      });
    buyerToken = buyerResponse.body.data.accessToken;
    buyerId = buyerResponse.body.data.user.id;

    // Create test seller
    const sellerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seller@test.com',
        password: 'SellerPass123!',
        name: 'Test Seller',
        role: 'SELLER'
      });
    sellerToken = sellerResponse.body.data.accessToken;
    sellerId = sellerResponse.body.data.user.id;

    // Create test admin (directly in database since admin role not allowed via registration)
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
    adminId = admin.id;

    // Login as admin to get token
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLoginResponse.body.data.accessToken;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(buyerId);
      expect(response.body.data.email).toBe('buyer@test.com');
      expect(response.body.data.name).toBe('Test Buyer');
      expect(response.body.data.role).toBe('BUYER');
      expect(response.body.message).toBe('Profile retrieved successfully');
    });

    it('should include seller information for seller users', async () => {
      // First create a seller profile for the seller user
      await prisma.seller.create({
        data: {
          userId: sellerId,
          businessName: 'Test Auto Parts',
          businessType: 'SCRAP_YARD',
          street: '123 Auto Parts St',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          country: 'South Africa',
          phone: '+27123456789'
        }
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.seller).toBeDefined();
      expect(response.body.data.seller.businessName).toBe('Test Auto Parts');
      expect(response.body.data.seller.businessType).toBe('SCRAP_YARD');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user name successfully', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'Updated Buyer Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Buyer Name');
      expect(response.body.message).toBe('Profile updated successfully');

      // Verify in database
      const user = await prisma.user.findUnique({ where: { id: buyerId } });
      expect(user?.name).toBe('Updated Buyer Name');
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: '  Trimmed Name  ' })
        .expect(200);

      expect(response.body.data.name).toBe('Trimmed Name');
    });

    it('should reject name shorter than 2 characters', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'A' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid input');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing name field', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'BuyerPass123!',
          newPassword: 'NewBuyerPass456!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');

      // Verify old password no longer works
      const oldPasswordLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'BuyerPass123!'
        })
        .expect(401);

      expect(oldPasswordLogin.body.success).toBe(false);

      // Verify new password works
      const newPasswordLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'NewBuyerPass456!'
        })
        .expect(200);

      expect(newPasswordLogin.body.success).toBe(true);
    });

    it('should invalidate all refresh tokens after password change', async () => {
      // Get refresh token before password change
      const oldRefreshToken = (await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'BuyerPass123!'
        })).body.data.refreshToken;

      // Change password
      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'BuyerPass123!',
          newPassword: 'NewBuyerPass456!'
        })
        .expect(200);

      // Try to use old refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      expect(refreshResponse.body.success).toBe(false);
    });

    it('should reject incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewBuyerPass456!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid password');
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should validate new password requirements', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'BuyerPass123!',
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'BuyerPass123!',
          newPassword: 'NewBuyerPass456!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'BuyerPass123!'
          // Missing newPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/seller-registration', () => {
    beforeEach(async () => {
      // Mark buyer as verified for seller registration
      await prisma.user.update({
        where: { id: buyerId },
        data: { isVerified: true }
      });
    });

    it('should register verified buyer as seller', async () => {
      const sellerData = {
        businessName: 'New Auto Parts',
        businessType: 'SCRAP_YARD',
        description: 'Quality used auto parts',
        street: '123 Main Street',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        phone: '+27123456789',
        whatsapp: '+27123456789',
        website: 'https://newautoparts.co.za'
      };

      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(sellerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businessName).toBe('New Auto Parts');
      expect(response.body.data.businessType).toBe('SCRAP_YARD');
      expect(response.body.data.isVerified).toBe(false); // Starts unverified
      expect(response.body.message).toContain('pending verification');

      // Verify user role was updated to SELLER
      const user = await prisma.user.findUnique({ where: { id: buyerId } });
      expect(user?.role).toBe('SELLER');

      // Verify seller record was created
      const seller = await prisma.seller.findUnique({ where: { userId: buyerId } });
      expect(seller).toBeDefined();
      expect(seller?.businessName).toBe('New Auto Parts');
    });

    it('should set country to South Africa automatically', async () => {
      await prisma.user.update({
        where: { id: buyerId },
        data: { isVerified: true }
      });

      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          businessName: 'Test Business',
          businessType: 'DISMANTLER',
          street: '999 Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          phone: '+27987654321'
        })
        .expect(201);

      expect(response.body.data.country).toBe('South Africa');
    });

    it('should reject duplicate seller registration', async () => {
      // Create seller profile first
      await prisma.seller.create({
        data: {
          userId: buyerId,
          businessName: 'Existing Business',
          businessType: 'SCRAP_YARD',
          street: '456 Business Rd',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4000',
          country: 'South Africa',
          phone: '+27111222333'
        }
      });

      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          businessName: 'Another Business',
          businessType: 'DISMANTLER',
          street: '789 Another St',
          city: 'Pretoria',
          province: 'Gauteng',
          postalCode: '0001',
          phone: '+27444555666'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Already a seller');
    });

    it('should require verified user', async () => {
      // Create unverified user
      const unverifiedResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unverified@test.com',
          password: 'UnverifiedPass123!',
          name: 'Unverified User',
          role: 'BUYER'
        });

      const unverifiedToken = unverifiedResponse.body.data.accessToken;

      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          businessName: 'Test Business',
          businessType: 'SCRAP_YARD',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          phone: '+27123456789'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          businessName: '', // Invalid empty name
          phone: 'invalid-phone' // Invalid phone format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate South African phone number format', async () => {
      const response = await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          businessName: 'Test Business',
          businessType: 'SCRAP_YARD',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          phone: '+1234567890' // Non-SA phone number
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/seller-registration')
        .send({
          businessName: 'Test Business',
          businessType: 'SCRAP_YARD',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          phone: '+27123456789'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users (Admin)', () => {
    it('should allow admin to list all users with pagination', async () => {
      // Create additional users
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: `user${i}@test.com`,
            password: `UserPass${i}23!`,
            name: `User ${i}`,
            role: 'BUYER'
          });
      }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBeLessThanOrEqual(5);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(5);
      expect(response.body.data.pagination.totalCount).toBeGreaterThanOrEqual(5);
    });

    it('should order users by creation date descending', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = response.body.data.users;
      for (let i = 0; i < users.length - 1; i++) {
        const currentDate = new Date(users[i].createdAt);
        const nextDate = new Date(users[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('should support pagination', async () => {
      // Create users
      for (let i = 1; i <= 10; i++) {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: `paguser${i}@test.com`,
            password: `PagPass${i}23!`,
            name: `Pag User ${i}`,
            role: 'BUYER'
          });
      }

      const page1 = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 5 })
        .expect(200);

      const page2 = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, pageSize: 5 })
        .expect(200);

      expect(page1.body.data.users).toHaveLength(5);
      expect(page2.body.data.users.length).toBeGreaterThan(0);

      // Verify different users on each page
      const page1Ids = page1.body.data.users.map((u: any) => u.id);
      const page2Ids = page2.body.data.users.map((u: any) => u.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('should limit maximum page size to 100', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, pageSize: 500 })
        .expect(200);

      expect(response.body.data.pagination.pageSize).toBeLessThanOrEqual(100);
    });

    it('should default to page 1 and pageSize 20', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(20);
    });

    it('should not include passwords in response', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.users.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject seller users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Profile Integration', () => {
    it('should complete full profile management workflow', async () => {
      // 1. Get initial profile
      const profile1 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(profile1.body.data.name).toBe('Test Buyer');

      // 2. Update profile name
      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'Updated Test Buyer' })
        .expect(200);

      // 3. Change password
      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          currentPassword: 'BuyerPass123!',
          newPassword: 'NewSecurePass456!'
        })
        .expect(200);

      // 4. Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'NewSecurePass456!'
        })
        .expect(200);

      const newToken = loginResponse.body.data.accessToken;

      // 5. Get profile with new token
      const profile2 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profile2.body.data.name).toBe('Updated Test Buyer');
    });

    it('should complete buyer-to-seller upgrade workflow', async () => {
      // Mark buyer as verified
      await prisma.user.update({
        where: { id: buyerId },
        data: { isVerified: true }
      });

      // 1. Check initial profile (buyer)
      const profile1 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(profile1.body.data.role).toBe('BUYER');
      expect(profile1.body.data.seller).toBeNull();

      // 2. Register as seller
      await request(app)
        .post('/api/users/seller-registration')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          businessName: 'My Auto Parts Business',
          businessType: 'DISMANTLER',
          description: 'Quality parts',
          street: '789 Parts Boulevard',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8000',
          phone: '+27123456789'
        })
        .expect(201);

      // 3. Check updated profile (now seller)
      const profile2 = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(profile2.body.data.role).toBe('SELLER');
      expect(profile2.body.data.seller).toBeDefined();
      expect(profile2.body.data.seller.businessName).toBe('My Auto Parts Business');
    });
  });
});
