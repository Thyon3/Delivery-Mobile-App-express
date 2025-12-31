/**
 * Analytics Routes
 */

import { Router } from 'express';
import { AnalyticsController } from '@/controllers/analytics.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Admin only routes
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/platform-stats', AnalyticsController.getPlatformStats);
router.get('/order-stats', AnalyticsController.getOrderStatsByStatus);
router.get('/top-restaurants', AnalyticsController.getTopRestaurants);
router.get('/revenue-trend', AnalyticsController.getRevenueTrend);

export default router;
