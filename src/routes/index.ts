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
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import searchRoutes from './search.routes';
import uploadRoutes from './upload.routes';
import promotionRoutes from './promotion.routes';
import favoriteRoutes from './favorite.routes';
import adminRoutes from './admin.routes';
import statsRoutes from './stats.routes';

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
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);
router.use('/promotions', promotionRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

export default router;
