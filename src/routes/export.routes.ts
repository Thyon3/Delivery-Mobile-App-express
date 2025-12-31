/**
 * Export Routes
 */

import { Router } from 'express';
import { ExportController } from '@/controllers/export.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Admin and Restaurant Owner routes
router.get(
  '/orders',
  authenticate,
  authorize('ADMIN', 'RESTAURANT_OWNER'),
  ExportController.exportOrders
);

router.get(
  '/revenue',
  authenticate,
  authorize('ADMIN'),
  ExportController.exportRevenue
);

router.get(
  '/restaurant/:restaurantId/performance',
  authenticate,
  authorize('ADMIN', 'RESTAURANT_OWNER'),
  ExportController.exportRestaurantPerformance
);

export default router;
