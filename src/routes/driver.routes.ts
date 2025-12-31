/**
 * Driver Routes
 */

import { Router } from 'express';
import { DriverController } from '@/controllers/driver.controller';
import { authenticate, authorize } from '@/middlewares/auth';

const router = Router();

// All routes require authentication as DRIVER
router.use(authenticate);
router.use(authorize('DRIVER'));

router.post('/complete-registration', DriverController.completeRegistration);
router.get('/profile', DriverController.getProfile);
router.put('/status', DriverController.updateStatus);
router.get('/deliveries', DriverController.getDeliveries);
router.get('/earnings', DriverController.getEarnings);

export default router;
