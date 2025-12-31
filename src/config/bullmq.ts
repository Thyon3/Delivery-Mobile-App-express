/**
 * BullMQ Queue Configuration for Background Jobs
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import logger from '@/utils/logger';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// =============================================
// Queue Definitions
// =============================================

export const emailQueue = new Queue('email', { connection });
export const smsQueue = new Queue('sms', { connection });
export const paymentQueue = new Queue('payment', { connection });
export const notificationQueue = new Queue('notification', { connection });
export const orderQueue = new Queue('order', { connection });

// =============================================
// Queue Event Listeners
// =============================================

const setupQueueEvents = (queueName: string) => {
  const queueEvents = new QueueEvents(queueName, { connection });

  queueEvents.on('completed', ({ jobId }) => {
    logger.info(`Job ${jobId} in queue ${queueName} completed`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job ${jobId} in queue ${queueName} failed: ${failedReason}`);
  });
};

// Setup events for all queues
setupQueueEvents('email');
setupQueueEvents('sms');
setupQueueEvents('payment');
setupQueueEvents('notification');
setupQueueEvents('order');

// =============================================
// Job Helpers
// =============================================

export class JobService {
  static async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    await emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  static async addSMSJob(data: { to: string; message: string }) {
    await smsQueue.add('send-sms', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });
  }

  static async addNotificationJob(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    await notificationQueue.add('send-notification', data, {
      attempts: 2,
    });
  }

  static async addPaymentJob(data: { orderId: string; paymentId: string }) {
    await paymentQueue.add('process-payment', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    });
  }

  static async addOrderJob(data: { orderId: string; action: string }) {
    await orderQueue.add('process-order', data, {
      attempts: 3,
    });
  }
}

logger.info('✅ BullMQ queues initialized');
