# Marketing ROI Dashboard - Backend API

**Status:** 🚧 In Development  
**Stack:** Next.js API Routes, tRPC, PostgreSQL, Redis  
**Deployment:** Vercel (API routes)

---

## 📋 Project Overview

Backend API for the Marketing ROI Dashboard - handles authentication, data aggregation from marketing platforms, database operations, and orchestrates calls to the AI service.

### Core Responsibilities
- User authentication & session management
- OAuth integration with marketing platforms (Google Ads, Meta, Shopify)
- Data synchronization & storage (PostgreSQL)
- Caching layer (Redis/Upstash)
- Business logic & API endpoints (tRPC)
- Job queue for background tasks
- Webhook handlers for real-time updates

---

## 🏗️ Architecture Position

```
┌─────────────────────────────────────────────────┐
│         marketing-dashboard-web                 │
│              Next.js Frontend                   │
└──────────────────┬──────────────────────────────┘
                   │ tRPC calls
                   ▼
┌─────────────────────────────────────────────────┐
│      marketing-dashboard-api (THIS)             │
│         Next.js API + tRPC Backend              │
│  ┌─────────┬─────────┬─────────┬──────────┐    │
│  │  Auth   │  Data   │ OAuth   │  Jobs    │    │
│  │ (JWT)   │  Sync   │ Flows   │ (BullMQ) │    │
│  └─────────┴─────────┴─────────┴──────────┘    │
│                                                  │
│  ┌────────────────┬──────────────────────────┐  │
│  │   PostgreSQL   │       Redis/Upstash      │  │
│  │  (Supabase)    │      (Cache + Queue)     │  │
│  └────────────────┴──────────────────────────┘  │
└─────────────────────────────────────────────────┘
           │                      │
           │ HTTP requests        │ HTTP requests
           ▼                      ▼
   ┌──────────────┐      ┌───────────────────┐
   │ Google Ads   │      │ marketing-        │
   │ Meta Ads     │      │ dashboard-ai      │
   │ Shopify      │      │ (Python + Claude) │
   └──────────────┘      └───────────────────┘
```

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14 API Routes** - Serverless API endpoints
- **tRPC** - End-to-end typesafe APIs
- **TypeScript** - Type safety
- **Zod** - Runtime validation

### Database & Caching
- **PostgreSQL** - Primary database (via Supabase/Neon)
- **Prisma ORM** - Type-safe database client
- **Redis (Upstash)** - Caching + session storage
- **BullMQ** - Job queue for background tasks

### Authentication
- **NextAuth.js** - OAuth providers
- **JWT** - Token-based auth
- **bcrypt** - Password hashing

### External API Integration
- **Google Ads API** - Campaign data
- **Meta Marketing API** - Facebook/Instagram ads
- **Shopify Admin API** - E-commerce data
- **Stripe API** - Payments & subscriptions

### Utilities
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **Lodash** - Utility functions

---

## 📁 Project Structure

```
marketing-dashboard-api/
├── src/
│   ├── server/                # tRPC server setup
│   │   ├── routers/          # tRPC routers
│   │   │   ├── auth.ts       # Authentication endpoints
│   │   │   ├── integrations.ts  # OAuth & data sync
│   │   │   ├── dashboard.ts  # Dashboard data
│   │   │   ├── reports.ts    # Report generation
│   │   │   └── index.ts      # Root router
│   │   ├── context.ts        # tRPC context (auth, db)
│   │   └── trpc.ts           # tRPC instance
│   ├── lib/                  # Shared utilities
│   │   ├── db.ts            # Prisma client
│   │   ├── redis.ts         # Redis client
│   │   ├── queue.ts         # BullMQ setup
│   │   └── integrations/    # Integration helpers
│   │       ├── google-ads.ts
│   │       ├── meta.ts
│   │       └── shopify.ts
│   ├── jobs/                # Background jobs
│   │   ├── sync-google-ads.ts
│   │   ├── sync-meta.ts
│   │   └── sync-shopify.ts
│   ├── types/               # TypeScript types
│   └── utils/               # Helper functions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── app/
│   └── api/
│       ├── trpc/
│       │   └── [trpc]/      # tRPC handler
│       │       └── route.ts
│       └── webhooks/        # Webhook endpoints
│           ├── stripe/
│           └── integrations/
├── .env                     # Environment variables
├── .env.example            # Example env vars
├── next.config.js          # Next.js config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

---

## 🗄️ Database Schema (PostgreSQL + Prisma)

### Core Tables

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  integrations  Integration[]
  reports       Report[]
  subscription  Subscription?
}

model Integration {
  id            String    @id @default(cuid())
  userId        String
  platform      String    // 'google-ads', 'meta', 'shopify'
  accountId     String    // External account ID
  accountName   String?
  accessToken   String    @db.Text
  refreshToken  String?   @db.Text
  tokenExpiry   DateTime?
  isActive      Boolean   @default(true)
  lastSync      DateTime?
  createdAt     DateTime  @default(now())
  
  user          User      @relation(fields: [userId], references: [id])
  campaigns     Campaign[]
  
  @@unique([userId, platform, accountId])
}

model Campaign {
  id              String    @id @default(cuid())
  integrationId   String
  externalId      String    // Campaign ID from platform
  name            String
  platform        String
  status          String
  dailyBudget     Float?
  totalSpend      Float?
  impressions     Int?
  clicks          Int?
  conversions     Int?
  revenue         Float?
  lastUpdated     DateTime?
  createdAt       DateTime  @default(now())
  
  integration     Integration @relation(fields: [integrationId], references: [id])
  metrics         Metric[]
  
  @@unique([integrationId, externalId])
}

model Metric {
  id          String    @id @default(cuid())
  campaignId  String
  date        DateTime  @db.Date
  spend       Float
  impressions Int
  clicks      Int
  conversions Int
  revenue     Float?
  ctr         Float?    // Click-through rate
  cpc         Float?    // Cost per click
  cpa         Float?    // Cost per acquisition
  roas        Float?    // Return on ad spend
  createdAt   DateTime  @default(now())
  
  campaign    Campaign  @relation(fields: [campaignId], references: [id])
  
  @@unique([campaignId, date])
  @@index([date])
}

model Report {
  id          String    @id @default(cuid())
  userId      String
  name        String
  dateRange   Json      // { start, end }
  insights    Json?     // AI-generated insights
  pdfUrl      String?
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id])
}

model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  plan            String    // 'free', 'starter', 'pro', 'agency'
  stripeCustomerId String?  @unique
  stripeSubscriptionId String? @unique
  status          String    // 'active', 'canceled', 'past_due'
  currentPeriodEnd DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase/Neon recommended)
- Redis instance (Upstash recommended for serverless)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/ClawdyAssistant/marketing-dashboard-api.git
   cd marketing-dashboard-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   
   # Redis
   REDIS_URL="redis://default:password@host:6379"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3001"
   
   # Google Ads API
   GOOGLE_ADS_CLIENT_ID="your-client-id"
   GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
   GOOGLE_ADS_DEVELOPER_TOKEN="your-dev-token"
   
   # Meta Marketing API
   META_APP_ID="your-app-id"
   META_APP_SECRET="your-app-secret"
   
   # Shopify
   SHOPIFY_API_KEY="your-api-key"
   SHOPIFY_API_SECRET="your-api-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   
   # AI Service
   AI_SERVICE_URL="http://localhost:8000"
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   API available at [http://localhost:3001](http://localhost:3001)

---

## 🔄 Development Workflow

Same branch strategy as frontend:
- **main** - Protected, production-ready
- **feat/feature-name** - New features
- **fix/bug-name** - Bug fixes

### Making Changes

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes & commit: `git commit -m "feat: add Google Ads sync"`
3. Push: `git push origin feat/your-feature`
4. Create PR → `main`, request review from @Ahmedki1l

---

## 📦 MVP Features (8-Week Sprint)

### Week 1-2: Foundation
- [x] Repository setup
- [ ] Next.js + tRPC setup
- [ ] Prisma + PostgreSQL setup
- [ ] Redis connection
- [ ] Authentication endpoints (JWT)

### Week 3-4: Integrations
- [ ] Google Ads OAuth flow
- [ ] Google Ads data sync (campaigns, metrics)
- [ ] Meta Ads OAuth flow
- [ ] Meta Ads data sync
- [ ] Shopify OAuth flow
- [ ] Shopify data sync

### Week 5-6: Dashboard Data
- [ ] Dashboard aggregation endpoints
- [ ] Date range filtering
- [ ] Performance metrics calculation
- [ ] Caching strategy implementation

### Week 7: AI Integration
- [ ] AI service API client
- [ ] Insights generation endpoint
- [ ] Insights caching

### Week 8: Billing & Polish
- [ ] Stripe integration
- [ ] Subscription management endpoints
- [ ] Webhook handlers (Stripe, integrations)
- [ ] Rate limiting
- [ ] Error handling polish

---

## 🔌 Key API Endpoints (tRPC)

### Authentication
- `auth.register` - User registration
- `auth.login` - User login
- `auth.logout` - User logout
- `auth.me` - Get current user

### Integrations
- `integrations.list` - Get user integrations
- `integrations.connectGoogleAds` - OAuth flow
- `integrations.connectMeta` - OAuth flow
- `integrations.connectShopify` - OAuth flow
- `integrations.disconnect` - Remove integration
- `integrations.sync` - Trigger manual sync

### Dashboard
- `dashboard.overview` - Get overview metrics
- `dashboard.campaigns` - Get campaign list with metrics
- `dashboard.trends` - Get performance trends

### Reports
- `reports.list` - Get user reports
- `reports.generate` - Generate new report with AI insights
- `reports.getPdf` - Get PDF download URL

### Subscription
- `subscription.current` - Get current plan
- `subscription.upgrade` - Upgrade plan (Stripe Checkout)
- `subscription.cancel` - Cancel subscription

---

## 🔐 Security Features

- **JWT Authentication** - Stateless auth tokens
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Zod schemas on all inputs
- **SQL Injection Protection** - Prisma ORM
- **OAuth Token Encryption** - Encrypted at rest
- **CORS Configuration** - Frontend-only access
- **Environment Variables** - Secrets never in code

---

## 🎯 Performance Targets

- **API Response Time:** < 200ms (p95)
- **Database Query Time:** < 50ms (p95)
- **Cache Hit Rate:** > 80%
- **Background Job Processing:** < 5 min per integration

---

## 🐛 Known Issues

- None yet (new project)

---

## 📝 Notes for Future Me (Clawdy)

### Context Refresher
- This is the **backend brain** - handles all data, auth, and business logic
- Communicates with frontend via **tRPC** (type-safe, no REST docs needed)
- Talks to **AI service** (Python) for insights generation
- Manages OAuth with Google/Meta/Shopify

### Architecture Decisions
- **Next.js API Routes** instead of Express - simpler deployment on Vercel
- **tRPC** for type safety - frontend gets auto-completion for API calls
- **Prisma** for database - migrations + type-safe queries
- **BullMQ** for jobs - reliable background processing
- **Redis** for caching - reduces database load & API calls to platforms

### Critical Workflows

#### Data Sync Flow
1. User connects integration (OAuth)
2. Store access/refresh tokens (encrypted)
3. Background job triggers every X hours
4. Fetch campaigns + metrics from platform
5. Upsert to database
6. Update `lastSync` timestamp

#### AI Insights Flow
1. User requests report
2. Aggregate metrics from database
3. Call Python AI service with data
4. AI returns insights (Claude API)
5. Store insights in Report table
6. Generate PDF (Puppeteer)
7. Return download URL

---

## 🔗 Related Repositories

- **Frontend:** [marketing-dashboard-web](https://github.com/ClawdyAssistant/marketing-dashboard-web)
- **AI Service:** [marketing-dashboard-ai](https://github.com/ClawdyAssistant/marketing-dashboard-ai)

---

## 👨‍💻 Team

- **Developer:** Clawdy (AI Agent) - @ClawdyAssistant
- **Owner/Approver:** Ahmed Alaa - @Ahmedki1l

---

**Last Updated:** February 3, 2026  
**Next Milestone:** Set up tRPC + Prisma + Auth (Week 1-2)
