/**
 * Export Controller
 */

import { Request, Response } from 'express';
import { ExportService } from '@/services/export.service';
import { asyncHandler } from '@/utils/asyncHandler';

export class ExportController {
  /**
   * Export orders
   */
  static exportOrders = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status, restaurantId } = req.query;

    const csv = await ExportService.exportOrders({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      restaurantId: restaurantId as string,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  });

  /**
   * Export revenue report
   */
  static exportRevenue = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const csv = await ExportService.exportRevenueReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.csv');
    res.send(csv);
  });

  /**
   * Export restaurant performance
   */
  static exportRestaurantPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const { days } = req.query;

    const csv = await ExportService.exportRestaurantPerformance(
      restaurantId,
      days ? parseInt(days as string) : undefined
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=restaurant-${restaurantId}-performance.csv`);
    res.send(csv);
  });
}
