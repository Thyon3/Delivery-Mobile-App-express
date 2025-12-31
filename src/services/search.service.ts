/**
 * Search Service
 * Full-text search for restaurants and menu items
 */

import prisma from '@/config/database';
import { CacheService } from '@/config/redis';
import logger from '@/utils/logger';

export class SearchService {
  /**
   * Search restaurants by name or cuisine
   */
  static async searchRestaurants(
    query: string,
    filters?: {
      latitude?: number;
      longitude?: number;
      radius?: number;
      cuisineTypes?: string[];
      minRating?: number;
    }
  ) {
    const cacheKey = `search:restaurants:${query}:${JSON.stringify(filters)}`;
    
    // Check cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { cuisineTypes: { hasSome: [query] } },
      ],
    };

    if (filters?.cuisineTypes && filters.cuisineTypes.length > 0) {
      where.cuisineTypes = { hasSome: filters.cuisineTypes };
    }

    if (filters?.minRating) {
      where.rating = { gte: filters.minRating };
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        rating: true,
        totalReviews: true,
        cuisineTypes: true,
        deliveryFee: true,
        minimumOrder: true,
        estimatedDeliveryTime: true,
        isOpen: true,
      },
      take: 20,
    });

    // Cache results for 5 minutes
    await CacheService.set(cacheKey, restaurants, 300);

    logger.info(`Search completed: ${query} - ${restaurants.length} results`);
    return restaurants;
  }

  /**
   * Search menu items
   */
  static async searchMenuItems(
    query: string,
    restaurantId?: string
  ) {
    const where: any = {
      isAvailable: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 50,
    });

    return menuItems;
  }

  /**
   * Get popular searches
   */
  static async getPopularSearches(limit: number = 10): Promise<string[]> {
    // This would typically be tracked in a separate table or Redis
    // For now, return popular cuisine types
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'ACTIVE' },
      select: { cuisineTypes: true },
    });

    const cuisineCount: Record<string, number> = {};
    
    restaurants.forEach((restaurant) => {
      restaurant.cuisineTypes.forEach((cuisine) => {
        cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
      });
    });

    const popular = Object.entries(cuisineCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([cuisine]) => cuisine);

    return popular;
  }
}
