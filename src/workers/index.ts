/**
 * Worker Entry Point
 * Run this file separately to start background job workers
 */

import dotenv from 'dotenv';
import logger from '@/utils/logger';
import emailWorker from './email.worker';
import smsWorker from './sms.worker';
import notificationWorker from './notification.worker';

// Load environment variables
dotenv.config();

logger.info('Starting background workers...');

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down workers...`);

  await emailWorker.close();
  await smsWorker.close();
  await notificationWorker.close();

  logger.info('All workers closed');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('✅ All workers started successfully');
