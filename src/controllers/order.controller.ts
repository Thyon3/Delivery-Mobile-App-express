/**
 * Order Controller
 */

import { Request, Response } from 'express';
import { OrderService } from '@/services/order.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  /**
   * @swagger
   * /orders:
   *   post:
   *     tags: [Orders]
   *     summary: Create a new order
   */
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.userId!;

    const order = await OrderService.createOrder({
      customerId,
      ...req.body,
    });

    return ResponseHelper.created(res, order, 'Order created successfully');
  });

  /**
   * @swagger
   * /orders/{id}:
   *   get:
   *     tags: [Orders]
   *     summary: Get order by ID
   */
  static getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await OrderService.getOrderById(id);
    return ResponseHelper.success(res, order, 'Order fetched successfully');
  });

  /**
   * @swagger
   * /orders/my-orders:
   *   get:
   *     tags: [Orders]
   *     summary: Get user's orders
   */
  static getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { status, page, limit } = req.query;

    const orders = await OrderService.getUserOrders(userId, {
      status: status as OrderStatus,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ResponseHelper.success(res, orders, 'Orders fetched successfully');
  });

  /**
   * @swagger
   * /orders/{id}/status:
   *   put:
   *     tags: [Orders]
   *     summary: Update order status
   */
  static updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    const { status, notes } = req.body;

    const order = await OrderService.updateOrderStatus(id, status, userId, notes);
    return ResponseHelper.success(res, order, 'Order status updated successfully');
  });

  /**
   * @swagger
   * /orders/{id}/cancel:
   *   post:
   *     tags: [Orders]
   *     summary: Cancel order
   */
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    const { reason } = req.body;

    const order = await OrderService.cancelOrder(id, userId, reason);
    return ResponseHelper.success(res, order, 'Order cancelled successfully');
  });
}
