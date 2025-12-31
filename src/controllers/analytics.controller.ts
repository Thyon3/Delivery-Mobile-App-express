/**
 * Analytics Controller
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '@/services/analytics.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class AnalyticsController {
  static getPlatformStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const stats = await AnalyticsService.getPlatformStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    
    return ResponseHelper.success(res, stats, 'Platform stats fetched successfully');
  });

  static getOrderStatsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const stats = await AnalyticsService.getOrderStatsByStatus({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    
    return ResponseHelper.success(res, stats, 'Order stats fetched successfully');
  });

  static getTopRestaurants = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    
    const restaurants = await AnalyticsService.getTopRestaurants(
      limit ? parseInt(limit as string) : undefined
    );
    
    return ResponseHelper.success(res, restaurants, 'Top restaurants fetched successfully');
  });

  static getRevenueTrend = asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query;
    
    const trend = await AnalyticsService.getRevenueTrend(
      days ? parseInt(days as string) : undefined
    );
    
    return ResponseHelper.success(res, trend, 'Revenue trend fetched successfully');
  });
}
