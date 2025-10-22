# PartPal Vercel Deployment Guide

Complete guide for deploying the PartPal monorepo (IMS and Marketplace applications) on Vercel.

## Table of Contents

1. [Project Analysis](#project-analysis)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Pre-Deployment Setup](#pre-deployment-setup)
5. [Deploying to Vercel](#deploying-to-vercel)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Domain Configuration](#domain-configuration)
9. [Post-Deployment Tasks](#post-deployment-tasks)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Cost Estimation](#cost-estimation)

---

## Project Analysis

### Current Architecture

PartPal is a **Turbo monorepo** with the following structure:

```
PartPalv2/
├── apps/
│   ├── ims/              # Next.js 14 - B2B Inventory Management (Port 3001)
│   └── marketplace/      # Next.js 14 - Public Marketplace (Port 3000)
├── packages/
│   ├── shared-ui/        # Shared component library (Tailwind CSS)
│   ├── shared-types/     # TypeScript type definitions
│   ├── shared-utils/     # Common utilities
│   ├── api-client/       # API client library
│   └── database/         # Prisma schema and migrations
├── services/
│   └── api/              # Express.js backend (Port 3333)
├── infrastructure/       # Docker, Kubernetes configs
└── turbo.json           # Turbo build configuration
```

### Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **State Management**: TanStack Query (React Query) 5
- **Database**: PostgreSQL with Prisma ORM 5
- **Cache**: Redis (ioredis)
- **Image Storage**: Cloudinary
- **Location**: Seller location data
- **Build Tool**: Turbo (monorepo orchestration)
- **Package Manager**: pnpm 8.15.0

### Data Models

The application uses the following core entities (defined in `packages/shared-types`):

- **User**: Authentication and authorization (admin/seller/buyer roles)
- **Seller**: Business profiles with verification and subscription plans
- **Vehicle**: VIN-based vehicle records (Make/Model/Year)
- **Part**: Inventory items with marketplace publishing capability
- **RefreshToken**: JWT token management

### Current Deployment Setup

The project is currently configured for **Docker/Kubernetes deployment** with:
- Multi-stage Dockerfiles
- Kubernetes manifests with auto-scaling
- Nginx reverse proxy
- Docker Compose for local development

For Vercel, we need to adapt this setup to use **serverless architecture**.

---

## Prerequisites

### Required Accounts

1. **Vercel Account** (Free tier available)
   - Sign up at https://vercel.com
   - Connect GitHub account
   - Install Vercel CLI: `npm i -g vercel`

2. **GitHub Account**
   - Repository must be pushed to GitHub
   - Vercel will connect to your repo for automatic deployments

3. **Database Service** (Choose one)
   - **Vercel Postgres** (Recommended - $24/month, 60GB included)
   - **Supabase** (Free tier: 500MB, then $25/month)
   - **Neon** (Free tier: 0.5GB, then $19/month)
   - **Railway** (Free $5 credit, then usage-based)

4. **Redis Service** (Choose one)
   - **Upstash** (Recommended - Free tier: 10k requests/day)
   - **Redis Labs** (Free tier: 30MB)
   - **Railway** (Usage-based pricing)

5. **Cloudinary** (Required for images)
   - Free tier: 25 credits/month
   - Sign up at https://cloudinary.com


- **SendGrid** (Email): Free tier 100 emails/day
- **Sentry** (Error tracking): Free tier for developers
- **Google Analytics**: Free

---

## Architecture Overview

### Vercel Deployment Strategy

Since Vercel specializes in frontend deployments, we'll deploy the architecture as follows:

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────┐      ┌────────────────────┐    │
│  │   IMS Application  │      │ Marketplace App    │    │
│  │   (Next.js)        │      │ (Next.js)          │    │
│  │   ims.partpal.app  │      │ partpal.app        │    │
│  └────────────────────┘      └────────────────────┘    │
│           │                            │                 │
│           └────────────┬───────────────┘                │
│                        │                                 │
│                  ┌─────▼──────┐                         │
│                  │ API Routes │                         │
│                  │ (Serverless)│                        │
│                  └─────┬──────┘                         │
└────────────────────────┼────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐   ┌─────▼──────┐  ┌─────▼──────┐
   │PostgreSQL│   │   Redis    │  │ Cloudinary │
   │(Vercel/  │   │ (Upstash)  │  │  (Images)  │
   │Supabase) │   │            │  │            │
   └──────────┘   └────────────┘  └────────────┘
```

### Deployment Approach

**Option 1: Two Separate Vercel Projects (Recommended)**
- Deploy IMS and Marketplace as independent Vercel projects
- Each app gets its own subdomain
- Better isolation and independent scaling
- Easier environment management

**Option 2: Monorepo with Multiple Apps**
- Deploy both apps from a single Vercel project
- Use Vercel's monorepo support
- Shared environment variables and settings

**Option 3: Hybrid Approach**
- Deploy frontend apps on Vercel
- Deploy Express API on Railway/Render
- More complex but gives full control over API

For this guide, we'll use **Option 1** as it provides the best balance of simplicity and control.

---

## Pre-Deployment Setup

### 1. Update Package.json Scripts

The existing `package.json` already has the correct scripts. Verify:

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start"
  }
}
```

### 2. Verify Dependencies

Ensure all workspace dependencies are correctly configured:

```bash
# From project root
pnpm install

# Verify build works locally
pnpm build

# Check for type errors
pnpm typecheck
```

### 3. Update .gitignore

Ensure the following are ignored:

```gitignore
# Vercel
.vercel
.env*.local
.env.production

# Next.js
.next/
out/
build/
dist/

# Dependencies
node_modules/
.pnpm-store/

# Turbo
.turbo/
```

### 4. Prepare Environment Variables

Copy `.env.vercel.example` and prepare your values:

```bash
cp .env.vercel.example .env.local
```

Fill in all required values (we'll add them to Vercel later).

---

## Deploying to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/partpal.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy IMS Application

#### Using Vercel Dashboard (Recommended for first deployment)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/ims`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @partpal/ims build`
   - **Output Directory**: `apps/ims/.next`
   - **Install Command**: `pnpm install`

4. Click "Deploy"

#### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to IMS app
cd apps/ims

# Deploy
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: partpal-ims
# - Directory: ./
# - Override settings? Y
# - Build Command: cd ../.. && pnpm install && pnpm --filter @partpal/ims build
# - Output Directory: .next
# - Development Command: pnpm dev
```

### Step 3: Deploy Marketplace Application

Repeat the same process for the Marketplace:

#### Using Dashboard

1. Go to https://vercel.com/new
2. Import same repository
3. Configure:
   - **Root Directory**: `apps/marketplace`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @partpal/marketplace build`
   - **Output Directory**: `apps/marketplace/.next`

#### Using CLI

```bash
cd apps/marketplace
vercel

# Configure as above but for marketplace
```

### Step 4: Configure Build Settings

For each project in Vercel Dashboard:

1. Go to **Settings** > **General**
2. Set **Node.js Version**: `18.x` or `20.x`
3. Set **Package Manager**: `pnpm`
4. **Root Directory**: `apps/ims` or `apps/marketplace`

5. Go to **Settings** > **Build & Development**
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @partpal/[ims|marketplace] build
     ```
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

---

## Environment Configuration

### Required Environment Variables

#### IMS Application

Add these in Vercel Dashboard > Settings > Environment Variables:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Authentication
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# API
NEXT_PUBLIC_API_URL=https://api.partpal.co.za
API_URL=https://api.partpal.co.za

# URLs
NEXT_PUBLIC_MARKETPLACE_URL=https://partpal.vercel.app
NEXT_PUBLIC_IMS_URL=https://ims-partpal.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=900

# Security
CORS_ORIGIN=https://partpal.vercel.app,https://ims-partpal.vercel.app
SECURE_COOKIES=true
TRUST_PROXY=true

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
FEATURE_MAP_INTEGRATION=true
FEATURE_PUSH_NOTIFICATIONS=true

# Stripe (for subscriptions)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@partpal.co.za
```

#### Marketplace Application

```env
# Database (read-only recommended)
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# API
NEXT_PUBLIC_API_URL=https://api.partpal.co.za

# URLs
NEXT_PUBLIC_MARKETPLACE_URL=https://partpal.vercel.app
NEXT_PUBLIC_IMS_URL=https://ims-partpal.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name


# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry (optional)
SENTRY_DSN=https://...
SENTRY_ORG=partpal
SENTRY_PROJECT=partpal-marketplace

# Security
CORS_ORIGIN=https://partpal.vercel.app,https://ims-partpal.vercel.app
SECURE_COOKIES=true

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
FEATURE_MAP_INTEGRATION=true
```

### Adding Environment Variables

#### Via Dashboard

1. Go to project in Vercel
2. Settings > Environment Variables
3. Add each variable with:
   - **Key**: Variable name
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, Development as needed
4. Click "Save"

#### Via CLI

```bash
# Add a single variable
vercel env add DATABASE_URL production

# Import from .env file
vercel env pull .env.production
```

### Environment Variable Scope

- **Production**: Used for production deployments (main branch)
- **Preview**: Used for preview deployments (pull requests)
- **Development**: Used for `vercel dev` local development

For sensitive data, add only to Production and use dummy values for Preview/Development.

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

**Pros**: Seamless integration, auto-scaling, built-in connection pooling
**Cons**: More expensive ($24/month minimum)

1. Go to Vercel Dashboard > Storage
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name: `partpal-db`
5. Select region closest to your users (e.g., `Frankfurt` for South Africa)
6. Click "Create"

7. Connect to your projects:
   - Go to the database page
   - Click "Connect Project"
   - Select your IMS and Marketplace projects
   - Vercel automatically adds `DATABASE_URL` and related variables

8. Run Prisma migrations:
```bash
# Install dependencies
pnpm install

# Generate Prisma client
cd packages/database
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database (optional)
pnpm prisma db seed
```

### Option 2: Supabase

**Pros**: Generous free tier, real-time capabilities, auth built-in
**Cons**: Requires separate account and management

1. Sign up at https://supabase.com
2. Create new project:
   - Name: `partpal`
   - Database password: (save this securely)
   - Region: `South Africa (Cape Town)` or closest
3. Wait for provisioning (2-3 minutes)

4. Get connection string:
   - Go to Settings > Database
   - Copy "Connection string" (Connection pooling mode)
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true`

5. Add to Vercel:
   - Go to Vercel project > Settings > Environment Variables
   - Add `DATABASE_URL` with the connection string
   - Important: Replace `[PASSWORD]` with your actual password

6. Run migrations:
```bash
DATABASE_URL="your_supabase_url" pnpm --filter @partpal/database prisma migrate deploy
```

### Option 3: Neon

**Pros**: Serverless PostgreSQL, instant branching, cost-effective
**Cons**: Newer service, smaller free tier

1. Sign up at https://neon.tech
2. Create project: `partpal`
3. Copy connection string
4. Add to Vercel as `DATABASE_URL`
5. Run Prisma migrations

### Database Configuration Best Practices

1. **Connection Pooling**: Essential for serverless
   - Vercel Postgres: Built-in
   - Supabase: Use port 6543 (pgbouncer)
   - Neon: Use pooled connection string
   - External: Use PgBouncer or Prisma Data Proxy

2. **Prisma Configuration**:

Update `packages/database/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
  relationMode = "prisma" // For better serverless compatibility
}
```

3. **Read Replicas** (Optional for Marketplace):
   - Create read-only replica for Marketplace
   - Reduces load on primary database
   - Set `DATABASE_URL` to replica in Marketplace env vars

---

## Redis Setup

### Option 1: Upstash (Recommended)

**Pros**: Serverless, generous free tier, Vercel integration
**Cons**: None significant

1. Sign up at https://upstash.com
2. Create new database:
   - Name: `partpal-cache`
   - Type: Regional (for better performance) or Global
   - Region: Europe (closest to South Africa)
   - TLS: Enabled

3. Get credentials:
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`

4. Install Vercel Integration:
   - Go to https://vercel.com/integrations/upstash
   - Install for your projects
   - Or manually add environment variables

5. Add to Vercel:
```env
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Option 2: Redis Labs

1. Sign up at https://redis.com/try-free
2. Create free database (30MB)
3. Get connection details
4. Add to Vercel environment variables

### Redis Configuration in Code

Update your Redis connection to handle serverless:

```typescript
// packages/shared-utils/src/redis.ts
import Redis from 'ioredis';

const getRedisClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true, // Important for serverless
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });
};

export const redis = getRedisClient();
```

---

## Domain Configuration

### Step 1: Configure Custom Domains

#### For IMS Application

1. Go to Vercel project > Settings > Domains
2. Add domain: `ims.partpal.co.za`
3. Vercel provides DNS records:
   - Type: `CNAME`
   - Name: `ims`
   - Value: `cname.vercel-dns.com`

4. Add to your DNS provider (e.g., Cloudflare, GoDaddy):
   - Login to DNS provider
   - Add CNAME record as shown
   - Wait for DNS propagation (5-60 minutes)

#### For Marketplace Application

1. Add domain: `partpal.co.za` (or `www.partpal.co.za`)
2. For apex domain, Vercel provides A records:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`
3. Add CNAME for www:
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

### Step 2: Configure SSL

Vercel automatically provisions SSL certificates via Let's Encrypt:
- No configuration needed
- Automatic renewal
- Supports wildcard certificates

### Step 3: Redirect Configuration

For the Marketplace, set up redirects:

1. Redirect www to apex (or vice versa):
   - Vercel Dashboard > Project > Settings > Domains
   - Click on domain
   - Set "Redirect to..." dropdown

2. Or use `vercel.json` redirects (already configured in `apps/marketplace/vercel.json`)

---

## Post-Deployment Tasks

### 1. Database Initialization

```bash
# Connect to production database
DATABASE_URL="your_production_url" pnpm --filter @partpal/database prisma migrate deploy

# Seed with initial data
DATABASE_URL="your_production_url" pnpm --filter @partpal/database prisma db seed
```

### 2. Test Authentication

1. Visit IMS application: `https://ims.partpal.co.za`
2. Try to sign up / log in
3. Verify JWT tokens work
4. Check session persistence

### 3. Test Image Upload

1. Upload a vehicle image
2. Verify it appears in Cloudinary dashboard
3. Check image optimization is working
4. Test different image formats

### 4. Test Marketplace Search

1. Visit `https://partpal.co.za`
2. Search for parts
3. Verify map integration works
4. Test location filtering

### 5. Configure Monitoring

#### Vercel Analytics

1. Go to project > Analytics
2. Enable Vercel Analytics
3. Add to your app:

```bash
pnpm add @vercel/analytics
```

```typescript
// apps/ims/pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

#### Error Tracking (Sentry)

1. Sign up at https://sentry.io
2. Create projects for IMS and Marketplace
3. Get DSN for each
4. Add to environment variables
5. Install Sentry:

```bash
pnpm add @sentry/nextjs
```

6. Initialize:

```bash
# In each app directory
npx @sentry/wizard@latest -i nextjs
```

### 6. Set Up CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-ims:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: pnpm --filter @partpal/ims typecheck

      - name: Lint
        run: pnpm --filter @partpal/ims lint

      - name: Test
        run: pnpm --filter @partpal/ims test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_IMS }}
          working-directory: ./apps/ims
          vercel-args: '--prod'

  deploy-marketplace:
    runs-on: ubuntu-latest
    steps:
      # Similar steps for marketplace
```

---

## Monitoring and Maintenance

### 1. Vercel Dashboard Monitoring

Monitor these metrics in Vercel Dashboard:

- **Function Executions**: Track API route invocations
- **Bandwidth**: Monitor data transfer
- **Build Time**: Optimize if builds are slow
- **Error Rate**: Track 4xx and 5xx errors
- **Performance**: Core Web Vitals (LCP, FID, CLS)

### 2. Database Monitoring

#### Vercel Postgres

- Dashboard shows: Connections, Query time, Storage
- Set up alerts for high connection count
- Monitor query performance

#### Supabase

- Go to project > Database > Query Performance
- Check connection pooler stats
- Monitor disk usage

### 3. Redis Monitoring

#### Upstash

- Dashboard shows: Commands/sec, Memory usage
- Set up alerts for high memory
- Monitor latency

### 4. Error Tracking

Use Sentry or Vercel Error Tracking:

- Review errors daily
- Set up alerts for critical errors
- Track error trends over time

### 5. Cost Monitoring

#### Vercel Costs

Monitor these in Billing dashboard:

- **Bandwidth**: Track outgoing data (usually the highest cost)
- **Function Invocations**: Monitor API calls
- **Build Minutes**: Optimize builds if needed
- **Image Optimizations**: Use Cloudinary to reduce

**Tips to Reduce Costs:**

1. Use Cloudinary for images (not Vercel image optimization)
2. Implement edge caching with `Cache-Control` headers
3. Use ISR (Incremental Static Regeneration) where possible
4. Optimize bundle size with code splitting
5. Use Vercel's Analytics instead of real-time analytics

### 6. Backup Strategy

#### Database Backups

**Vercel Postgres**: Automatic daily backups (retain 7 days)

**Supabase**:
- Free tier: Daily backups (7 days retention)
- Manual backup:
  ```bash
  pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
  ```

**Automated Backups** (Optional):

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup database
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} > backup_$(date +%Y%m%d).sql

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1

      - run: aws s3 cp backup_$(date +%Y%m%d).sql s3://partpal-backups/
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails: "Cannot find module"

**Problem**: Workspace dependencies not resolved

**Solution**:
```bash
# Update build command in vercel.json
"buildCommand": "cd ../.. && pnpm install --shamefully-hoist && pnpm --filter @partpal/ims build"
```

#### 2. Database Connection Timeout

**Problem**: Too many connections in serverless environment

**Solution**:
- Use connection pooling (PgBouncer)
- Set `connection_limit` in Prisma:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    relationMode = "prisma"
  }
  ```
- Reduce connection timeout:
  ```typescript
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  ```

#### 3. Redis Connection Issues

**Problem**: Redis connection fails in serverless functions

**Solution**:
- Use `lazyConnect: true` in ioredis config
- Implement connection caching:
  ```typescript
  let redis: Redis | null = null;

  export const getRedis = () => {
    if (!redis) {
      redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });
    }
    return redis;
  };
  ```

#### 4. Environment Variables Not Loading

**Problem**: Variables added in Vercel Dashboard not available

**Solution**:
- Redeploy after adding environment variables
- Check variable scope (Production/Preview/Development)
- Ensure variable names start with `NEXT_PUBLIC_` for client-side access

#### 5. Image Optimization Fails

**Problem**: Images don't load or optimization errors

**Solution**:
- Add domain to `next.config.js` `images.domains`
- Use Cloudinary URLs instead of local paths
- Check Cloudinary configuration

#### 6. Slow Cold Starts

**Problem**: First request after idle period is slow

**Solution**:
- Use Vercel Pro for lower cold start times
- Implement warming strategies:
  ```typescript
  // Warm function every 5 minutes
  export const config = {
    maxDuration: 30,
  };
  ```
- Consider edge functions for critical paths

#### 7. TypeScript Errors in Build

**Problem**: Build fails due to type errors

**Solution**:
```bash
# Check types locally
pnpm typecheck

# Fix import paths
# Use workspace aliases: @partpal/shared-types
# Not relative: ../../../packages/shared-types

# Ensure tsconfig.json has correct paths
{
  "compilerOptions": {
    "paths": {
      "@partpal/*": ["../../packages/*/src"]
    }
  }
}
```

### Debug Commands

```bash
# Test build locally
vercel build

# Run locally with production settings
vercel dev --prod

# Check function logs
vercel logs [deployment-url]

# Inspect environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

### Getting Help

1. **Vercel Documentation**: https://vercel.com/docs
2. **Vercel Support**: support@vercel.com (Pro/Enterprise plans)
3. **Community Discord**: https://vercel.com/discord
4. **GitHub Discussions**: Check Vercel's GitHub for issues

---

## Cost Estimation

### Vercel Pricing Tiers

#### Hobby (Free)
- Bandwidth: 100 GB/month
- Function Invocations: 100 GB-hours
- Build Minutes: 6,000 minutes/month
- Projects: Unlimited
- Team members: 1

**Suitable for**: Development, testing, personal projects

#### Pro ($20/month per member)
- Bandwidth: 1 TB/month (then $40/TB)
- Function Invocations: 1000 GB-hours (then $40/100 GB-hours)
- Build Minutes: 24,000 minutes/month
- Custom domains with SSL
- Analytics included
- Priority support
- Password protection
- **Recommended for production**

#### Enterprise (Custom pricing)
- Custom bandwidth
- Custom functions
- SLA guarantees
- Advanced security
- Dedicated support

### Service Costs (Monthly Estimates)

#### Core Infrastructure

| Service | Tier | Cost (USD) | Cost (ZAR) | Notes |
|---------|------|------------|------------|-------|
| Vercel Pro | 2 projects | $40 | R720 | IMS + Marketplace |
| PostgreSQL (Vercel) | 60GB | $24 | R430 | Or use Supabase ($25) |
| Redis (Upstash) | Free/Pro | $0-10 | R0-180 | Free tier likely sufficient |
| Cloudinary | Free/Plus | $0-99 | R0-1,780 | 25 credits free, then $0.02/credit |

**Subtotal**: ~$64-173 / R1,150-3,110/month

#### Optional Services

| Service | Cost (USD) | Cost (ZAR) | Notes |
|---------|-----------|------------|-------|
| SendGrid (Email) | $0-15 | R0-270 | 100 emails/day free |
| Location | Included | Seller data |
| Google Analytics | $0 | R0 | Free |
| Sentry (Errors) | $0-26 | R0-470 | Developer tier free |
| Domain (.co.za) | $8 | R145 | Annual cost |

**Total Estimated Monthly Cost**:
- **Minimum**: ~R1,150 ($64) - Free tiers only
- **Recommended**: ~R2,500-3,500 ($140-195) - With Pro services
- **With scaling**: ~R5,000+ ($275+) - Higher traffic

### Cost Optimization Tips

1. **Use Free Tiers**:
   - Start with Vercel Hobby during development
   - Use Supabase free tier (500MB is enough for MVP)
   - Upstash Redis free tier (10k requests/day)

2. **Optimize Bandwidth**:
   - Use Cloudinary for all images (reduces Vercel bandwidth)
   - Enable compression in `next.config.js`
   - Implement edge caching with proper `Cache-Control` headers

3. **Reduce Function Invocations**:
   - Use ISR (Incremental Static Regeneration) for static content
   - Cache API responses in Redis
   - Batch database queries

4. **Build Optimization**:
   - Use Turbo cache: `turbo.json` already configured
   - Enable `swcMinify` in `next.config.js` (already done)
   - Use `output: 'standalone'` for smaller builds (commented out for Vercel)

5. **Database Optimization**:
   - Use connection pooling
   - Implement query caching
   - Create indexes for common queries
   - Archive old data

### ROI Consideration

Compared to self-hosting (AWS EC2 + RDS + Redis):

| Aspect | Vercel | Self-Hosted |
|--------|--------|-------------|
| Monthly Cost | R2,500-3,500 | R1,500-2,500 |
| Setup Time | 2-4 hours | 10-20 hours |
| Maintenance | ~0 hours/month | ~5-10 hours/month |
| Auto-scaling | Included | Manual setup |
| CDN | Global, included | Additional cost |
| SSL | Automatic | Manual renewal |
| Monitoring | Built-in | Requires setup |

**Verdict**: Vercel is cost-effective when factoring in time savings and reduced operational burden.

---

## Next Steps

1. **Deploy to Production**:
   - Follow steps in "Deploying to Vercel" section
   - Configure all environment variables
   - Test thoroughly

2. **Set Up Monitoring**:
   - Enable Vercel Analytics
   - Configure Sentry for error tracking
   - Set up uptime monitoring

3. **Performance Optimization**:
   - Run Lighthouse audits
   - Optimize Core Web Vitals
   - Implement caching strategies

4. **Security Hardening**:
   - Review and test authentication flows
   - Configure rate limiting
   - Set up WAF rules (if using Cloudflare)
   - Enable 2FA for admin accounts

5. **Documentation**:
   - Document custom environment variables
   - Create runbooks for common operations
   - Document incident response procedures

6. **Scale Planning**:
   - Monitor usage patterns
   - Plan for database scaling
   - Consider CDN for static assets
   - Evaluate need for dedicated API service

---

## Conclusion

You now have a complete guide for deploying PartPal to Vercel. The architecture is optimized for serverless deployment with:

- Separate Next.js applications for IMS and Marketplace
- PostgreSQL with connection pooling
- Redis for caching and sessions
- Cloudinary for image optimization
- Comprehensive monitoring and error tracking

For questions or issues, refer to the Troubleshooting section or contact Vercel support.

**Deployment Checklist**: See `VERCEL_DEPLOYMENT_CHECKLIST.md` for a step-by-step checklist.
