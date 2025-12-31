/**
 * Review Routes
 */

import { Router } from 'express';
import { ReviewController } from '@/controllers/review.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Public routes
router.get('/restaurant/:restaurantId', ReviewController.getRestaurantReviews);

// Protected routes
router.post('/', authenticate, ReviewController.createReview);
router.put('/:id', authenticate, ReviewController.updateReview);
router.delete('/:id', authenticate, ReviewController.deleteReview);

// Restaurant owner response
router.post('/:id/response', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), ReviewController.addResponse);

export default router;
