/**
 * Statistics Routes
 */

import { Router } from 'express';
import { StatsController } from '@/controllers/stats.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer stats
router.get('/customer', StatsController.getCustomerStats);

// Restaurant stats (Restaurant owner or admin)
router.get(
  '/restaurant/:restaurantId',
  authorize('RESTAURANT_OWNER', 'ADMIN'),
  StatsController.getRestaurantPerformance
);

// Driver stats (Driver or admin)
router.get(
  '/driver/:driverId',
  authorize('DRIVER', 'ADMIN'),
  StatsController.getDriverPerformance
);

export default router;
