/**
 * User Controller
 */

import { Request, Response } from 'express';
import { UserService } from '@/services/user.service';
import { GeolocationService } from '@/services/geolocation.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class UserController {
  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await UserService.getUserProfile(userId);
    return ResponseHelper.success(res, user, 'Profile fetched successfully');
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await UserService.updateUserProfile(userId, req.body);
    return ResponseHelper.success(res, user, 'Profile updated successfully');
  });

  /**
   * Get user addresses
   */
  static getAddresses = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const addresses = await UserService.getUserAddresses(userId);
    return ResponseHelper.success(res, addresses, 'Addresses fetched successfully');
  });

  /**
   * Create user address
   */
  static createAddress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const address = await GeolocationService.createAddress({
      userId,
      ...req.body,
    });
    return ResponseHelper.created(res, address, 'Address created successfully');
  });

  /**
   * Delete address
   */
  static deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await UserService.deleteAddress(id);
    return ResponseHelper.success(res, null, 'Address deleted successfully');
  });

  /**
   * Get wallet balance
   */
  static getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const balance = await UserService.getWalletBalance(userId);
    return ResponseHelper.success(res, { balance }, 'Balance fetched successfully');
  });

  /**
   * Get wallet transactions
   */
  static getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { limit } = req.query;
    const transactions = await UserService.getWalletTransactions(
      userId,
      limit ? parseInt(limit as string) : undefined
    );
    return ResponseHelper.success(res, transactions, 'Transactions fetched successfully');
  });

  /**
   * Save device token
   */
  static saveDeviceToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { token } = req.body;

    if (!token) {
      return ResponseHelper.error(res, 'Device token is required', 400);
    }

    await UserService.saveDeviceToken(userId, token);
    return ResponseHelper.success(res, null, 'Device token saved successfully');
  });
}
