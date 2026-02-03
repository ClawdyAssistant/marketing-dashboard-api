# API Documentation - Marketing ROI Dashboard Backend

**Last Updated:** February 3, 2026  
**Version:** 1.0.0 (100% Complete)  
**Base URL:** `http://localhost:3001` (dev) | `https://api.dashboard.example.com` (prod)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Integrations](#integrations)
4. [Reports](#reports)
5. [Billing](#billing)
6. [Error Handling](#error-handling)
7. [Database Seed Data](#database-seed-data)

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
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageRoas: number;
  averageCtr: number;
  averageCpc: number;
}
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
  total: number;
}
```

### Get Daily Metrics

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
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
}>
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

### Get Integration by ID

**Endpoint:** `integrations.getById`  
**Type:** Query  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;
}
```

### Initiate OAuth Flow

**Endpoint:** `integrations.initiateOAuth`  
**Type:** Mutation  
**Auth Required:** Yes

**Input:**
```typescript
{
  platform: 'google-ads' | 'meta' | 'shopify';
  shopDomain?: string;  // Required for Shopify only
}
```

**Response:**
```typescript
{
  authUrl: string;  // Redirect user to this URL
}
```

**Example:**
```typescript
const result = await trpc.integrations.initiateOAuth.mutate({
  platform: 'google-ads'
});

// Redirect user to OAuth URL
window.location.href = result.authUrl;
```

### Disconnect Integration

**Endpoint:** `integrations.disconnect`  
**Type:** Mutation  
**Auth Required:** Yes

**Input:**
```typescript
{
  id: string;
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
  id: string;
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
  id: string;
}
```

### Generate New Report

**Endpoint:** `reports.generate`  
**Type:** Mutation  
**Auth Required:** Yes

**Description:** Generates a report with AI-powered insights using Claude 3.5 Sonnet.

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
  insights: {
    summary: string;
    performance_analysis: {
      best_performers: Array<{
        campaign: string;
        reason: string;
      }>;
      underperformers: Array<{
        campaign: string;
        issues: string[];
      }>;
    };
    optimization_suggestions: Array<{
      campaign: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
      expected_impact: string;
    }>;
    trends: {
      spend_trend: string;
      revenue_trend: string;
      roas_trend: string;
    };
    recommendations: string[];
  } | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Generate PDF

**Endpoint:** `reports.generatePDF`  
**Type:** Mutation  
**Auth Required:** Yes

**Description:** Generates a PDF version of the report using Puppeteer.

**Input:**
```typescript
{
  reportId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  pdfUrl: string;  // Base64 data URL (production: S3 URL)
}
```

**Example:**
```typescript
// Generate report first
const report = await trpc.reports.generate.mutate({
  name: 'Monthly Report',
  dateRange: {
    start: '2026-01-01',
    end: '2026-01-31'
  }
});

// Then generate PDF
const pdf = await trpc.reports.generatePDF.mutate({
  reportId: report.id
});

// Download PDF
const link = document.createElement('a');
link.href = pdf.pdfUrl;
link.download = 'report.pdf';
link.click();
```

---

## 💳 Billing

### Get Pricing Plans

**Endpoint:** `billing.getPlans`  
**Type:** Query  
**Auth Required:** Yes

**Response:**
```typescript
Array<{
  id: 'FREE' | 'STARTER' | 'PRO';
  name: string;
  price: number;  // Monthly price in cents
  features: string[];
}>
```

**Plans:**
- **Free:** $0/month - Up to 2 integrations
- **Starter:** $49/month - Up to 5 integrations, auto-sync
- **Pro:** $199/month - Unlimited integrations, AI insights, API access

### Get Current Subscription

**Endpoint:** `billing.getSubscription`  
**Type:** Query  
**Auth Required:** Yes

**Response:**
```typescript
{
  id: string;
  userId: string;
  planId: 'FREE' | 'STARTER' | 'PRO';
  status: 'active' | 'canceled' | 'past_due';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} | null
```

### Create Checkout Session

**Endpoint:** `billing.createCheckout`  
**Type:** Mutation  
**Auth Required:** Yes

**Description:** Creates a Stripe checkout session for upgrading/subscribing.

**Input:**
```typescript
{
  planId: 'STARTER' | 'PRO';  // FREE doesn't need checkout
}
```

**Response:**
```typescript
{
  sessionId: string;
  url: string;  // Redirect user to this Stripe checkout URL
}
```

**Example:**
```typescript
const checkout = await trpc.billing.createCheckout.mutate({
  planId: 'PRO'
});

// Redirect to Stripe checkout
window.location.href = checkout.url;
```

### Create Billing Portal Session

**Endpoint:** `billing.createPortal`  
**Type:** Mutation  
**Auth Required:** Yes

**Description:** Creates a Stripe billing portal session for managing subscription.

**Response:**
```typescript
{
  url: string;  // Redirect user to Stripe billing portal
}
```

**Example:**
```typescript
const portal = await trpc.billing.createPortal.mutate();

// Redirect to Stripe portal
window.location.href = portal.url;
```

### Cancel Subscription

**Endpoint:** `billing.cancelSubscription`  
**Type:** Mutation  
**Auth Required:** Yes

**Description:** Cancels the current subscription.

**Response:**
```typescript
{
  success: boolean;
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

## 🔄 Database Seed Data

For testing, use the seed script:

```bash
npx tsx prisma/seed.ts
```

**Demo Account:**
- Email: `demo@example.com`
- Password: `password123`
- Includes: 2 integrations, 4 campaigns, 30 days of metrics

---

## 🚀 OAuth Callback URLs

Configure these URLs in your OAuth provider settings:

- **Google Ads:** `http://localhost:3001/api/oauth/google-ads/callback`
- **Meta Ads:** `http://localhost:3001/api/oauth/meta/callback`
- **Shopify:** `http://localhost:3001/api/oauth/shopify/callback`

For production, replace `localhost:3001` with your API domain.

---

## 🔧 Background Jobs

The API uses BullMQ for background data synchronization:

**Run Worker:**
```bash
npm run worker
```

**Job Types:**
- Data sync from Google Ads
- Data sync from Meta Ads
- Data sync from Shopify
- Scheduled recurring syncs (every 6 hours)

---

## 📝 Notes

- All dates should be in ISO 8601 format
- All monetary values are in USD (cents for Stripe)
- Timestamps are in UTC
- tRPC provides automatic type inference
- AI insights powered by Claude 3.5 Sonnet
- PDFs generated with Puppeteer

---

**Need help?** Check the [main README](./README.md) or contact the development team.
