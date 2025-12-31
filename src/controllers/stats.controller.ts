/**
 * Statistics Controller
 */

import { Request, Response } from 'express';
import { StatsService } from '@/services/stats.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class StatsController {
  /**
   * Get restaurant performance
   */
  static getRestaurantPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const { days } = req.query;

    const stats = await StatsService.getRestaurantPerformance(
      restaurantId,
      days ? parseInt(days as string) : undefined
    );

    return ResponseHelper.success(res, stats, 'Restaurant stats fetched successfully');
  });

  /**
   * Get driver performance
   */
  static getDriverPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = req.params;
    const { days } = req.query;

    const stats = await StatsService.getDriverPerformance(
      driverId,
      days ? parseInt(days as string) : undefined
    );

    return ResponseHelper.success(res, stats, 'Driver stats fetched successfully');
  });

  /**
   * Get customer stats
   */
  static getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const stats = await StatsService.getCustomerStats(userId);

    return ResponseHelper.success(res, stats, 'Customer stats fetched successfully');
  });
}
