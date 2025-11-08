# Production Environment Setup Guide

**Last Updated**: 2025-10-24
**Status**: Production Environment Agent Task

This guide provides step-by-step instructions for configuring all production environment variables and third-party services for PartPal on Vercel.

## Table of Contents

1. [Overview](#overview)
2. [Vercel Environment Variables](#vercel-environment-variables)
3. [Database Setup (Vercel Postgres)](#database-setup-vercel-postgres)
4. [Redis Setup (Vercel KV)](#redis-setup-vercel-kv)
5. [Cloudinary Setup](#cloudinary-setup)
6. [Email Service Setup](#email-service-setup)
7. [Analytics Setup](#analytics-setup)
8. [Monitoring Setup (Sentry)](#monitoring-setup-sentry)
9. [Security Configuration](#security-configuration)
10. [Verification Checklist](#verification-checklist)

---

## Overview

### Required Services

| Service | Purpose | Cost | Priority |
|---------|---------|------|----------|
| Vercel Postgres | Database | $24/month | CRITICAL |
| Vercel KV | Redis cache | Free-$10/month | HIGH |
| Cloudinary | Image storage | Free-$99/month | CRITICAL |
| SendGrid | Email delivery | Free-$15/month | HIGH |
| Google Analytics | Web analytics | Free | MEDIUM |
| Sentry | Error tracking | Free-$26/month | MEDIUM |

### Estimated Setup Time

- Total: ~2-3 hours
- Database: 30 minutes
- Redis: 15 minutes
- Cloudinary: 20 minutes
- Email: 20 minutes
- Analytics: 15 minutes
- Monitoring: 30 minutes
- Verification: 30 minutes

---

## Vercel Environment Variables

### Structure

Environment variables are scoped by environment:
- **Production**: Live application (main branch)
- **Preview**: Pull request deployments
- **Development**: Local development with `vercel dev`

### Adding Variables via Dashboard

1. Go to Vercel Dashboard
2. Select your project (IMS or Marketplace)
3. Go to **Settings > Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, and/or Development
6. Click **Save**

### Adding Variables via CLI

```bash
# Add to production
vercel env add DATABASE_URL production

# Add to all environments
vercel env add JWT_SECRET production preview development

# Pull environment variables locally
vercel env pull .env.local
```

### Environment Variable Organization

Create these variable groups:

#### 1. Sensitive Secrets (Production Only)
```
DATABASE_URL
JWT_SECRET
CLOUDINARY_API_SECRET
SMTP_PASS
STRIPE_SECRET_KEY
```

#### 2. Public Configuration (All Environments)
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_MARKETPLACE_URL
NEXT_PUBLIC_IMS_URL
NEXT_PUBLIC_GA_TRACKING_ID
CLOUDINARY_CLOUD_NAME
```

#### 3. Preview/Development (Non-sensitive)
Use test/development values for Preview and Development environments.

---

## Database Setup (Vercel Postgres)

### Option 1: Vercel Postgres (Recommended)

#### Step 1: Create Database

1. Go to Vercel Dashboard
2. Click **Storage** in left sidebar
3. Click **Create Database**
4. Select **Postgres**
5. Configure:
   - **Name**: `partpal-production`
   - **Region**: Select closest to your users (e.g., `Frankfurt` for SA/EU)
   - **Plan**: Hobby ($0) or Pro ($24/month for 60GB)
6. Click **Create**

#### Step 2: Connect to Projects

1. Once created, click **Connect Project**
2. Select your IMS project
3. Vercel automatically adds these variables:
   ```
   POSTGRES_URL
   POSTGRES_PRISMA_URL
   POSTGRES_URL_NON_POOLING
   POSTGRES_USER
   POSTGRES_HOST
   POSTGRES_PASSWORD
   POSTGRES_DATABASE
   ```
4. Repeat for Marketplace project

#### Step 3: Configure for Prisma

Add this to your Vercel environment variables:

```bash
# For Prisma Client (pooled connection)
DATABASE_URL=$POSTGRES_PRISMA_URL

# For Prisma Migrate (direct connection)
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

#### Step 4: Run Migrations

```bash
# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
cd packages/database
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database (optional)
pnpm prisma db seed
```

### Option 2: External Postgres (Supabase/Neon)

If using external provider:

1. Create database at provider
2. Get connection string
3. Add to Vercel as `DATABASE_URL`
4. Ensure connection pooling enabled:
   ```
   postgresql://user:pass@host:6543/db?pgbouncer=true
   ```

### Database Security

1. **Enable SSL**: Always use `sslmode=require`
2. **Connection Pooling**: Use pooled connections for serverless
3. **Read Replicas**: Consider for Marketplace (read-only)
4. **Backups**: Verify automatic backups enabled
5. **Access Control**: Limit to Vercel IP ranges if possible

---

## Redis Setup (Vercel KV)

### Step 1: Create KV Store

1. Go to Vercel Dashboard > Storage
2. Click **Create Database**
3. Select **KV (Redis)**
4. Configure:
   - **Name**: `partpal-cache`
   - **Region**: Same as Postgres
5. Click **Create**

### Step 2: Connect to Projects

1. Click **Connect Project**
2. Select IMS project
3. Vercel automatically adds:
   ```
   KV_URL
   KV_REST_API_URL
   KV_REST_API_TOKEN
   KV_REST_API_READ_ONLY_TOKEN
   ```

### Step 3: Configure Application

Update code to use Vercel KV:

```typescript
// packages/shared-utils/src/cache/redis.ts
import { kv } from '@vercel/kv';

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    return await kv.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await kv.setex(key, ttl, JSON.stringify(value));
    } else {
      await kv.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    await kv.del(key);
  }
}
```

### Alternative: External Redis (Upstash)

1. Sign up at https://upstash.com
2. Create database
3. Get credentials
4. Add to Vercel:
   ```
   REDIS_URL=redis://default:password@host:port
   ```

---

## Cloudinary Setup

### Step 1: Create Account

1. Sign up at https://cloudinary.com
2. Verify email
3. Complete profile

### Step 2: Get Credentials

1. Go to Dashboard
2. Note these values:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz` (click "eye" icon to reveal)

### Step 3: Configure Upload Preset

1. Go to Settings > Upload
2. Click **Add upload preset**
3. Configure:
   - **Preset name**: `partpal-parts`
   - **Signing Mode**: Unsigned
   - **Folder**: `partpal/parts`
   - **Access Mode**: Public
   - **Unique filename**: true
   - **Overwrite**: false
4. Configure transformations:
   - **Format**: Auto
   - **Quality**: Auto
   - **Width**: 1200 (max)
   - **Height**: 1200 (max)
   - **Crop**: Limit
5. Click **Save**

### Step 4: Add to Vercel

Add these environment variables to **both** IMS and Marketplace:

```bash
# Production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key  # IMS only

# Public (Marketplace can omit secret)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Step 5: Configure Application

```typescript
// apps/ims/src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### Cost Optimization

Free tier includes:
- 25 credits/month
- ~25GB storage
- ~25GB bandwidth
- 25,000 transformations

To stay in free tier:
1. Use unsigned uploads where possible
2. Enable auto-format and auto-quality
3. Use responsive images
4. Implement lazy loading

---

## Email Service Setup

### Option 1: SendGrid (Recommended)

#### Step 1: Create Account

1. Sign up at https://sendgrid.com
2. Verify email
3. Complete sender verification

#### Step 2: Create API Key

1. Go to Settings > API Keys
2. Click **Create API Key**
3. Name: `PartPal Production`
4. Permissions: **Full Access** or **Mail Send** only
5. Copy API key (shown once only)

#### Step 3: Verify Sender Domain

1. Go to Settings > Sender Authentication
2. Click **Authenticate Your Domain**
3. Enter your domain: `partpal.co.za`
4. Add DNS records as shown:
   ```
   Type: CNAME
   Host: em1234
   Value: u1234.wl.sendgrid.net

   Type: CNAME
   Host: s1._domainkey
   Value: s1.domainkey.u1234.wl.sendgrid.net

   Type: CNAME
   Host: s2._domainkey
   Value: s2.domainkey.u1234.wl.sendgrid.net
   ```
5. Wait for verification (5-48 hours)

#### Step 4: Add to Vercel

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
FROM_EMAIL=noreply@partpal.co.za
FROM_NAME=PartPal
```

#### Step 5: Test Email

```typescript
// Test script
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: process.env.FROM_EMAIL,
  to: 'your@email.com',
  subject: 'Test Email from PartPal',
  text: 'If you receive this, email configuration is working!',
});
```

### Option 2: Resend

1. Sign up at https://resend.com
2. Verify domain
3. Get API key
4. Add to Vercel:
   ```
   RESEND_API_KEY=re_123...
   ```

### Email Templates

Create transactional email templates:
- Welcome email
- Password reset
- Order confirmation
- Weekly digest

---

## Analytics Setup

### Google Analytics 4

#### Step 1: Create Property

1. Go to https://analytics.google.com
2. Click **Admin** > **Create Property**
3. Property name: `PartPal`
4. Time zone: `South Africa`
5. Currency: `ZAR`
6. Click **Next**

#### Step 2: Set Up Data Stream

1. Select **Web**
2. Website URL: `https://partpal.co.za`
3. Stream name: `PartPal Marketplace`
4. Click **Create stream**
5. Copy **Measurement ID**: `G-XXXXXXXXXX`

#### Step 3: Add to Vercel

For Marketplace:
```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

For IMS (optional, separate property):
```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-YYYYYYYYYY
```

#### Step 4: Install Analytics

```bash
# Install package
pnpm add @next/third-parties
```

```typescript
// apps/marketplace/src/pages/_app.tsx
import { GoogleAnalytics } from '@next/third-parties/google';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_TRACKING_ID} />
    </>
  );
}
```

### Vercel Analytics (Additional)

1. Go to Vercel project > Analytics
2. Enable **Web Analytics**
3. Enable **Speed Insights**
4. Install package:
   ```bash
   pnpm add @vercel/analytics @vercel/speed-insights
   ```
5. Add to _app.tsx:
   ```typescript
   import { Analytics } from '@vercel/analytics/react';
   import { SpeedInsights } from '@vercel/speed-insights/next';

   export default function App({ Component, pageProps }) {
     return (
       <>
         <Component {...pageProps} />
         <Analytics />
         <SpeedInsights />
       </>
     );
   }
   ```

---

## Monitoring Setup (Sentry)

### Step 1: Create Sentry Account

1. Sign up at https://sentry.io
2. Create organization: `PartPal`
3. Select plan: Developer (free) or Team ($26/month)

### Step 2: Create Projects

Create two projects:
1. **PartPal IMS** (Next.js)
2. **PartPal Marketplace** (Next.js)

### Step 3: Get DSN

For each project:
1. Go to Settings > Client Keys (DSN)
2. Copy DSN: `https://abc123@o123456.ingest.sentry.io/123456`

### Step 4: Install Sentry

```bash
# Install Sentry SDK
pnpm add @sentry/nextjs

# Run wizard
cd apps/ims
npx @sentry/wizard@latest -i nextjs

cd ../marketplace
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates `next.config.js`

### Step 5: Add to Vercel

For IMS:
```bash
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
SENTRY_ORG=partpal
SENTRY_PROJECT=partpal-ims
SENTRY_AUTH_TOKEN=your-auth-token  # For source maps
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456
```

For Marketplace:
```bash
SENTRY_DSN=https://def456@o123456.ingest.sentry.io/789012
SENTRY_ORG=partpal
SENTRY_PROJECT=partpal-marketplace
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_SENTRY_DSN=https://def456@o123456.ingest.sentry.io/789012
```

### Step 6: Configure Alerts

1. Go to Sentry project > Alerts
2. Create alert rule:
   - **Condition**: Error count > 10 in 1 hour
   - **Action**: Send email to team
3. Create alert for:
   - High error rate
   - New issues
   - Performance degradation

---

## Security Configuration

### JWT Secret Generation

Generate strong JWT secret:

```bash
# Generate 32-byte random string
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to Vercel:
```bash
JWT_SECRET=your-generated-secret-here
JWT_EXPIRES_IN=7d
```

### CORS Configuration

Set allowed origins:

```bash
CORS_ORIGIN=https://partpal.co.za,https://ims.partpal.co.za,https://www.partpal.co.za
```

### Cookie Security

```bash
SECURE_COOKIES=true
COOKIE_DOMAIN=.partpal.co.za
TRUST_PROXY=true
```

### Rate Limiting

```bash
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=900
```

### Content Security Policy

Add to `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

---

## Verification Checklist

### Pre-Deployment Verification

- [ ] **Database**
  - [ ] Connection string added to Vercel
  - [ ] Migrations run successfully
  - [ ] Connection pooling enabled
  - [ ] SSL mode enabled

- [ ] **Redis/KV**
  - [ ] KV store created and connected
  - [ ] Test read/write operations
  - [ ] Rate limiting configured

- [ ] **Cloudinary**
  - [ ] Credentials added to Vercel
  - [ ] Upload preset configured
  - [ ] Test image upload
  - [ ] Verify image transformation

- [ ] **Email**
  - [ ] SendGrid API key added
  - [ ] Domain verified
  - [ ] Test email sent successfully
  - [ ] From address configured

- [ ] **Analytics**
  - [ ] GA4 tracking ID added
  - [ ] Vercel Analytics enabled
  - [ ] Events tracking configured

- [ ] **Monitoring**
  - [ ] Sentry projects created
  - [ ] DSN added to Vercel
  - [ ] Test error captured
  - [ ] Alerts configured

- [ ] **Security**
  - [ ] JWT secret generated and added
  - [ ] CORS origins configured
  - [ ] Secure cookies enabled
  - [ ] Rate limits configured
  - [ ] Security headers added

### Post-Deployment Verification

Run these tests after deployment:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Database connection
curl https://your-app.vercel.app/api/health/db

# Redis connection
curl https://your-app.vercel.app/api/health/cache

# Image upload (requires authentication)
curl -X POST https://your-app.vercel.app/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"
```

### Monitoring Verification

1. **Vercel Logs**: Check for errors in deployment logs
2. **Sentry**: Verify errors are being captured
3. **Google Analytics**: Check real-time traffic
4. **Database Metrics**: Monitor connection count
5. **Redis Metrics**: Check command execution

---

## Troubleshooting

### Database Connection Fails

**Error**: `P1001: Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` is set correctly
2. Check connection pooling is enabled
3. Verify SSL mode: `?sslmode=require`
4. Check database is running

### Cloudinary Upload Fails

**Error**: `401 Unauthorized`

**Solution**:
1. Verify API key and secret are correct
2. Check environment variable names match
3. Ensure unsigned preset if not using signature

### Email Not Sending

**Error**: `SMTP connection failed`

**Solution**:
1. Verify SendGrid API key is valid
2. Check domain is verified
3. Verify SMTP credentials
4. Check rate limits not exceeded

### Sentry Not Capturing Errors

**Solution**:
1. Verify DSN is correct
2. Check `NEXT_PUBLIC_SENTRY_DSN` is set
3. Ensure Sentry initialized in `_app.tsx`
4. Test with intentional error:
   ```typescript
   throw new Error('Sentry test error');
   ```

---

## Cost Summary

### Monthly Costs (Estimated)

| Service | Tier | Cost |
|---------|------|------|
| Vercel Pro (2 projects) | Pro | $40 |
| Vercel Postgres | Pro | $24 |
| Vercel KV | Free/Pro | $0-10 |
| Cloudinary | Free/Plus | $0-99 |
| SendGrid | Free/Essentials | $0-15 |
| Google Analytics | Free | $0 |
| Sentry | Developer | $0 |
| **Total** | | **$64-188** |

### Cost Optimization

1. Start with free tiers where available
2. Monitor usage closely
3. Upgrade only when limits reached
4. Use Vercel's included services (Postgres, KV)
5. Optimize image delivery with Cloudinary

---

## Next Steps

After completing this setup:

1. Run verification checklist
2. Document actual credentials in secure location (1Password, etc.)
3. Set up monitoring alerts
4. Create runbook for common operations
5. Schedule regular security audits
6. Proceed to Production Deployment Agent

---

Generated with [Claude Code](https://claude.com/claude-code)
