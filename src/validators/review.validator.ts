/**
 * Review Validators using Zod
 */

import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid('Invalid restaurant ID'),
    orderId: z.string().uuid('Invalid order ID').optional(),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    comment: z.string().optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
});

export const addResponseSchema = z.object({
  body: z.object({
    restaurantId: z.string().uuid('Invalid restaurant ID'),
    response: z.string().min(1, 'Response cannot be empty'),
  }),
});
