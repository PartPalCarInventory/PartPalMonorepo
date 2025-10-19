import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse, User } from '@partpal/shared-types';
import { prisma } from '@partpal/database';

interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'No authentication token provided',
      };
      res.status(401).json(response);
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Fetch fresh user data to ensure user still exists and is verified
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found',
        message: 'Authentication failed',
      };
      res.status(401).json(response);
      return;
    }

    req.user = user as User;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Access denied',
        message: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

export const requireVerified = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Access denied',
      message: 'Authentication required',
    };
    res.status(401).json(response);
    return;
  }

  if (!req.user.isVerified) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource',
    };
    res.status(403).json(response);
    return;
  }

  next();
};