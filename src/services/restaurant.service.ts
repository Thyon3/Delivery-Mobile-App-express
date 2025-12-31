/**
 * Restaurant Service
 * Handles restaurant and menu management with N+1 query optimization
 */

import prisma from '@/config/database';
import { RestaurantStatus, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';
import { CacheService } from '@/config/redis';

export class RestaurantService {
  /**
   * Get restaurant by ID with optimized menu loading
   * Solves N+1 problem with efficient joins
   */
  static async getRestaurantById(restaurantId: string, includeMenu: boolean = true) {
    const cacheKey = `restaurant:${restaurantId}:${includeMenu}`;
    
    // Try to get from cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.debug(`Restaurant ${restaurantId} fetched from cache`);
      return cached;
    }

    // If menu is included, use optimized query to prevent N+1
    if (includeMenu) {
      // Single query with nested includes - prevents N+1 problem
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
              menuItems: {
                where: { isAvailable: true },
                orderBy: { displayOrder: 'asc' },
                include: {
                  addons: {
                    where: { isAvailable: true },
                  },
                },
              },
            },
          },
          owner: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant not found');
      }

      // Cache for 5 minutes
      await CacheService.set(cacheKey, restaurant, 300);

      return restaurant;
    } else {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          owner: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant not found');
      }

      // Cache for 5 minutes
      await CacheService.set(cacheKey, restaurant, 300);

      return restaurant;
    }
  }

  /**
   * Create restaurant
   */
  static async createRestaurant(data: {
    ownerId: string;
    name: string;
    description?: string;
    phone: string;
    email?: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    cuisineTypes: string[];
    openingTime: string;
    closingTime: string;
    deliveryFee?: number;
    minimumOrder?: number;
  }) {
    // Use raw SQL to create restaurant with PostGIS point
    const restaurant = await prisma.$queryRaw<any[]>`
      INSERT INTO restaurants (
        id, "ownerId", name, description, phone, email, status,
        latitude, longitude, location, address, city, state, 
        "postalCode", country, "cuisineTypes", "openingTime", "closingTime",
        "deliveryFee", "minimumOrder", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${data.ownerId},
        ${data.name},
        ${data.description || null},
        ${data.phone},
        ${data.email || null},
        'PENDING_APPROVAL',
        ${data.latitude},
        ${data.longitude},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
        ${data.address},
        ${data.city},
        ${data.state},
        ${data.postalCode},
        ${data.country},
        ${Prisma.sql`ARRAY[${Prisma.join(data.cuisineTypes.map(c => Prisma.sql`${c}`))}]::text[]`},
        ${data.openingTime},
        ${data.closingTime},
        ${data.deliveryFee || 0},
        ${data.minimumOrder || 0},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    logger.info(`Restaurant created: ${restaurant[0].id}`);
    return restaurant[0];
  }

  /**
   * Update restaurant
   */
  static async updateRestaurant(restaurantId: string, data: Partial<{
    name: string;
    description: string;
    phone: string;
    email: string;
    isOpen: boolean;
    cuisineTypes: string[];
    openingTime: string;
    closingTime: string;
    deliveryFee: number;
    minimumOrder: number;
  }>) {
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    // Invalidate cache
    await CacheService.delPattern(`restaurant:${restaurantId}:*`);

    logger.info(`Restaurant updated: ${restaurantId}`);
    return restaurant;
  }

  /**
   * Create menu category
   */
  static async createCategory(data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    const category = await prisma.category.create({
      data,
    });

    // Invalidate restaurant cache
    await CacheService.delPattern(`restaurant:${data.restaurantId}:*`);

    logger.info(`Category created: ${category.id}`);
    return category;
  }

  /**
   * Create menu item
   */
  static async createMenuItem(data: {
    restaurantId: string;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    discountPrice?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    preparationTime?: number;
    addons?: Array<{
      name: string;
      price: number;
    }>;
  }) {
    const menuItem = await prisma.menuItem.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice,
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        preparationTime: data.preparationTime || 15,
        addons: data.addons ? {
          create: data.addons,
        } : undefined,
      },
      include: {
        addons: true,
      },
    });

    // Invalidate restaurant cache
    await CacheService.delPattern(`restaurant:${data.restaurantId}:*`);

    logger.info(`Menu item created: ${menuItem.id}`);
    return menuItem;
  }

  /**
   * Update menu item
   */
  static async updateMenuItem(menuItemId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    discountPrice: number;
    isAvailable: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    preparationTime: number;
  }>) {
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data,
      include: { restaurant: { select: { id: true } } },
    });

    // Invalidate restaurant cache
    await CacheService.delPattern(`restaurant:${menuItem.restaurantId}:*`);

    logger.info(`Menu item updated: ${menuItemId}`);
    return menuItem;
  }

  /**
   * Delete menu item
   */
  static async deleteMenuItem(menuItemId: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { restaurantId: true },
    });

    if (!menuItem) {
      throw new NotFoundError('Menu item not found');
    }

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    // Invalidate restaurant cache
    await CacheService.delPattern(`restaurant:${menuItem.restaurantId}:*`);

    logger.info(`Menu item deleted: ${menuItemId}`);
  }

  /**
   * Get restaurant orders
   */
  static async getRestaurantOrders(
    restaurantId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { restaurantId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          delivery: {
            include: {
              driver: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
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
      prisma.order.count({ where }),
    ]);

    return {
      items: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get restaurant statistics
   */
  static async getRestaurantStats(restaurantId: string) {
    const [totalOrders, completedOrders, revenue, avgRating] = await Promise.all([
      prisma.order.count({
        where: { restaurantId },
      }),
      prisma.order.count({
        where: { 
          restaurantId,
          status: 'DELIVERED',
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId,
          status: 'DELIVERED',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.review.aggregate({
        where: { restaurantId },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return {
      totalOrders,
      completedOrders,
      revenue: revenue._sum.totalAmount || 0,
      averageRating: avgRating._avg.rating || 0,
    };
  }
}
