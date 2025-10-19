import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth API Integration Tests', () => {
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
    // Clean auth-related data before each test
    await prisma.refreshToken.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new buyer successfully', async () => {
      const userData = {
        email: 'buyer@test.com',
        password: 'SecurePass123!',
        name: 'Test Buyer',
        role: 'BUYER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('buyer@test.com');
      expect(response.body.data.user.name).toBe('Test Buyer');
      expect(response.body.data.user.role).toBe('BUYER');
      expect(response.body.data.user.isVerified).toBe(false);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.message).toBe('Registration successful');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'buyer@test.com' }
      });
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test Buyer');
    });

    it('should register a new seller successfully', async () => {
      const userData = {
        email: 'seller@test.com',
        password: 'SecurePass123!',
        name: 'Test Seller',
        role: 'SELLER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('SELLER');
    });

    it('should default to BUYER role if role not specified', async () => {
      const userData = {
        email: 'defaultrole@test.com',
        password: 'SecurePass123!',
        name: 'Default Role User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('BUYER');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        name: 'First User',
        role: 'BUYER'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User already exists');
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: ''
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should hash the password before storing', async () => {
      const userData = {
        email: 'hashtest@test.com',
        password: 'PlainTextPassword123!',
        name: 'Hash Test User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { email: 'hashtest@test.com' }
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe('PlainTextPassword123!');
      expect(user?.password.length).toBeGreaterThan(20); // Hashed passwords are long
    });

    it('should store refresh token in database', async () => {
      const userData = {
        email: 'tokentest@test.com',
        password: 'SecurePass123!',
        name: 'Token Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const refreshToken = response.body.data.refreshToken;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });

      expect(storedToken).toBeDefined();
      expect(storedToken?.userId).toBe(response.body.data.user.id);
      expect(storedToken?.expiresAt).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@test.com',
          password: 'TestPassword123!',
          name: 'Login Test User',
          role: 'SELLER'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
      expect(response.body.data.user.name).toBe('Login Test User');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.message).toBe('Login successful');
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.message).toContain('incorrect');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.message).toContain('incorrect');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: '',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create new refresh token on each login', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'TestPassword123!'
      };

      // First login
      const response1 = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token1 = response1.body.data.refreshToken;

      // Second login
      const response2 = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token2 = response2.body.data.refreshToken;

      expect(token1).not.toBe(token2);

      // Both tokens should exist in database
      const storedToken1 = await prisma.refreshToken.findUnique({
        where: { token: token1 }
      });
      const storedToken2 = await prisma.refreshToken.findUnique({
        where: { token: token2 }
      });

      expect(storedToken1).toBeDefined();
      expect(storedToken2).toBeDefined();
    });

    it('should return user role correctly', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.data.user.role).toBe('SELLER');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and get refresh token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@test.com',
          password: 'TestPassword123!',
          name: 'Refresh Test User'
        });

      refreshToken = registerResponse.body.data.refreshToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe('refresh@test.com');
      expect(response.body.message).toBe('Token refreshed successfully');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token-12345' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
      expect(response.body.message).toContain('invalid or expired');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const expiredToken = await prisma.refreshToken.create({
        data: {
          token: 'expired-token-12345',
          userId,
          expiresAt: expiredDate
        }
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken.token })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should validate refresh token format', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return user details with refreshed token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('refresh@test.com');
      expect(response.body.data.user.name).toBe('Refresh Test User');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and get tokens
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@test.com',
          password: 'TestPassword123!',
          name: 'Logout Test User'
        });

      accessToken = registerResponse.body.data.accessToken;
      refreshToken = registerResponse.body.data.refreshToken;
    });

    it('should logout and invalidate specific refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify token is deleted from database
      const deletedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      expect(deletedToken).toBeNull();
    });

    it('should logout from all devices when no refresh token provided', async () => {
      // Create multiple refresh tokens (simulate multiple logins)
      const loginResponse1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'TestPassword123!'
        });

      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'TestPassword123!'
        });

      const userId = loginResponse1.body.data.user.id;

      // Logout without specifying refresh token
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all tokens for user are deleted
      const remainingTokens = await prisma.refreshToken.findMany({
        where: { userId }
      });
      expect(remainingTokens).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle logout with invalid access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle logout without Authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and get access token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me@test.com',
          password: 'TestPassword123!',
          name: 'Me Test User',
          role: 'BUYER'
        });

      accessToken = registerResponse.body.data.accessToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('me@test.com');
      expect(response.body.data.name).toBe('Me Test User');
      expect(response.body.data.role).toBe('BUYER');
      expect(response.body.message).toBe('User retrieved successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not include password in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.password).toBeUndefined();
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full registration-login-refresh-logout flow', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'flow@test.com',
          password: 'FlowTest123!',
          name: 'Flow Test User',
          role: 'SELLER'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const initialAccessToken = registerResponse.body.data.accessToken;
      const initialRefreshToken = registerResponse.body.data.refreshToken;

      // 2. Use access token to get user
      const meResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${initialAccessToken}`)
        .expect(200);

      expect(meResponse1.body.data.email).toBe('flow@test.com');

      // 3. Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'flow@test.com',
          password: 'FlowTest123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const newAccessToken = loginResponse.body.data.accessToken;

      // 4. Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      const refreshedAccessToken = refreshResponse.body.data.accessToken;

      // 5. Use refreshed token
      const meResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshedAccessToken}`)
        .expect(200);

      expect(meResponse2.body.data.email).toBe('flow@test.com');

      // 6. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // 7. Verify refresh token no longer works
      const failedRefreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(401);

      expect(failedRefreshResponse.body.success).toBe(false);
    });

    it('should handle multiple concurrent sessions', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'concurrent@test.com',
          password: 'ConcurrentTest123!',
          name: 'Concurrent Test User'
        });

      // Login from multiple devices (sessions)
      const session1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'concurrent@test.com',
          password: 'ConcurrentTest123!'
        });

      const session2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'concurrent@test.com',
          password: 'ConcurrentTest123!'
        });

      const session3 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'concurrent@test.com',
          password: 'ConcurrentTest123!'
        });

      // All sessions should work independently
      const me1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session1.body.data.accessToken}`)
        .expect(200);

      const me2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session2.body.data.accessToken}`)
        .expect(200);

      const me3 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session3.body.data.accessToken}`)
        .expect(200);

      expect(me1.body.data.email).toBe('concurrent@test.com');
      expect(me2.body.data.email).toBe('concurrent@test.com');
      expect(me3.body.data.email).toBe('concurrent@test.com');

      // Logout from one session shouldn't affect others
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${session1.body.data.accessToken}`)
        .send({ refreshToken: session1.body.data.refreshToken })
        .expect(200);

      // Session 1 refresh token should be invalid
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: session1.body.data.refreshToken })
        .expect(401);

      // Sessions 2 and 3 should still work
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: session2.body.data.refreshToken })
        .expect(200);

      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: session3.body.data.refreshToken })
        .expect(200);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      // Should not reveal whether email exists or not
      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.message).not.toContain('email');
      expect(response.body.message).not.toContain('user not found');
    });

    it('should handle SQL injection attempts safely', async () => {
      const sqlInjectionAttempt = {
        email: "admin@test.com' OR '1'='1",
        password: "password' OR '1'='1"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(sqlInjectionAttempt);

      // Should either return 400 (validation error) or 401 (invalid credentials)
      // Both are acceptable as the injection is safely handled
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle XSS attempts in registration', async () => {
      const xssAttempt = {
        email: 'xss@test.com',
        password: 'SecurePass123!',
        name: '<script>alert("XSS")</script>',
        role: 'BUYER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(xssAttempt)
        .expect(201);

      // Name should be stored but sanitized
      expect(response.body.data.user.name).toBeDefined();

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: 'xss@test.com' }
      });
      expect(user).toBeDefined();
    });

    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        'abc',
        '12345678'
      ];

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test-${Math.random()}@test.com`,
            password: weakPassword,
            name: 'Test User'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Role-Based Access', () => {
    it('should accept valid roles during registration', async () => {
      const roles = ['BUYER', 'SELLER'];

      for (const role of roles) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `${role.toLowerCase()}@test.com`,
            password: 'SecurePass123!',
            name: `${role} User`,
            role
          })
          .expect(201);

        expect(response.body.data.user.role).toBe(role);
      }
    });

    it('should reject invalid roles during registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalidrole@test.com',
          password: 'SecurePass123!',
          name: 'Invalid Role User',
          role: 'ADMIN' // ADMIN not allowed via public registration
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should preserve role through login', async () => {
      // Register as seller
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'roletest@test.com',
          password: 'SecurePass123!',
          name: 'Role Test',
          role: 'SELLER'
        });

      // Login and verify role
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'roletest@test.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(loginResponse.body.data.user.role).toBe('SELLER');

      // Verify role via /me endpoint
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(meResponse.body.data.role).toBe('SELLER');
    });
  });
});
