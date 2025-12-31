/**
 * Order Routes
 */

import { Router } from 'express';
import { OrderController } from '@/controllers/order.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { orderLimiter } from '@/middlewares/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', orderLimiter, OrderController.createOrder);
router.get('/my-orders', OrderController.getUserOrders);
router.get('/:id', OrderController.getOrderById);
router.put('/:id/status', authorize('DRIVER', 'RESTAURANT_OWNER', 'ADMIN'), OrderController.updateOrderStatus);
router.post('/:id/cancel', OrderController.cancelOrder);

export default router;
