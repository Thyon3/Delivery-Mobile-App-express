/**
 * Admin Service
 * Handles administrative operations and dashboard data
 */

import prisma from '@/config/database';
import logger from '@/utils/logger';

export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(filters?: {
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
      totalUsers,
      totalCustomers,
      totalDrivers,
      totalRestaurants,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      activeDrivers,
      onlineRestaurants,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count({ where }),
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'ACCEPTED', 'PREPARING'] },
        },
      }),
      prisma.order.count({
        where: { ...where, status: 'DELIVERED' },
      }),
      prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: 'DELIVERED',
        },
        _sum: { totalAmount: true },
      }),
      prisma.driver.count({ where: { status: 'ONLINE' } }),
      prisma.restaurant.count({ where: { isOpen: true, status: 'ACTIVE' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        drivers: totalDrivers,
        restaurants: totalRestaurants,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        today: todayOrders,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        today: todayRevenue._sum.totalAmount || 0,
      },
      active: {
        drivers: activeDrivers,
        restaurants: onlineRestaurants,
      },
    };
  }

  /**
   * Get recent users
   */
  static async getRecentUsers(limit: number = 10) {
    return await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get recent orders
   */
  static async getRecentOrders(limit: number = 10) {
    return await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get revenue by date range
   */
  static async getRevenueByDateRange(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'DELIVERED',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.totalAmount);
    });

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  /**
   * Get user activity
   */
  static async getUserActivity(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    // Group by date and role
    const activity: Record<string, Record<string, number>> = {};
    
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!activity[date]) activity[date] = {};
      activity[date][user.role] = (activity[date][user.role] || 0) + 1;
    });

    return activity;
  }

  /**
   * Moderate user (suspend/activate)
   */
  static async moderateUser(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    logger.info(`User ${userId} status changed to ${status}`);
    return user;
  }

  /**
   * Approve or reject restaurant
   */
  static async moderateRestaurant(
    restaurantId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL'
  ) {
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status },
    });

    logger.info(`Restaurant ${restaurantId} status changed to ${status}`);
    return restaurant;
  }
}
