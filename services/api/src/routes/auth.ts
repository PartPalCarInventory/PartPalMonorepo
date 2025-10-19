import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, User } from '@partpal/shared-types';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from '../utils/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '../utils/validation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const validatedData: RegisterInput = registerSchema.parse(req.body);
    const { email, password, name, role } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User already exists',
        message: 'An account with this email address already exists',
      };
      return res.status(409).json(response);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'BUYER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    const response: ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }> = {
      success: true,
      data: {
        user: user as User,
        accessToken,
        refreshToken,
      },
      message: 'Registration successful',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const validatedData: LoginInput = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      };
      return res.status(401).json(response);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      };
      return res.status(401).json(response);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
    });

    const userResponse: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'SELLER' | 'BUYER',
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response: ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }> = {
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const validatedData: RefreshTokenInput = refreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    // Find and validate refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired',
      };
      return res.status(401).json(response);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    const response: ApiResponse<{
      user: User;
      accessToken: string;
    }> = {
      success: true,
      data: {
        user: storedToken.user as User,
        accessToken,
      },
      message: 'Token refreshed successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Logout user (invalidate refresh token)
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Delete specific refresh token
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: (req as any).user.id,
        },
      });
    } else {
      // Delete all refresh tokens for user (logout from all devices)
      await prisma.refreshToken.deleteMany({
        where: {
          userId: (req as any).user.id,
        },
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Logged out successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const response: ApiResponse<User> = {
      success: true,
      data: (req as any).user,
      message: 'User retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;