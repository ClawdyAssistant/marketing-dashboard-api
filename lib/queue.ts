import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis connection
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Job Queues
export const syncQueue = new Queue('data-sync', { connection });

// Queue Events for monitoring
export const syncQueueEvents = new QueueEvents('data-sync', { connection });

// Job types
export enum JobType {
  SYNC_GOOGLE_ADS = 'sync-google-ads',
  SYNC_META = 'sync-meta',
  SYNC_SHOPIFY = 'sync-shopify',
  SYNC_ALL = 'sync-all',
}

// Job data interfaces
interface SyncJobData {
  integrationId: string;
  userId: string;
  platform: 'google-ads' | 'meta' | 'shopify';
}

interface SyncAllJobData {
  userId: string;
}

/**
 * Add a sync job to the queue
 */
export async function addSyncJob(data: SyncJobData) {
  return await syncQueue.add(JobType.SYNC_GOOGLE_ADS, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  });
}

/**
 * Add a sync all integrations job
 */
export async function addSyncAllJob(data: SyncAllJobData) {
  return await syncQueue.add(JobType.SYNC_ALL, data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

/**
 * Schedule recurring sync jobs
 */
export async function scheduleRecurringSyncs() {
  // Sync all integrations every 6 hours
  await syncQueue.add(
    JobType.SYNC_ALL,
    { userId: 'all' },
    {
      repeat: {
        pattern: '0 */6 * * *', // Every 6 hours
      },
      jobId: 'recurring-sync-all',
    }
  );
  
  console.log('✅ Scheduled recurring sync jobs');
}

/**
 * Get queue status
 */
export async function getQueueStatus() {
  const waiting = await syncQueue.getWaitingCount();
  const active = await syncQueue.getActiveCount();
  const completed = await syncQueue.getCompletedCount();
  const failed = await syncQueue.getFailedCount();
  
  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

/**
 * Clear all jobs (useful for development)
 */
export async function clearQueue() {
  await syncQueue.drain();
  await syncQueue.clean(0, 1000, 'completed');
  await syncQueue.clean(0, 1000, 'failed');
  console.log('✅ Queue cleared');
}
