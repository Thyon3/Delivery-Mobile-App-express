/**
 * Export Service
 * Handles data export functionality for reports
 */

import prisma from '@/config/database';
import logger from '@/utils/logger';

export class ExportService {
  /**
   * Export orders to CSV
   */
  static async exportOrders(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    restaurantId?: string;
  }): Promise<string> {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    const orders = await prisma.order.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV
    const headers = [
      'Order Number',
      'Status',
      'Customer',
      'Restaurant',
      'Total Amount',
      'Payment Method',
      'Created At',
    ];

    const rows = orders.map((order) => [
      order.orderNumber,
      order.status,
      `${order.customer.firstName} ${order.customer.lastName}`,
      order.restaurant.name,
      order.totalAmount.toString(),
      order.paymentMethod,
      order.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    logger.info(`Exported ${orders.length} orders to CSV`);
    return csv;
  }

  /**
   * Export revenue report
   */
  static async exportRevenueReport(startDate: Date, endDate: Date): Promise<string> {
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        restaurant: {
          select: { name: true },
        },
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.totalAmount);
    });

    // Generate CSV
    const headers = ['Date', 'Revenue', 'Orders Count'];
    const rows = Object.entries(revenueByDate).map(([date, revenue]) => {
      const count = orders.filter((o) => o.createdAt.toISOString().split('T')[0] === date).length;
      return [date, revenue.toFixed(2), count.toString()];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    logger.info('Revenue report exported');
    return csv;
  }

  /**
   * Export restaurant performance
   */
  static async exportRestaurantPerformance(restaurantId: string, days: number = 30): Promise<string> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
      },
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    const headers = ['Order Number', 'Status', 'Amount', 'Created At', 'Delivered At', 'Delivery Time (min)'];
    
    const rows = orders.map((order) => {
      const deliveryTime = order.deliveredAt && order.createdAt
        ? Math.round((order.deliveredAt.getTime() - order.createdAt.getTime()) / 60000)
        : 'N/A';
      
      return [
        order.orderNumber,
        order.status,
        order.totalAmount.toString(),
        order.createdAt.toISOString(),
        order.deliveredAt?.toISOString() || 'N/A',
        deliveryTime.toString(),
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    logger.info(`Exported restaurant performance for ${restaurantId}`);
    return csv;
  }
}
