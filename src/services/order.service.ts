/**
 * Order Service - State Machine Implementation
 * Handles order lifecycle with transaction support and race condition prevention
 */

import prisma from '@/config/database';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ConflictError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';
import { GeolocationService } from './geolocation.service';
import { JobService } from '@/config/bullmq';

export class OrderService {
  // Define valid state transitions
  private static readonly STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    PREPARING: [OrderStatus.READY_FOR_PICKUP], // Cannot cancel once preparing
    READY_FOR_PICKUP: [OrderStatus.OUT_FOR_DELIVERY],
    OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    DELIVERED: [OrderStatus.REFUNDED],
    CANCELLED: [], // Terminal state
    REFUNDED: [], // Terminal state
  };

  /**
   * Create a new order with transaction and optimistic locking
   */
  static async createOrder(data: {
    customerId: string;
    restaurantId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      addons?: any;
    }>;
    deliveryAddressId: string;
    paymentMethod: PaymentMethod;
    specialInstructions?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Validate restaurant
      const restaurant = await tx.restaurant.findUnique({
        where: { id: data.restaurantId },
        select: {
          id: true,
          name: true,
          status: true,
          isOpen: true,
          latitude: true,
          longitude: true,
          deliveryFee: true,
          minimumOrder: true,
          estimatedDeliveryTime: true,
        },
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant not found');
      }

      if (restaurant.status !== 'ACTIVE' || !restaurant.isOpen) {
        throw new BadRequestError('Restaurant is not accepting orders');
      }

      // Validate and calculate order totals
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of data.items) {
        const menuItem = await tx.menuItem.findUnique({
          where: { id: item.menuItemId },
          include: { addons: true },
        });

        if (!menuItem) {
          throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
        }

        if (!menuItem.isAvailable) {
          throw new BadRequestError(`${menuItem.name} is not available`);
        }

        const itemPrice = Number(menuItem.discountPrice || menuItem.price);
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: itemPrice,
          addons: item.addons || null,
        });
      }

      // Get delivery address
      const address = await tx.address.findUnique({
        where: { id: data.deliveryAddressId },
      });

      if (!address) {
        throw new NotFoundError('Delivery address not found');
      }

      // Calculate distance and delivery fee
      const distance = GeolocationService.calculateDistance(
        Number(restaurant.latitude),
        Number(restaurant.longitude),
        Number(address.latitude),
        Number(address.longitude)
      );

      const deliveryFee = GeolocationService.calculateDeliveryFee(distance);

      // Check minimum order
      if (subtotal < Number(restaurant.minimumOrder)) {
        throw new BadRequestError(
          `Minimum order amount is ${restaurant.minimumOrder}`
        );
      }

      // Calculate tax (assuming 10%)
      const tax = subtotal * 0.1;
      const totalAmount = subtotal + deliveryFee + tax;

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          restaurantId: data.restaurantId,
          status: OrderStatus.PENDING,
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          specialInstructions: data.specialInstructions,
          version: 0, // Optimistic locking
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      });

      // Create delivery record
      await tx.delivery.create({
        data: {
          orderId: order.id,
          pickupLatitude: restaurant.latitude,
          pickupLongitude: restaurant.longitude,
          deliveryLatitude: address.latitude,
          deliveryLongitude: address.longitude,
          distance,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING,
          notes: 'Order created',
        },
      });

      // Send notifications
      await JobService.addNotificationJob({
        userId: data.customerId,
        title: 'Order Placed',
        message: `Your order #${orderNumber} has been placed successfully`,
        type: 'ORDER_UPDATE',
        data: { orderId: order.id },
      });

      logger.info(`Order created: ${orderNumber}`);

      return order;
    });
  }

  /**
   * Update order status with state machine validation
   * Uses optimistic locking to prevent race conditions
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    notes?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get current order with lock (FOR UPDATE)
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          customer: true,
          delivery: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Validate state transition
      const allowedTransitions = this.STATE_TRANSITIONS[order.status];
      if (!allowedTransitions.includes(newStatus)) {
        throw new BadRequestError(
          `Cannot transition from ${order.status} to ${newStatus}`
        );
      }

      // Optimistic locking check
      const currentVersion = order.version;

      // Update order with version increment
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: orderId,
          version: currentVersion, // Only update if version matches
        },
        data: {
          status: newStatus,
          version: { increment: 1 },
          ...(newStatus === OrderStatus.ACCEPTED && { acceptedAt: new Date() }),
          ...(newStatus === OrderStatus.PREPARING && { preparingAt: new Date() }),
          ...(newStatus === OrderStatus.READY_FOR_PICKUP && { readyAt: new Date() }),
          ...(newStatus === OrderStatus.OUT_FOR_DELIVERY && { pickedUpAt: new Date() }),
          ...(newStatus === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
          ...(newStatus === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
        },
      });

      // Check if update was successful (optimistic lock)
      if (updatedOrder.count === 0) {
        throw new ConflictError(
          'Order was modified by another process. Please retry.'
        );
      }

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          notes: notes || `Order status updated to ${newStatus}`,
        },
      });

      // Handle specific status transitions
      if (newStatus === OrderStatus.READY_FOR_PICKUP) {
        // Assign driver when ready for pickup
        await this.assignDriver(tx, orderId, order);
      }

      if (newStatus === OrderStatus.DELIVERED) {
        // Update payment status
        await tx.payment.updateMany({
          where: { orderId },
          data: { status: PaymentStatus.COMPLETED },
        });

        // Update customer total orders
        await tx.customer.update({
          where: { userId: order.customerId },
          data: { totalOrders: { increment: 1 } },
        });
      }

      // Send notifications
      await this.sendOrderNotification(order, newStatus);

      logger.info(`Order ${order.orderNumber} status updated to ${newStatus}`);

      return tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { menuItem: true },
          },
          restaurant: true,
          delivery: {
            include: { driver: true },
          },
        },
      });
    });
  }

  /**
   * Assign driver to order (prevents race conditions)
   */
  private static async assignDriver(tx: any, orderId: string, order: any) {
    const delivery = order.delivery;

    if (!delivery) {
      throw new BadRequestError('Delivery record not found');
    }

    // Find nearby available drivers
    const drivers = await GeolocationService.findNearbyDrivers(
      Number(delivery.pickupLatitude),
      Number(delivery.pickupLongitude),
      5 // 5km radius
    );

    if (drivers.length === 0) {
      logger.warn(`No drivers available for order ${order.orderNumber}`);
      // Queue job to retry driver assignment
      await JobService.addOrderJob({
        orderId,
        action: 'RETRY_DRIVER_ASSIGNMENT',
      });
      return;
    }

    // Try to assign to the first available driver with transaction lock
    for (const driver of drivers) {
      try {
        // Lock driver record to prevent race condition
        const lockedDriver = await tx.driver.findFirst({
          where: {
            id: driver.id,
            isAvailable: true,
            status: 'ONLINE',
          },
        });

        if (!lockedDriver) continue;

        // Update driver availability
        await tx.driver.update({
          where: { id: driver.id },
          data: {
            isAvailable: false,
            status: 'BUSY',
          },
        });

        // Assign driver to delivery
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            driverId: driver.id,
            assignedAt: new Date(),
          },
        });

        // Notify driver
        await JobService.addNotificationJob({
          userId: lockedDriver.userId,
          title: 'New Delivery',
          message: `You have been assigned to order #${order.orderNumber}`,
          type: 'ORDER_UPDATE',
          data: { orderId, deliveryId: delivery.id },
        });

        logger.info(`Driver ${driver.id} assigned to order ${order.orderNumber}`);
        break;
      } catch (error) {
        // If driver was taken by another process, try next driver
        logger.warn(`Failed to assign driver ${driver.id}: ${error}`);
        continue;
      }
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    orderId: string,
    userId: string,
    reason: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Cannot cancel if preparing or later
      if (
        order.status === OrderStatus.PREPARING ||
        order.status === OrderStatus.READY_FOR_PICKUP ||
        order.status === OrderStatus.OUT_FOR_DELIVERY ||
        order.status === OrderStatus.DELIVERED
      ) {
        throw new BadRequestError(
          'Cannot cancel order after restaurant has started preparing'
        );
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          notes: `Cancelled: ${reason}`,
        },
      });

      // Initiate refund if payment was completed
      if (order.paymentStatus === PaymentStatus.COMPLETED) {
        await JobService.addPaymentJob({
          orderId,
          paymentId: order.id,
        });
      }

      logger.info(`Order ${order.orderNumber} cancelled`);

      return updatedOrder;
    });
  }

  /**
   * Send order notifications
   */
  private static async sendOrderNotification(order: any, status: OrderStatus) {
    const messages: Record<OrderStatus, string> = {
      PENDING: 'Your order has been placed',
      ACCEPTED: 'Your order has been accepted',
      PREPARING: 'Restaurant is preparing your order',
      READY_FOR_PICKUP: 'Your order is ready for pickup',
      OUT_FOR_DELIVERY: 'Your order is out for delivery',
      DELIVERED: 'Your order has been delivered',
      CANCELLED: 'Your order has been cancelled',
      REFUNDED: 'Your order has been refunded',
    };

    await JobService.addNotificationJob({
      userId: order.customerId,
      title: 'Order Update',
      message: messages[status],
      type: 'ORDER_UPDATE',
      data: { orderId: order.id },
    });
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            logo: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
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
        payment: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  /**
   * Get orders for a user
   */
  static async getUserOrders(
    userId: string,
    filters?: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { customerId: userId };
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
          restaurant: {
            select: {
              id: true,
              name: true,
              logo: true,
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
}
