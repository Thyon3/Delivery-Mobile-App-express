/**
 * Queue Utilities
 */

import { Queue } from 'bullmq';

/**
 * Get queue stats
 */
export async function getQueueStats(queue: Queue): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

/**
 * Clear completed jobs
 */
export async function clearCompletedJobs(queue: Queue): Promise<void> {
  await queue.clean(0, 1000, 'completed');
}

/**
 * Clear failed jobs
 */
export async function clearFailedJobs(queue: Queue): Promise<void> {
  await queue.clean(0, 1000, 'failed');
}

/**
 * Retry failed jobs
 */
export async function retryFailedJobs(queue: Queue): Promise<void> {
  const failed = await queue.getFailed();
  
  for (const job of failed) {
    await job.retry();
  }
}

/**
 * Pause queue
 */
export async function pauseQueue(queue: Queue): Promise<void> {
  await queue.pause();
}

/**
 * Resume queue
 */
export async function resumeQueue(queue: Queue): Promise<void> {
  await queue.resume();
}
