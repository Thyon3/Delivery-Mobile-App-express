/**
 * User Service
 * Handles user profile management
 */

import prisma from '@/config/database';
import { NotFoundError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class UserService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        profileImage: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        customerProfile: true,
        driverProfile: true,
        restaurantOwner: {
          include: {
            restaurants: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profileImage?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    logger.info(`User profile updated: ${userId}`);
    return user;
  }

  /**
   * Get user addresses
   */
  static async getUserAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: {
        isDefault: 'desc',
      },
    });

    return addresses;
  }

  /**
   * Delete user address
   */
  static async deleteAddress(addressId: string) {
    await prisma.address.delete({
      where: { id: addressId },
    });

    logger.info(`Address deleted: ${addressId}`);
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { walletBalance: true },
    });

    return customer?.walletBalance || 0;
  }

  /**
   * Get wallet transactions
   */
  static async getWalletTransactions(userId: string, limit: number = 20) {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions;
  }
}
