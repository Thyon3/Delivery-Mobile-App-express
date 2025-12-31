/**
 * Metrics Routes
 */

import { Router } from 'express';
import { MetricsController } from '@/controllers/metrics.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// Admin only - for monitoring tools
router.get('/', authenticate, authorize('ADMIN'), MetricsController.getMetrics);

export default router;
