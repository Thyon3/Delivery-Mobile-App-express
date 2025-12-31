/**
 * Metrics Controller
 * Exposes application metrics for monitoring
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';
import { metrics } from '@/utils/metrics';
import { getQueueStats } from '@/utils/queue';
import { emailQueue, smsQueue, notificationQueue, orderQueue, paymentQueue } from '@/config/bullmq';

export class MetricsController {
  /**
   * Get application metrics
   */
  static getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const appMetrics = metrics.getAllMetrics();
    
    // Get queue stats
    const [emailStats, smsStats, notificationStats, orderStats, paymentStats] = await Promise.all([
      getQueueStats(emailQueue),
      getQueueStats(smsQueue),
      getQueueStats(notificationQueue),
      getQueueStats(orderQueue),
      getQueueStats(paymentQueue),
    ]);

    const data = {
      app: appMetrics,
      queues: {
        email: emailStats,
        sms: smsStats,
        notification: notificationStats,
        order: orderStats,
        payment: paymentStats,
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    return ResponseHelper.success(res, data, 'Metrics fetched successfully');
  });
}
