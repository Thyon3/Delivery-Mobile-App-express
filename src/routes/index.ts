/**
 * Main Router - Aggregates all routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import restaurantRoutes from './restaurant.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import userRoutes from './user.routes';
import driverRoutes from './driver.routes';
import reviewRoutes from './review.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/drivers', driverRoutes);
router.use('/reviews', reviewRoutes);

export default router;
