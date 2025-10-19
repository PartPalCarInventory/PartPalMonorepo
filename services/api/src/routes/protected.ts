import express from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole, requireVerified } from '../middleware/auth';

const router: express.Router = express.Router();

// Protected route example - requires authentication
router.get('/profile', authenticateToken, (req, res) => {
  const response: ApiResponse<{ user: any }> = {
    success: true,
    data: {
      user: (req as any).user,
    },
    message: 'Protected resource accessed successfully',
  };
  res.json(response);
});

// Admin only route example
router.get('/admin/dashboard', authenticateToken, requireRole(['ADMIN']), (req, res) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: 'Welcome to the admin dashboard',
    },
    message: 'Admin dashboard accessed successfully',
  };
  res.json(response);
});

// Seller only route example
router.get('/seller/dashboard', authenticateToken, requireRole(['SELLER', 'ADMIN']), requireVerified, (req, res) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: 'Welcome to the seller dashboard',
    },
    message: 'Seller dashboard accessed successfully',
  };
  res.json(response);
});

// Verified user route example
router.get('/verified-only', authenticateToken, requireVerified, (req, res) => {
  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: 'This resource requires email verification',
    },
    message: 'Verified resource accessed successfully',
  };
  res.json(response);
});

export default router;