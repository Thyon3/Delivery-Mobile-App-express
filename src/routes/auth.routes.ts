/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.post('/send-email-otp', authenticate, AuthController.sendEmailOTP);
router.post('/verify-email', authenticate, AuthController.verifyEmail);
router.post('/send-phone-otp', authenticate, AuthController.sendPhoneOTP);
router.post('/verify-phone', authenticate, AuthController.verifyPhone);

export default router;
