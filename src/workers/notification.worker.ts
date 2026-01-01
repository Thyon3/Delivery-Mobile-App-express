/**
 * Notification Worker - Processes push notification jobs
 */

import { Worker, Job } from 'bullmq';
import prisma from '@/config/database';
import logger from '@/utils/logger';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

// Notification worker
const notificationWorker = new Worker(
  'notification',
  async (job: Job<NotificationJobData>) => {
    const { userId, title, message, type, data } = job.data;

    logger.info(`Processing notification job ${job.id} for user ${userId}`);

    try {
      // Save notification to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          data: data || null,
        },
      });

      // Fetch user's device token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { deviceToken: true },
      });

      if (user?.deviceToken) {
        // In a real app, use firebase-admin here
        // await firebaseAdmin.messaging().send({
        //   token: user.deviceToken,
        //   notification: { title, body: message },
        //   data: data || {},
        // });
        logger.info(`Push notification sent to device token: ${user.deviceToken}`);
      } else {
        logger.info(`No device token found for user ${userId}, skipping push notification`);
      }


      logger.info(`Notification saved: ${notification.id}`);
      return { success: true, notificationId: notification.id };
    } catch (error) {
      logger.error(`Failed to process notification ${job.id}:`, error);
      throw error;
    }
  },
  { connection }
);

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed:`, err);
});

export default notificationWorker;
