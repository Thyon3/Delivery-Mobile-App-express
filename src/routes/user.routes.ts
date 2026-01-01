/**
 * User Routes
 */

import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.get('/addresses', UserController.getAddresses);
router.post('/addresses', UserController.createAddress);
router.delete('/addresses/:id', UserController.deleteAddress);
router.post('/device-token', UserController.saveDeviceToken);
router.get('/wallet/balance', UserController.getWalletBalance);
router.get('/wallet/transactions', UserController.getWalletTransactions);

export default router;
