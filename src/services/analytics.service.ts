/**
 * Analytics Service
 * Provides business analytics and reporting
 */

import prisma from '@/config/database';
import logger from '@/utils/logger';

export class AnalyticsService {
  /**
   * Get platform-wide statistics
   */
  static async getPlatformStats(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalDrivers,
      totalRestaurants,
      activeOrders,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
          },
        },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCustomers,
      totalDrivers,
      totalRestaurants,
      activeOrders,
    };
  }

  /**
   * Get order statistics by status
   */
  static async getOrderStatsByStatus(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return stats.map((stat) => ({
      status: stat.status,
      count: stat._count,
    }));
  }

  /**
   * Get top performing restaurants
   */
  static async getTopRestaurants(limit: number = 10) {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        rating: true,
        totalReviews: true,
        _count: {
          select: {
            orders: {
              where: { status: 'DELIVERED' },
            },
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' },
      ],
      take: limit,
    });

    return restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      rating: restaurant.rating,
      totalReviews: restaurant.totalReviews,
      totalOrders: restaurant._count.orders,
    }));
  }

  /**
   * Get revenue trend
   */
  static async getRevenueTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: startDate },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Group by date
    const trend: Record<string, number> = {};
    
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + Number(order.totalAmount);
    });

    return Object.entries(trend).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }
}
