/**
 * Payment Routes
 */

import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { authenticate } from '@/middlewares/auth';
import { paymentLimiter } from '@/middlewares/rateLimiter';

const router = Router();

// Webhook route (no authentication - verified by Stripe signature)
router.post('/webhook', PaymentController.handleWebhook);

// Protected routes
router.post('/create-intent', authenticate, paymentLimiter, PaymentController.createPaymentIntent);
router.post('/cash', authenticate, PaymentController.processCashPayment);
router.post('/refund', authenticate, PaymentController.processRefund);
router.post('/wallet/add', authenticate, PaymentController.addToWallet);

export default router;
