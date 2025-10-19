import express from 'express';
import { prisma } from '@partpal/database';
import { ApiResponse, User, Seller } from '@partpal/shared-types';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth';
import {
  changePasswordSchema,
  sellerRegistrationSchema,
  ChangePasswordInput,
  SellerRegistrationInput,
} from '../utils/validation';
import { hashPassword, comparePassword } from '../utils/auth';

const router: express.Router = express.Router();

// Get user profile (requires authentication)
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            description: true,
            isVerified: true,
            rating: true,
            totalSales: true,
            subscriptionPlan: true,
            street: true,
            city: true,
            province: true,
            postalCode: true,
            country: true,
            phone: true,
            whatsapp: true,
            website: true,
            businessHours: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found',
        message: 'User profile not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<User & { seller?: Seller }> = {
      success: true,
      data: user as any,
      message: 'Profile retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid input',
        message: 'Name must be at least 2 characters long',
      };
      return res.status(400).json(response);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
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

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser as User,
      message: 'Profile updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const validatedData: ChangePasswordInput = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;
    const userId = (req as any).user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found',
        message: 'User not found',
      };
      return res.status(404).json(response);
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect',
      };
      return res.status(400).json(response);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Password changed successfully. Please log in again.',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Register as seller
router.post('/seller-registration', authenticateToken, requireVerified, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const validatedData: SellerRegistrationInput = sellerRegistrationSchema.parse(req.body);

    // Check if user is already a seller
    const existingSeller = await prisma.seller.findUnique({
      where: { userId },
    });

    if (existingSeller) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Already a seller',
        message: 'User is already registered as a seller',
      };
      return res.status(409).json(response);
    }

    // Create seller profile
    const seller = await prisma.seller.create({
      data: {
        userId,
        businessName: validatedData.businessName,
        businessType: validatedData.businessType,
        description: validatedData.description,
        street: validatedData.street,
        city: validatedData.city,
        province: validatedData.province,
        postalCode: validatedData.postalCode,
        country: 'South Africa',
        phone: validatedData.phone,
        whatsapp: validatedData.whatsapp,
        website: validatedData.website,
      },
    });

    // Update user role to SELLER
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'SELLER' },
    });

    const response: ApiResponse<Seller> = {
      success: true,
      data: seller as any,
      message: 'Seller registration successful. Your account is pending verification.',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Admin: Get all users
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const skip = (page - 1) * pageSize;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const response: ApiResponse<{
      users: User[];
      pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
      };
    }> = {
      success: true,
      data: {
        users: users as User[],
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
      message: 'Users retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;