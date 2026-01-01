/**
 * Favorite Service
 * Handles user favorites/wishlist for restaurants
 */

import prisma from '@/config/database';
import { BadRequestError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class FavoriteService {
  /**
   * Add restaurant to favorites
   */
  static async addFavorite(userId: string, restaurantId: string) {
    // Check if already favorited
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM favorites
      WHERE "userId" = ${userId} AND "restaurantId" = ${restaurantId}
    `;

    if (existing.length > 0) {
      throw new BadRequestError('Restaurant already in favorites');
    }

    await prisma.$queryRaw`
      INSERT INTO favorites ("userId", "restaurantId", "createdAt")
      VALUES (${userId}, ${restaurantId}, NOW())
    `;

    // Update customer favorite restaurants array
    await prisma.customer.update({
      where: { userId },
      data: {
        favoriteRestaurants: {
          push: restaurantId,
        },
      },
    });

    logger.info(`Restaurant ${restaurantId} added to favorites for user ${userId}`);
    return { success: true };
  }

  /**
   * Remove restaurant from favorites
   */
  static async removeFavorite(userId: string, restaurantId: string) {
    await prisma.$queryRaw`
      DELETE FROM favorites
      WHERE "userId" = ${userId} AND "restaurantId" = ${restaurantId}
    `;

    // Update customer favorite restaurants array
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { favoriteRestaurants: true },
    });

    if (customer) {
      const updated = customer.favoriteRestaurants.filter((id) => id !== restaurantId);
      await prisma.customer.update({
        where: { userId },
        data: { favoriteRestaurants: updated },
      });
    }

    logger.info(`Restaurant ${restaurantId} removed from favorites for user ${userId}`);
    return { success: true };
  }

  /**
   * Get user's favorite restaurants
   */
  static async getFavorites(userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { favoriteRestaurants: true },
    });

    if (!customer || customer.favoriteRestaurants.length === 0) {
      return [];
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        id: { in: customer.favoriteRestaurants },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        coverImage: true,
        rating: true,
        totalReviews: true,
        cuisineTypes: true,
        deliveryFee: true,
        minimumOrder: true,
        estimatedDeliveryTime: true,
        isOpen: true,
      },
    });

    return restaurants;
  }

  /**
   * Check if restaurant is favorited by user
   */
  static async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { favoriteRestaurants: true },
    });

    return customer?.favoriteRestaurants.includes(restaurantId) || false;
  }

  /**
   * Add menu item to favorites
   */
  static async addFavoriteMenuItem(userId: string, menuItemId: string) {
    await prisma.customer.update({
      where: { userId },
      data: {
        favoriteMenuItems: {
          push: menuItemId,
        },
      },
    });

    logger.info(`Menu Item ${menuItemId} added to favorites for user ${userId}`);
    return { success: true };
  }

  /**
   * Remove menu item from favorites
   */
  static async removeFavoriteMenuItem(userId: string, menuItemId: string) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { favoriteMenuItems: true },
    });

    if (customer) {
      const updated = customer.favoriteMenuItems.filter((id) => id !== menuItemId);
      await prisma.customer.update({
        where: { userId },
        data: { favoriteMenuItems: updated },
      });
    }

    logger.info(`Menu Item ${menuItemId} removed from favorites for user ${userId}`);
    return { success: true };
  }

  /**
   * Get user's favorite menu items
   */
  static async getFavoriteMenuItems(userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { favoriteMenuItems: true },
    });

    if (!customer || customer.favoriteMenuItems.length === 0) {
      return [];
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: customer.favoriteMenuItems },
        isAvailable: true,
      },
      include: {
        restaurant: {
          select: {
            name: true,
          }
        }
      }
    });

    return menuItems;
  }
}

