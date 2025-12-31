/**
 * Authentication & Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors/AppError';
import { JwtPayload } from '@/types';
import { asyncHandler } from '@/utils/asyncHandler';
import prisma from '@/config/database';
import { UserRole } from '@prisma/client';

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload;

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is not active');
      }

      // Attach user info to request
      req.user = decoded;
      req.userId = decoded.userId;
      req.userRole = decoded.role;

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
);

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.userRole) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.userRole as UserRole)) {
        throw new ForbiddenError('Access denied');
      }

      next();
    }
  );
};

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as JwtPayload;

        req.user = decoded;
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      } catch (error) {
        // Silently fail, continue without authentication
      }
    }

    next();
  }
);
