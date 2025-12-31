/**
 * Statistics Service
 * Provides detailed statistics for various entities
 */

import prisma from '@/config/database';

export class StatsService {
  /**
   * Get restaurant performance stats
   */
  static async getRestaurantPerformance(restaurantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalOrders, completedOrders, cancelledOrders, revenue, avgRating, topItems] =
      await Promise.all([
        prisma.order.count({
          where: {
            restaurantId,
            createdAt: { gte: startDate },
          },
        }),
        prisma.order.count({
          where: {
            restaurantId,
            status: 'DELIVERED',
            createdAt: { gte: startDate },
          },
        }),
        prisma.order.count({
          where: {
            restaurantId,
            status: 'CANCELLED',
            createdAt: { gte: startDate },
          },
        }),
        prisma.order.aggregate({
          where: {
            restaurantId,
            status: 'DELIVERED',
            createdAt: { gte: startDate },
          },
          _sum: { totalAmount: true },
        }),
        prisma.review.aggregate({
          where: { restaurantId },
          _avg: { rating: true },
        }),
        prisma.orderItem.groupBy({
          by: ['menuItemId'],
          where: {
            order: {
              restaurantId,
              createdAt: { gte: startDate },
            },
          },
          _count: { menuItemId: true },
          _sum: { quantity: true },
          orderBy: {
            _count: { menuItemId: 'desc' },
          },
          take: 5,
        }),
      ]);

    const completionRate =
      totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : '0';
    const cancellationRate =
      totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : '0';

    return {
      orders: {
        total: totalOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        completionRate: `${completionRate}%`,
        cancellationRate: `${cancellationRate}%`,
      },
      revenue: {
        total: revenue._sum.totalAmount || 0,
        average: totalOrders > 0 ? Number(revenue._sum.totalAmount) / totalOrders : 0,
      },
      rating: {
        average: avgRating._avg.rating || 0,
      },
      topItems: topItems.map((item) => ({
        menuItemId: item.menuItemId,
        orderCount: item._count.menuItemId,
        totalQuantity: item._sum.quantity || 0,
      })),
    };
  }

  /**
   * Get driver performance stats
   */
  static async getDriverPerformance(driverId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalDeliveries, earnings, avgDeliveryTime] = await Promise.all([
      prisma.delivery.count({
        where: {
          driverId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.driverEarning.aggregate({
        where: {
          driverId,
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<any[]>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("deliveredAt" - "assignedAt")) / 60
        ) as avg_minutes
        FROM deliveries
        WHERE "driverId" = ${driverId}
          AND "deliveredAt" IS NOT NULL
          AND "assignedAt" IS NOT NULL
          AND "createdAt" >= ${startDate}
      `,
    ]);

    return {
      deliveries: {
        total: totalDeliveries,
      },
      earnings: {
        total: earnings._sum.amount || 0,
        average: totalDeliveries > 0 ? Number(earnings._sum.amount) / totalDeliveries : 0,
      },
      performance: {
        avgDeliveryTime: avgDeliveryTime[0]?.avg_minutes || 0,
      },
    };
  }

  /**
   * Get customer stats
   */
  static async getCustomerStats(userId: string) {
    const [totalOrders, totalSpent, favoriteRestaurantsCount, reviewsCount] =
      await Promise.all([
        prisma.order.count({ where: { customerId: userId } }),
        prisma.order.aggregate({
          where: { customerId: userId, status: 'DELIVERED' },
          _sum: { totalAmount: true },
        }),
        prisma.customer.findUnique({
          where: { userId },
          select: { favoriteRestaurants: true },
        }),
        prisma.review.count({ where: { customerId: userId } }),
      ]);

    return {
      orders: {
        total: totalOrders,
      },
      spending: {
        total: totalSpent._sum.totalAmount || 0,
        average: totalOrders > 0 ? Number(totalSpent._sum.totalAmount) / totalOrders : 0,
      },
      favorites: {
        count: favoriteRestaurantsCount?.favoriteRestaurants.length || 0,
      },
      reviews: {
        count: reviewsCount,
      },
    };
  }
}
