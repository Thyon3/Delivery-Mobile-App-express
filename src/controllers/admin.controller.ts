/**
 * Admin Controller
 */

import { Request, Response } from 'express';
import { AdminService } from '@/services/admin.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const stats = await AdminService.getDashboardStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    return ResponseHelper.success(res, stats, 'Dashboard stats fetched successfully');
  });

  /**
   * Get recent users
   */
  static getRecentUsers = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const users = await AdminService.getRecentUsers(
      limit ? parseInt(limit as string) : undefined
    );

    return ResponseHelper.success(res, users, 'Recent users fetched successfully');
  });

  /**
   * Get recent orders
   */
  static getRecentOrders = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const orders = await AdminService.getRecentOrders(
      limit ? parseInt(limit as string) : undefined
    );

    return ResponseHelper.success(res, orders, 'Recent orders fetched successfully');
  });

  /**
   * Get revenue by date range
   */
  static getRevenue = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return ResponseHelper.error(res, 'Start date and end date are required', 400);
    }

    const revenue = await AdminService.getRevenueByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return ResponseHelper.success(res, revenue, 'Revenue data fetched successfully');
  });

  /**
   * Get user activity
   */
  static getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query;

    const activity = await AdminService.getUserActivity(
      days ? parseInt(days as string) : undefined
    );

    return ResponseHelper.success(res, activity, 'User activity fetched successfully');
  });

  /**
   * Moderate user
   */
  static moderateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await AdminService.moderateUser(userId, status);

    return ResponseHelper.success(res, user, 'User moderated successfully');
  });

  /**
   * Moderate restaurant
   */
  static moderateRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const { status } = req.body;

    const restaurant = await AdminService.moderateRestaurant(restaurantId, status);

    return ResponseHelper.success(res, restaurant, 'Restaurant moderated successfully');
  });
}
