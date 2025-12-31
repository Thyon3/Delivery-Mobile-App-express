/**
 * Driver Service
 * Handles driver-specific operations
 */

import prisma from '@/config/database';
import { BadRequestError, NotFoundError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class DriverService {
  /**
   * Complete driver registration with vehicle details
   */
  static async completeDriverRegistration(userId: string, data: {
    licenseNumber: string;
    vehicleType: string;
    vehicleNumber: string;
  }) {
    // Check if driver profile already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (existingDriver) {
      throw new BadRequestError('Driver profile already exists');
    }

    // Create driver profile
    const driver = await prisma.driver.create({
      data: {
        userId,
        licenseNumber: data.licenseNumber,
        vehicleType: data.vehicleType as any,
        vehicleNumber: data.vehicleNumber,
      },
    });

    logger.info(`Driver registration completed: ${driver.id}`);
    return driver;
  }

  /**
   * Get driver profile
   */
  static async getDriverProfile(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    return driver;
  }

  /**
   * Update driver status
   */
  static async updateDriverStatus(userId: string, status: string, isAvailable?: boolean) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: status as any,
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    logger.info(`Driver status updated: ${driver.id} -> ${status}`);
    return updated;
  }

  /**
   * Get driver deliveries
   */
  static async getDriverDeliveries(userId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { driverId: driver.id };

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          order: {
            include: {
              restaurant: {
                select: {
                  name: true,
                  address: true,
                  phone: true,
                },
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.delivery.count({ where }),
    ]);

    return {
      items: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get driver earnings
   */
  static async getDriverEarnings(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const where: any = { driverId: driver.id };

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [earnings, totalEarnings] = await Promise.all([
      prisma.driverEarning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.driverEarning.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      earnings,
      total: totalEarnings._sum.amount || 0,
      walletBalance: driver.walletBalance,
    };
  }
}
