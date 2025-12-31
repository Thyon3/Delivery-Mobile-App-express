/**
 * Authentication Controller
 */

import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';
import { BadRequestError } from '@/utils/errors/AppError';

export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Register a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               phone:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [CUSTOMER, DRIVER, RESTAURANT_OWNER]
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    return ResponseHelper.created(res, result, 'User registered successfully');
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: Login user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return ResponseHelper.success(res, result, 'Login successful');
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags: [Authentication]
   *     summary: Refresh access token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BadRequestError('Refresh token required');
    }

    const result = await AuthService.refreshAccessToken(refreshToken);
    return ResponseHelper.success(res, result, 'Token refreshed successfully');
  });

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: Logout user
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    return ResponseHelper.success(res, null, 'Logout successful');
  });

  /**
   * @swagger
   * /auth/send-email-otp:
   *   post:
   *     tags: [Authentication]
   *     summary: Send OTP for email verification
   */
  static sendEmailOTP = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { email } = req.body;

    await AuthService.sendEmailOTP(userId, email);
    return ResponseHelper.success(res, null, 'OTP sent to email');
  });

  /**
   * @swagger
   * /auth/verify-email:
   *   post:
   *     tags: [Authentication]
   *     summary: Verify email with OTP
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { otp } = req.body;

    await AuthService.verifyOTP(userId, otp, 'EMAIL');
    return ResponseHelper.success(res, null, 'Email verified successfully');
  });

  /**
   * @swagger
   * /auth/send-phone-otp:
   *   post:
   *     tags: [Authentication]
   *     summary: Send OTP for phone verification
   */
  static sendPhoneOTP = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { phone } = req.body;

    await AuthService.sendPhoneOTP(userId, phone);
    return ResponseHelper.success(res, null, 'OTP sent to phone');
  });

  /**
   * @swagger
   * /auth/verify-phone:
   *   post:
   *     tags: [Authentication]
   *     summary: Verify phone with OTP
   */
  static verifyPhone = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { otp } = req.body;

    await AuthService.verifyOTP(userId, otp, 'PHONE');
    return ResponseHelper.success(res, null, 'Phone verified successfully');
  });
}
