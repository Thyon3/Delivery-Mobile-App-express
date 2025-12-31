/**
 * Promotion Routes
 */

import { Router } from 'express';
import { PromotionController } from '@/controllers/promotion.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Public routes
router.get('/active', PromotionController.getActivePromotions);

// Protected routes
router.post('/validate', authenticate, PromotionController.validatePromotion);

// Admin only
router.post('/', authenticate, authorize('ADMIN'), PromotionController.createPromotion);

export default router;
