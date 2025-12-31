/**
 * Admin Routes
 */

import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/users', AdminController.getRecentUsers);
router.get('/dashboard/orders', AdminController.getRecentOrders);
router.get('/dashboard/revenue', AdminController.getRevenue);
router.get('/dashboard/activity', AdminController.getUserActivity);

// Moderation
router.put('/users/:userId/moderate', AdminController.moderateUser);
router.put('/restaurants/:restaurantId/moderate', AdminController.moderateRestaurant);

export default router;
