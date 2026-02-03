# Background Jobs - Marketing Dashboard

This directory contains background job workers for the Marketing ROI Dashboard.

## 🎯 Overview

We use **BullMQ** for reliable background job processing with Redis as the message broker.

## 📋 Job Types

### Data Sync Jobs

1. **SYNC_GOOGLE_ADS** - Sync Google Ads campaigns and metrics
2. **SYNC_META** - Sync Meta (Facebook/Instagram) campaigns and metrics  
3. **SYNC_SHOPIFY** - Sync Shopify orders and revenue data
4. **SYNC_ALL** - Sync all active integrations for a user

## 🚀 Running Workers

### Development (with auto-reload)

```bash
npm run worker
```

### Production

```bash
npm run worker:prod
```

## 📊 Queue Configuration

- **Retry Logic:** 3 attempts with exponential backoff
- **Concurrency:** 5 jobs processed simultaneously
- **Cleanup:** Completed jobs kept for 1 hour, failed jobs for 24 hours
- **Recurring:** Sync all integrations every 6 hours

## 🔧 Implementation

### Add a Job

```typescript
import { addSyncJob } from '../lib/queue';

await addSyncJob({
  integrationId: 'integration-id',
  userId: 'user-id',
  platform: 'google-ads',
});
```

### Monitor Queue

```typescript
import { getQueueStatus } from '../lib/queue';

const status = await getQueueStatus();
console.log(status);
// { waiting: 5, active: 2, completed: 100, failed: 3 }
```

## 📝 Worker Implementation

Workers are defined in `workers/sync-worker.ts`:

- Process jobs based on job type
- Update integration sync status in database
- Call external APIs (Google Ads, Meta, Shopify)
- Store metrics in database
- Handle errors and retries

## 🔍 Monitoring

Workers log all activity:

- `🔄` Job started
- `✅` Job completed
- `❌` Job failed
- `📋` Job processing

## 🐛 Debugging

View queue in Redis:

```bash
redis-cli
KEYS bull:data-sync:*
```

Clear queue (development only):

```typescript
import { clearQueue } from '../lib/queue';
await clearQueue();
```

## ⚙️ Environment Variables

```env
REDIS_URL=redis://localhost:6379
```

## 📚 Learn More

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
