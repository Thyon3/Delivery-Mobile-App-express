/**
 * Order Validators using Zod
 */

import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid('Invalid restaurant ID'),
    items: z.array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        addons: z.any().optional(),
      })
    ).min(1, 'At least one item is required'),
    deliveryAddressId: z.string().uuid('Invalid address ID'),
    paymentMethod: z.enum(['CARD', 'CASH', 'WALLET', 'UPI'], {
      errorMap: () => ({ message: 'Invalid payment method' }),
    }),
    specialInstructions: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING',
      'ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ], {
      errorMap: () => ({ message: 'Invalid status' }),
    }),
    notes: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Cancellation reason is required'),
  }),
});
