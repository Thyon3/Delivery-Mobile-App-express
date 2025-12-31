/**
 * Notification Controller
 */

import { Request, Response } from 'express';
import { NotificationService } from '@/services/notification.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class NotificationController {
  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { isRead, type, limit } = req.query;
    
    const notifications = await NotificationService.getUserNotifications(userId, {
      isRead: isRead === 'true',
      type: type as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    
    return ResponseHelper.success(res, notifications, 'Notifications fetched successfully');
  });

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    
    await NotificationService.markAsRead(id, userId);
    return ResponseHelper.success(res, null, 'Notification marked as read');
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    
    await NotificationService.markAllAsRead(userId);
    return ResponseHelper.success(res, null, 'All notifications marked as read');
  });

  static deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    
    await NotificationService.deleteNotification(id, userId);
    return ResponseHelper.success(res, null, 'Notification deleted successfully');
  });

  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    
    const count = await NotificationService.getUnreadCount(userId);
    return ResponseHelper.success(res, { count }, 'Unread count fetched successfully');
  });
}
