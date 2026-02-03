# API Documentation - Marketing ROI Dashboard Backend

**Last Updated:** February 3, 2026  
**Version:** 0.9.0 (90% Complete)  
**Base URL:** `http://localhost:3001` (dev) | `https://api.dashboard.example.com` (prod)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Integrations](#integrations)
4. [Reports](#reports)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## 🔐 Authentication

All API endpoints (except auth endpoints) require authentication via JWT token.

### Register New User

**Endpoint:** `auth.register`  
**Type:** Mutation  
**Auth Required:** No

**Input:**
```typescript
{
  email: string;        // Valid email address
  password: string;     // Min 6 characters
  name?: string;        // Optional display name
}
```

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }
}
```

**Example:**
```typescript
const result = await trpc.auth.register.mutate({
  email: 'user@example.com',
  password: 'securepassword123',
  name: 'John Doe'
});
```

### Get Current User

**Endpoint:** `auth.me`  
**Type:** Query  
**Auth Required:** Yes

**Response:**
```typescript
{
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sign In (NextAuth)

Use NextAuth's `signIn()` method:

```typescript
import { signIn } from 'next-auth/react';

// Email/Password
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false,
});

// Google OAuth
await signIn('google', {
  callbackUrl: '/dashboard'
});
```

---

## 📊 Dashboard

### Get Overview Metrics

**Endpoint:** `dashboard.overview`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  dateRange: {
    start: string;  // ISO 8601 date
    end: string;    // ISO 8601 date
  }
}
```

**Response:**
```typescript
{
  totalSpend: number;         // Total ad spend
  totalRevenue: number;       // Total revenue generated
  totalImpressions: number;   // Total ad impressions
  totalClicks: number;        // Total clicks
  totalConversions: number;   // Total conversions
  averageRoas: number;        // Return on ad spend (revenue/spend)
  averageCtr: number;         // Click-through rate (clicks/impressions * 100)
  averageCpc: number;         // Cost per click (spend/clicks)
}
```

**Example:**
```typescript
const metrics = await trpc.dashboard.overview.useQuery({
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  }
});

console.log(`Total Revenue: $${metrics.totalRevenue}`);
console.log(`ROAS: ${metrics.averageRoas.toFixed(2)}x`);
```

### Get Campaigns List

**Endpoint:** `dashboard.campaigns`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  dateRange: {
    start: string;
    end: string;
  };
  limit?: number;    // Default: 10
  offset?: number;   // Default: 0
}
```

**Response:**
```typescript
{
  campaigns: Array<{
    id: string;
    name: string;
    platform: 'google-ads' | 'meta' | 'shopify';
    status: 'active' | 'paused' | 'ended';
    totalSpend: number;
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    roas: number;
    ctr: number;
    cpc: number;
  }>;
  total: number;  // Total count (for pagination)
}
```

**Example:**
```typescript
const { data } = trpc.dashboard.campaigns.useQuery({
  dateRange: {
    start: '2026-01-01T00:00:00Z',
    end: '2026-02-03T23:59:59Z',
  },
  limit: 20,
  offset: 0,
});

data.campaigns.forEach(campaign => {
  console.log(`${campaign.name}: ${campaign.roas.toFixed(2)}x ROAS`);
});
```

### Get Daily Metrics (for Charts)

**Endpoint:** `dashboard.dailyMetrics`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  dateRange: {
    start: string;
    end: string;
  }
}
```

**Response:**
```typescript
Array<{
  date: string;          // YYYY-MM-DD
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
}>
```

**Example:**
```typescript
const chartData = await trpc.dashboard.dailyMetrics.useQuery({
  dateRange: {
    start: '2026-01-04T00:00:00Z',
    end: '2026-02-03T00:00:00Z',
  }
});

// Use with Recharts or any charting library
```

---

## 🔗 Integrations

### List User Integrations

**Endpoint:** `integrations.list`  
**Type:** Query  
**Auth Required:** Yes

**Response:**
```typescript
Array<{
  id: string;
  userId: string;
  platform: 'google-ads' | 'meta' | 'shopify';
  accountId: string;
  accountName: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: Date | null;
  createdAt: Date;
}>
```

**Example:**
```typescript
const integrations = await trpc.integrations.list.useQuery();

integrations.forEach(integration => {
  console.log(`${integration.platform}: ${integration.isActive ? 'Active' : 'Inactive'}`);
});
```

### Get Integration by ID

**Endpoint:** `integrations.getById`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;  // Integration ID
}
```

**Response:** Same as single item from `list`

### Disconnect Integration

**Endpoint:** `integrations.disconnect`  
**Type:** Mutation  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;  // Integration ID
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

### Trigger Manual Sync

**Endpoint:** `integrations.sync`  
**Type:** Mutation  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;  // Integration ID
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 📄 Reports

### List User Reports

**Endpoint:** `reports.list`  
**Type:** Query  
**Auth Required:** Yes

**Response:**
```typescript
Array<{
  id: string;
  userId: string;
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  insights: any | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

### Get Report by ID

**Endpoint:** `reports.getById`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;  // Report ID
}
```

**Response:** Same as single item from `list`

### Generate New Report

**Endpoint:** `reports.generate`  
**Type:** Mutation  
**Auth Required:** Yes

**Input:**
```typescript
{
  name: string;
  dateRange: {
    start: string;
    end: string;
  }
}
```

**Response:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  insights: any | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ Error Handling

All tRPC endpoints return typed errors:

```typescript
try {
  const result = await trpc.dashboard.overview.query({...});
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else if (error.data?.code === 'BAD_REQUEST') {
    // Show validation error
  } else {
    // Generic error handling
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `FORBIDDEN` | User doesn't have permission |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid input data |
| `INTERNAL_SERVER_ERROR` | Server error |

---

## 🚦 Rate Limiting

**Status:** Not yet implemented

**Planned:**
- 100 requests per minute per user
- 1000 requests per hour per user
- Burst limit: 20 requests per second

---

## 🔄 Database Seed Data

For testing, use the seed script to populate the database:

```bash
npx tsx prisma/seed.ts
```

**Demo Account:**
- Email: `demo@example.com`
- Password: `password123`
- Includes: 2 integrations, 4 campaigns, 30 days of metrics

---

## 📝 Notes

- All dates should be in ISO 8601 format
- All monetary values are in USD (cents for Stripe)
- Timestamps are in UTC
- tRPC provides automatic type inference - no need for manual type definitions in the frontend

---

**Need help?** Check the [main README](./README.md) or contact the development team.
