/**
 * Restaurant Routes
 */

import { Router } from 'express';
import { RestaurantController } from '@/controllers/restaurant.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Public routes
router.get('/nearby', RestaurantController.getNearbyRestaurants);
router.get('/:id', RestaurantController.getRestaurantById);

// Protected routes - Restaurant Owner
router.post('/', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.createRestaurant);
router.put('/:id', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.updateRestaurant);
router.post('/:id/categories', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.createCategory);
router.post('/:id/menu-items', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.createMenuItem);
router.get('/:id/orders', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.getRestaurantOrders);
router.get('/:id/stats', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.getRestaurantStats);

// Menu item routes
router.put('/menu-items/:id', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.updateMenuItem);
router.delete('/menu-items/:id', authenticate, authorize('RESTAURANT_OWNER', 'ADMIN'), RestaurantController.deleteMenuItem);

export default router;
