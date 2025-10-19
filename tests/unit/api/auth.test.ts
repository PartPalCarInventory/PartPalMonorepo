import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, JWTPayload } from '../../../services/api/src/middleware/auth';
import { prisma } from '@partpal/database';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@partpal/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();

    // Set up environment
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('authenticateToken', () => {
    it('should pass authentication with valid token and verified user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'seller',
        isVerified: true,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      });
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request when no authorization header is provided', async () => {
      mockRequest.headers = {};

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle invalid JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired JWT token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        message: 'Please log in again',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user does not exist in database', async () => {
      const mockPayload: JWTPayload = {
        userId: 'nonexistent-user',
        email: 'deleted@example.com',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'User no longer exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user is not verified', async () => {
      const mockUser = {
        id: 'user123',
        email: 'unverified@example.com',
        name: 'Unverified User',
        role: 'seller',
        isVerified: false,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'unverified@example.com',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account not verified',
        message: 'Please verify your email address before accessing this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing JWT_SECRET environment variable', async () => {
      delete process.env.JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server configuration error',
        message: 'Authentication service not properly configured',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication service error',
        message: 'Unable to verify user credentials',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle different user roles correctly', async () => {
      const roles = ['admin', 'seller', 'buyer'] as const;

      for (const role of roles) {
        const mockUser = {
          id: `user-${role}`,
          email: `${role}@example.com`,
          name: `${role} User`,
          role,
          isVerified: true,
          createdAt: new Date(),
        };

        const mockPayload: JWTPayload = {
          userId: `user-${role}`,
          email: `${role}@example.com`,
          role,
        };

        mockRequest.headers = {
          authorization: 'Bearer valid-token',
        };

        mockJwt.verify.mockReturnValue(mockPayload);
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        await authenticateToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockRequest.user).toEqual(mockUser);
        expect(mockNext).toHaveBeenCalled();

        // Reset for next iteration
        jest.clearAllMocks();
      }
    });

    it('should attach user to request object for subsequent middleware', async () => {
      const mockUser = {
        id: 'user123',
        email: 'middleware@example.com',
        name: 'Middleware User',
        role: 'seller',
        isVerified: true,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'user123',
        email: 'middleware@example.com',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify that the user object is correctly attached to the request
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user123');
      expect(mockRequest.user?.email).toBe('middleware@example.com');
      expect(mockRequest.user?.role).toBe('seller');
      expect(mockRequest.user?.isVerified).toBe(true);
    });
  });

  describe('PartPal Business Logic', () => {
    it('should handle PartPal seller authentication flow', async () => {
      const partpalSeller = {
        id: 'seller123',
        email: 'autoparts@joburg.co.za',
        name: 'AutoParts Johannesburg',
        role: 'seller',
        isVerified: true,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'seller123',
        email: 'autoparts@joburg.co.za',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer partpal-seller-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(partpalSeller);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user?.role).toBe('seller');
      expect(mockRequest.user?.isVerified).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle PartPal admin authentication for IMS access', async () => {
      const partpalAdmin = {
        id: 'admin123',
        email: 'admin@partpal.co.za',
        name: 'PartPal Administrator',
        role: 'admin',
        isVerified: true,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'admin123',
        email: 'admin@partpal.co.za',
        role: 'admin',
      };

      mockRequest.headers = {
        authorization: 'Bearer partpal-admin-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(partpalAdmin);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user?.role).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle marketplace buyer authentication', async () => {
      const partpalBuyer = {
        id: 'buyer123',
        email: 'customer@mechanic.co.za',
        name: 'Local Mechanic Shop',
        role: 'buyer',
        isVerified: true,
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'buyer123',
        email: 'customer@mechanic.co.za',
        role: 'buyer',
      };

      mockRequest.headers = {
        authorization: 'Bearer partpal-buyer-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(partpalBuyer);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user?.role).toBe('buyer');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unverified PartPal sellers to maintain marketplace quality', async () => {
      const unverifiedSeller = {
        id: 'seller456',
        email: 'newvendor@parts.co.za',
        name: 'New Parts Vendor',
        role: 'seller',
        isVerified: false, // Not verified yet
        createdAt: new Date(),
      };

      const mockPayload: JWTPayload = {
        userId: 'seller456',
        email: 'newvendor@parts.co.za',
        role: 'seller',
      };

      mockRequest.headers = {
        authorization: 'Bearer unverified-seller-token',
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockPrisma.user.findUnique.mockResolvedValue(unverifiedSeller);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account not verified',
        message: 'Please verify your email address before accessing this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security Considerations', () => {
    it('should not expose sensitive user information in responses', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).not.toHaveProperty('user');
      expect(responseCall).not.toHaveProperty('token');
      expect(responseCall.message).toBe('Authentication failed');
    });

    it('should validate JWT signature properly', async () => {
      mockRequest.headers = {
        authorization: 'Bearer tampered-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid signature');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed JWT tokens gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer not.a.valid.jwt',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed',
      });
    });
  });
});