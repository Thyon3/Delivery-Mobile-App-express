/**
 * SMS Worker - Processes SMS jobs from BullMQ
 */

import { Worker, Job } from 'bullmq';
import logger from '@/utils/logger';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

interface SMSJobData {
  to: string;
  message: string;
}

// SMS worker
const smsWorker = new Worker(
  'sms',
  async (job: Job<SMSJobData>) => {
    const { to, message } = job.data;

    logger.info(`Processing SMS job ${job.id}: to ${to}`);

    try {
      // TODO: Implement actual SMS sending logic
      // Using Twilio, AWS SNS, etc.
      
      // Simulate SMS sending
      await new Promise((resolve) => setTimeout(resolve, 500));

      logger.info(`SMS sent successfully: ${job.id}`);
      return { success: true, messageId: `sms_${Date.now()}` };
    } catch (error) {
      logger.error(`Failed to send SMS ${job.id}:`, error);
      throw error;
    }
  },
  { connection }
);

smsWorker.on('completed', (job) => {
  logger.info(`SMS job ${job.id} completed`);
});

smsWorker.on('failed', (job, err) => {
  logger.error(`SMS job ${job?.id} failed:`, err);
});

export default smsWorker;
