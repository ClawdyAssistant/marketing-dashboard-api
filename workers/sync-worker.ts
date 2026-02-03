import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../lib/prisma';
import { JobType } from '../lib/queue';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

interface SyncJobData {
  integrationId: string;
  userId: string;
  platform: 'google-ads' | 'meta' | 'shopify';
}

interface SyncAllJobData {
  userId: string;
}

/**
 * Sync Google Ads data
 */
async function syncGoogleAds(integrationId: string) {
  console.log(`🔄 Syncing Google Ads for integration ${integrationId}`);
  
  // TODO: Implement actual Google Ads API sync
  // 1. Fetch campaigns from Google Ads API
  // 2. Fetch metrics for date range
  // 3. Store in database
  
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      lastSync: new Date(),
      syncStatus: 'idle',
    },
  });
  
  console.log(`✅ Google Ads sync complete for ${integrationId}`);
}

/**
 * Sync Meta Ads data
 */
async function syncMeta(integrationId: string) {
  console.log(`🔄 Syncing Meta Ads for integration ${integrationId}`);
  
  // TODO: Implement actual Meta Marketing API sync
  // 1. Fetch campaigns from Meta
  // 2. Fetch metrics for date range
  // 3. Store in database
  
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      lastSync: new Date(),
      syncStatus: 'idle',
    },
  });
  
  console.log(`✅ Meta Ads sync complete for ${integrationId}`);
}

/**
 * Sync Shopify data
 */
async function syncShopify(integrationId: string) {
  console.log(`🔄 Syncing Shopify for integration ${integrationId}`);
  
  // TODO: Implement actual Shopify API sync
  // 1. Fetch orders from Shopify
  // 2. Calculate revenue metrics
  // 3. Store in database
  
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      lastSync: new Date(),
      syncStatus: 'idle',
    },
  });
  
  console.log(`✅ Shopify sync complete for ${integrationId}`);
}

/**
 * Sync all integrations for a user
 */
async function syncAllIntegrations(userId: string) {
  console.log(`🔄 Syncing all integrations for user ${userId}`);
  
  const integrations = await prisma.integration.findMany({
    where: userId === 'all' ? {} : { userId },
  });
  
  for (const integration of integrations) {
    if (!integration.isActive) continue;
    
    try {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { syncStatus: 'syncing' },
      });
      
      switch (integration.platform) {
        case 'google-ads':
          await syncGoogleAds(integration.id);
          break;
        case 'meta':
          await syncMeta(integration.id);
          break;
        case 'shopify':
          await syncShopify(integration.id);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to sync ${integration.platform}:`, error);
      await prisma.integration.update({
        where: { id: integration.id },
        data: { syncStatus: 'error' },
      });
    }
  }
  
  console.log(`✅ All integrations synced for user ${userId}`);
}

// Create worker
export const syncWorker = new Worker(
  'data-sync',
  async (job: Job) => {
    console.log(`📋 Processing job ${job.id} of type ${job.name}`);
    
    try {
      switch (job.name) {
        case JobType.SYNC_GOOGLE_ADS:
          const googleData = job.data as SyncJobData;
          await syncGoogleAds(googleData.integrationId);
          break;
          
        case JobType.SYNC_META:
          const metaData = job.data as SyncJobData;
          await syncMeta(metaData.integrationId);
          break;
          
        case JobType.SYNC_SHOPIFY:
          const shopifyData = job.data as SyncJobData;
          await syncShopify(shopifyData.integrationId);
          break;
          
        case JobType.SYNC_ALL:
          const syncAllData = job.data as SyncAllJobData;
          await syncAllIntegrations(syncAllData.userId);
          break;
          
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Event listeners
syncWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

syncWorker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('🚀 Sync worker started');
