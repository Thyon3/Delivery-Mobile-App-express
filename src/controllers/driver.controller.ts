/**
 * Driver Controller
 */

import { Request, Response } from 'express';
import { DriverService } from '@/services/driver.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class DriverController {
  /**
   * Complete driver registration
   */
  static completeRegistration = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const driver = await DriverService.completeDriverRegistration(userId, req.body);
    return ResponseHelper.created(res, driver, 'Driver registration completed');
  });

  /**
   * Get driver profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const driver = await DriverService.getDriverProfile(userId);
    return ResponseHelper.success(res, driver, 'Driver profile fetched successfully');
  });

  /**
   * Update driver status
   */
  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { status, isAvailable } = req.body;
    const driver = await DriverService.updateDriverStatus(userId, status, isAvailable);
    return ResponseHelper.success(res, driver, 'Driver status updated successfully');
  });

  /**
   * Get driver deliveries
   */
  static getDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { status, page, limit } = req.query;
    const deliveries = await DriverService.getDriverDeliveries(userId, {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return ResponseHelper.success(res, deliveries, 'Deliveries fetched successfully');
  });

  /**
   * Get driver earnings
   */
  static getEarnings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;
    const earnings = await DriverService.getDriverEarnings(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    return ResponseHelper.success(res, earnings, 'Earnings fetched successfully');
  });
}
