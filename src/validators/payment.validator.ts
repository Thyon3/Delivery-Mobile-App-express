/**
 * Payment Validators using Zod
 */

import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export const processCashPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
  }),
});

export const processRefundSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    reason: z.string().optional(),
  }),
});

export const addToWalletSchema = z.object({
  body: z.object({
    amount: z.number().min(1, 'Amount must be at least 1'),
    description: z.string().min(1, 'Description is required'),
  }),
});
