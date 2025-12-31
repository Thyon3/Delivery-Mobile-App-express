/**
 * Notification Service
 * Handles in-app notifications
 */

import prisma from '@/config/database';
import logger from '@/utils/logger';

export class NotificationService {
  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    filters?: {
      isRead?: boolean;
      type?: string;
      limit?: number;
    }
  ) {
    const where: any = { userId };
    
    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    logger.info(`All notifications marked as read for user: ${userId}`);
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    logger.info(`Notification deleted: ${notificationId}`);
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }
}
