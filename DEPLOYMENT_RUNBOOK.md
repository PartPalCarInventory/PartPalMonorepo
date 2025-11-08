# PartPal Production Deployment Runbook

**Last Updated**: 2025-10-24
**Version**: 1.0.0
**Status**: Production Deployment Agent

This runbook provides step-by-step procedures for deploying PartPal IMS to Vercel in production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Project Configuration](#vercel-project-configuration)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [Initial Deployment](#initial-deployment)
6. [Domain Configuration](#domain-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring Setup](#monitoring-setup)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Prerequisites Verification

Run these checks before deployment:

```bash
# 1. Verify all tests pass
pnpm test -- --coverage --passWithNoTests

# 2. Run type checking
pnpm typecheck

# 3. Run linting
pnpm lint

# 4. Verify build succeeds locally
pnpm build

# 5. Verify environment variables
node scripts/verify-env.js

# 6. Check git status
git status
```

### Required Accounts and Access

- [ ] Vercel account with appropriate permissions
- [ ] GitHub repository access
- [ ] Domain registrar access (for custom domains)
- [ ] Cloudinary account configured
- [ ] SendGrid account configured
- [ ] Database access (Vercel Postgres or external)
- [ ] 1Password or secrets manager with credentials

### Code Quality Gates

- [ ] All GitHub Actions workflows passing
- [ ] No security vulnerabilities (high/critical)
- [ ] Test coverage meets requirements (70%+ for IMS)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All PRs reviewed and merged

### Documentation

- [ ] CHANGELOG.md updated with new features/fixes
- [ ] Environment variables documented
- [ ] Migration scripts tested
- [ ] Rollback plan prepared

---

## Vercel Project Configuration

### Step 1: Create Vercel Project

#### Via Dashboard

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your GitHub repository: `[your-org]/PartPalv2`
4. Click **Import**

5. **Configure Project**:
   - **Project Name**: `partpal-ims`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/ims`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @partpal/ims build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
   - **Development Command**: `pnpm dev`

6. **DO NOT DEPLOY YET** - Click **Skip** on deployment

#### Via CLI

```bash
# Install Vercel CLI if not already installed
pnpm add -g vercel@latest

# Login to Vercel
vercel login

# Navigate to IMS directory
cd apps/ims

# Link to Vercel project (creates new project)
vercel link

# Follow prompts:
# - Set up and deploy? No (we'll configure first)
# - Link to existing project? No
# - Project name: partpal-ims
# - In which directory is your code located? ./

# This creates .vercel directory with project config
```

### Step 2: Configure Build Settings

Go to Vercel Dashboard > Your Project > Settings > General:

1. **Node.js Version**: `18.x` or `20.x`
2. **Package Manager**: `pnpm`
3. **Root Directory**: `apps/ims`

Go to Settings > Build & Development Settings:

```bash
# Build Command
cd ../.. && pnpm install && pnpm --filter @partpal/ims build

# Output Directory
.next

# Install Command
pnpm install

# Development Command
cd ../.. && pnpm dev --filter @partpal/ims
```

### Step 3: Configure Git Integration

Settings > Git:

1. **Production Branch**: `main`
2. **Enable Automatic Deployments**: ✓ (for production branch)
3. **Preview Deployments**: Enabled for all branches
4. **Comments on Pull Requests**: Enabled
5. **Deployment Protection**: Enabled (Vercel Pro)

### Step 4: Configure Functions

Settings > Functions:

1. **Function Region**: Select closest to your users
   - For South Africa: `Frankfurt (fra1)` or `Cape Town (cpt1)` if available
2. **Maximum Duration**: 10s (default) or 60s (Pro)
3. **Memory**: 1024 MB (default)

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)

#### Step 1: Create Database

1. Go to Vercel Dashboard > Storage
2. Click **Create Database**
3. Select **Postgres**
4. Configure:
   - **Name**: `partpal-production`
   - **Region**: Same as function region (`fra1`)
   - **Plan**: Pro ($24/month for 60GB)
5. Click **Create**

#### Step 2: Connect to Project

1. Once created, click **Connect Project**
2. Select **partpal-ims**
3. Vercel automatically adds environment variables:
   ```
   POSTGRES_URL
   POSTGRES_PRISMA_URL
   POSTGRES_URL_NON_POOLING
   POSTGRES_USER
   POSTGRES_HOST
   POSTGRES_PASSWORD
   POSTGRES_DATABASE
   ```

#### Step 3: Add Prisma-Specific Variables

Add these manually in Settings > Environment Variables:

```bash
# For Prisma Client (uses pooled connection)
DATABASE_URL=$POSTGRES_PRISMA_URL

# For Prisma Migrate (uses direct connection)
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

#### Step 4: Run Migrations

```bash
# Pull production environment variables locally
vercel env pull .env.production

# Load production env
export $(cat .env.production | xargs)

# Navigate to database package
cd packages/database

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database with initial data (optional)
pnpm prisma db seed

# Verify database
pnpm prisma studio
```

### Option 2: External Postgres (Supabase/Neon)

If using external database:

1. Create database at your provider
2. Get connection string with SSL enabled
3. Add to Vercel environment variables:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:6543/db?sslmode=require&pgbouncer=true
   DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```
4. Run migrations as above

---

## Environment Variables

### Step 1: Generate Secrets

```bash
# Generate all production secrets
node scripts/generate-secrets.js all

# Save output to 1Password or secure location
```

### Step 2: Add to Vercel

Go to Settings > Environment Variables.

#### Critical Variables (Production Only)

```bash
# Database (auto-added if using Vercel Postgres)
DATABASE_URL=$POSTGRES_PRISMA_URL
DIRECT_DATABASE_URL=$POSTGRES_URL_NON_POOLING

# Authentication (use generated secrets)
JWT_SECRET=[generated-secret-32-chars]
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Cloudinary (from Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=[your-cloud-name]
CLOUDINARY_API_KEY=[your-api-key]
CLOUDINARY_API_SECRET=[your-api-secret]

# Email (from SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=[your-sendgrid-api-key]
FROM_EMAIL=noreply@partpal.co.za
FROM_NAME=PartPal

# Security
CORS_ORIGIN=https://ims.partpal.co.za,https://partpal.co.za
SECURE_COOKIES=true
TRUST_PROXY=true
COOKIE_DOMAIN=.partpal.co.za
```

#### Public Variables (All Environments)

```bash
# URLs (update after domain configuration)
NEXT_PUBLIC_API_URL=https://ims.partpal.co.za/api
NEXT_PUBLIC_MARKETPLACE_URL=https://partpal.co.za
NEXT_PUBLIC_IMS_URL=https://ims.partpal.co.za

# Cloudinary (public)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[your-cloud-name]

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=[your-ga-id]

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=[your-sentry-dsn]
```

#### Configuration Variables

```bash
# Environment
NODE_ENV=production
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=900

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=10

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
FEATURE_PUSH_NOTIFICATIONS=true
```

### Step 3: Add via CLI (Alternative)

```bash
# Add variables one by one
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add CLOUDINARY_API_SECRET production

# Or import from file (be careful with this!)
# Create .env.production.vercel with your variables
# Then import (if Vercel supports it)
```

### Step 4: Verify Variables

```bash
# List all environment variables
vercel env ls

# Pull to verify
vercel env pull .env.check

# Verify locally
cat .env.check | grep -v "^#" | grep -v "^$"
```

---

## Initial Deployment

### Step 1: Preview Deployment

First, deploy to preview environment to test:

```bash
# Deploy to preview (not production)
cd apps/ims
vercel

# This will:
# 1. Build the application
# 2. Deploy to preview URL
# 3. Return preview URL: https://partpal-ims-[hash].vercel.app

# Test the preview deployment
curl https://[preview-url]/api/health
```

### Step 2: Test Preview Deployment

Visit the preview URL and test:

- [ ] Application loads without errors
- [ ] Can navigate to login page
- [ ] Database connection works
- [ ] Images can be uploaded (Cloudinary)
- [ ] No console errors
- [ ] Responsive design works
- [ ] API endpoints responding

### Step 3: Check Vercel Logs

```bash
# View deployment logs
vercel logs [deployment-url]

# Or in dashboard:
# Go to Deployments > Click deployment > View Function Logs
```

### Step 4: Production Deployment

Once preview is verified:

#### Via CLI

```bash
# Deploy to production
cd apps/ims
vercel --prod

# This will:
# 1. Build with production optimizations
# 2. Deploy to production
# 3. Assign to production domain
```

#### Via Dashboard

1. Go to Deployments
2. Find your preview deployment
3. Click "..." menu
4. Select **Promote to Production**

#### Via Git Push (Automatic)

```bash
# Merge to main branch
git checkout main
git merge dev
git push origin main

# GitHub Actions will trigger
# Vercel will auto-deploy from main branch
```

### Step 5: Monitor Deployment

Watch deployment progress:

```bash
# Via CLI
vercel logs --follow

# Via Dashboard
# Go to Deployments > Latest > View Logs
```

Deployment typically takes 3-5 minutes.

---

## Domain Configuration

### Step 1: Add Custom Domain

Go to Settings > Domains:

1. Click **Add Domain**
2. Enter: `ims.partpal.co.za`
3. Click **Add**

### Step 2: Configure DNS

Vercel will provide DNS records. Add to your DNS provider:

#### For Subdomain (ims.partpal.co.za)

```
Type: CNAME
Name: ims
Value: cname.vercel-dns.com
TTL: 3600
```

#### For Apex Domain (partpal.co.za) - If needed

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 3: Verify DNS Propagation

```bash
# Check DNS resolution
dig ims.partpal.co.za

# Or use online tool
# https://dnschecker.org

# Wait for propagation (5 minutes - 48 hours)
```

### Step 4: SSL Certificate

Vercel automatically provisions SSL:
- Certificate is issued by Let's Encrypt
- Auto-renewal every 90 days
- No configuration needed

Verify SSL:
```bash
curl -I https://ims.partpal.co.za
```

### Step 5: Update Environment Variables

Update URLs in environment variables:

```bash
NEXT_PUBLIC_IMS_URL=https://ims.partpal.co.za
CORS_ORIGIN=https://ims.partpal.co.za,https://partpal.co.za
```

Redeploy after updating:
```bash
vercel --prod
```

---

## Post-Deployment Verification

### Automated Tests

```bash
# Run post-deployment tests
./scripts/post-deployment-tests.sh

# Or manually:

# 1. Health check
curl https://ims.partpal.co.za/api/health

# Expected: {"status":"ok","timestamp":"..."}

# 2. Database health
curl https://ims.partpal.co.za/api/health/db

# Expected: {"status":"ok","database":"connected"}

# 3. Check static assets
curl -I https://ims.partpal.co.za/_next/static/css/[hash].css

# Expected: 200 OK
```

### Manual Verification

Test these features manually:

#### Authentication
- [ ] Sign up new user
- [ ] Login with credentials
- [ ] Logout
- [ ] Password reset flow
- [ ] JWT token issued correctly

#### Core Functionality
- [ ] Dashboard loads with data
- [ ] Can create vehicle
- [ ] Can add part to vehicle
- [ ] Can upload part images
- [ ] Images display correctly (Cloudinary)
- [ ] Can edit and delete records
- [ ] Search functionality works
- [ ] Filters work correctly

#### API Endpoints
- [ ] GET /api/vehicles returns data
- [ ] POST /api/vehicles creates record
- [ ] GET /api/parts returns data
- [ ] POST /api/parts creates record
- [ ] POST /api/upload uploads image

#### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images load quickly
- [ ] No memory leaks in logs

#### Security
- [ ] HTTPS enforced
- [ ] Secure cookies set
- [ ] CORS headers correct
- [ ] No sensitive data exposed
- [ ] Rate limiting active

### Monitor Key Metrics

Check Vercel Dashboard:

1. **Deployments**: Status is "Ready"
2. **Analytics**: Traffic is being tracked
3. **Logs**: No errors
4. **Functions**: Execution time reasonable
5. **Bandwidth**: Within limits

---

## Monitoring Setup

### Vercel Analytics

1. Go to Project > Analytics
2. Enable **Web Analytics**
3. Enable **Speed Insights**
4. Review Core Web Vitals

### Sentry Error Tracking

Verify Sentry is capturing errors:

```bash
# Trigger test error
curl https://ims.partpal.co.za/api/test-error

# Check Sentry dashboard for error
```

### Log Monitoring

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url]

# Filter logs
vercel logs --follow | grep ERROR
```

### Uptime Monitoring

Set up external uptime monitoring:

1. **Uptime Robot** (free): https://uptimerobot.com
   - Monitor: `https://ims.partpal.co.za/api/health`
   - Interval: 5 minutes
   - Alert: Email/SMS on downtime

2. **Vercel Built-in Monitoring** (Pro):
   - Go to Settings > Monitoring
   - Enable health checks

### Performance Monitoring

```bash
# Run Lighthouse audit
pnpm dlx lighthouse https://ims.partpal.co.za --view

# Check Core Web Vitals
# View in Vercel Analytics dashboard
```

---

## Rollback Procedures

### Quick Rollback (Via Dashboard)

1. Go to Vercel Dashboard > Deployments
2. Find previous working deployment
3. Click "..." menu
4. Click **Promote to Production**
5. Confirm promotion

**Time**: 30 seconds

### Rollback via CLI

```bash
# List recent deployments
vercel ls

# Find deployment URL of last working version
# Example: partpal-ims-abc123.vercel.app

# Promote to production
vercel promote [deployment-url]

# Or use rollback command (if available)
vercel rollback
```

**Time**: 1 minute

### Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard [commit-hash]
git push --force origin main

# Vercel will auto-deploy reverted code
```

**Time**: 3-5 minutes (includes build/deploy)

### Database Rollback

If migrations need rollback:

```bash
# Restore from backup
# (Vercel Postgres has automatic daily backups)

# Via Vercel Dashboard:
# 1. Go to Storage > Your Database
# 2. Click "Backups"
# 3. Select backup to restore
# 4. Click "Restore"

# Or manual SQL restore
psql $DATABASE_URL < backup.sql
```

### Rollback Verification

After rollback:

```bash
# Verify health
curl https://ims.partpal.co.za/api/health

# Check version/build
curl https://ims.partpal.co.za/api/version

# Test critical flows
# - Login
# - Dashboard
# - Create vehicle
```

---

## Troubleshooting

### Deployment Fails

**Issue**: Build fails during deployment

**Diagnosis**:
```bash
# Check build logs in Vercel dashboard
# Or via CLI
vercel logs [deployment-url]

# Look for:
# - Module not found errors
# - Type errors
# - Build command failures
```

**Solutions**:

1. **Module not found**:
   ```bash
   # Check workspace dependencies
   # Ensure all dependencies in package.json
   # Try shamefully-hoist for troublesome packages
   pnpm install --shamefully-hoist
   ```

2. **Type errors**:
   ```bash
   # Run locally
   pnpm typecheck

   # Fix errors and commit
   ```

3. **Build command fails**:
   ```bash
   # Verify build command is correct
   # In vercel.json or project settings
   cd ../.. && pnpm install && pnpm --filter @partpal/ims build
   ```

### Function Timeout

**Issue**: Serverless function times out (10s default)

**Diagnosis**:
```bash
# Check function logs
vercel logs | grep TIMEOUT

# Check function duration in dashboard
# Go to Deployments > Functions
```

**Solutions**:

1. **Increase timeout** (Vercel Pro):
   - Settings > Functions > Max Duration: 60s

2. **Optimize query**:
   ```typescript
   // Add indexes to database
   // Implement caching
   // Paginate large queries
   ```

3. **Use Edge Functions** for fast responses:
   ```typescript
   export const config = {
     runtime: 'edge',
   };
   ```

### Database Connection Issues

**Issue**: Cannot connect to database

**Diagnosis**:
```bash
# Check database health endpoint
curl https://ims.partpal.co.za/api/health/db

# Check environment variables
vercel env ls | grep DATABASE

# Check database status in Vercel Storage
```

**Solutions**:

1. **Verify connection string**:
   ```bash
   # Ensure using pooled connection
   DATABASE_URL=$POSTGRES_PRISMA_URL
   ```

2. **Check connection limits**:
   ```sql
   -- Connect to database
   SELECT count(*) FROM pg_stat_activity;

   -- Check max connections
   SHOW max_connections;
   ```

3. **Implement connection pooling**:
   ```typescript
   // Use @prisma/client with connection pooling
   // Or use external pooler (PgBouncer)
   ```

### Images Not Loading

**Issue**: Images fail to upload or display

**Diagnosis**:
```bash
# Check Cloudinary credentials
vercel env ls | grep CLOUDINARY

# Test upload manually
curl -X POST https://ims.partpal.co.za/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg"
```

**Solutions**:

1. **Verify API credentials**:
   ```bash
   # Check in Cloudinary dashboard
   # Ensure CLOUDINARY_API_SECRET is set
   ```

2. **Check upload preset**:
   ```bash
   # In Cloudinary console
   # Verify unsigned preset exists
   # Check folder permissions
   ```

3. **Check file size limits**:
   ```bash
   # Vercel has 4.5MB body size limit
   # Use Cloudinary direct upload for large files
   ```

### Environment Variables Not Loading

**Issue**: Variables undefined in application

**Diagnosis**:
```bash
# Check if variables are set
vercel env ls

# Pull locally to verify
vercel env pull .env.test
cat .env.test
```

**Solutions**:

1. **Redeploy after adding variables**:
   ```bash
   vercel --prod
   ```

2. **Check variable scope**:
   ```bash
   # Ensure set for "Production" environment
   # Public variables need NEXT_PUBLIC_ prefix
   ```

3. **Verify no typos**:
   ```bash
   # Variable names are case-sensitive
   # Check for extra spaces
   ```

### High Memory Usage

**Issue**: Functions running out of memory

**Diagnosis**:
```bash
# Check function logs for OOM errors
vercel logs | grep "Memory"

# Check memory usage in dashboard
```

**Solutions**:

1. **Increase function memory** (Pro):
   - Settings > Functions > Memory: 3008 MB

2. **Optimize code**:
   ```typescript
   // Stream large responses
   // Implement pagination
   // Clear unused variables
   ```

3. **Use Edge Functions** for static content

---

## Emergency Contacts

### Support Channels

- **Vercel Support**: support@vercel.com (Pro/Enterprise)
- **Vercel Community**: https://vercel.com/discord
- **Internal Team**: [Your team Slack channel]

### On-Call Procedures

1. **P0 (System Down)**:
   - Immediately rollback to last working version
   - Notify team in #incidents Slack channel
   - Check Vercel Status: https://vercel-status.com

2. **P1 (Critical Feature Down)**:
   - Assess impact
   - Rollback if necessary
   - Create incident report

3. **P2 (Degraded Performance)**:
   - Monitor metrics
   - Scale resources if needed
   - Investigate root cause

---

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor error rates in Sentry
- [ ] Check performance metrics in Vercel Analytics
- [ ] Verify all critical features working
- [ ] Review logs for any warnings
- [ ] Test backup/restore procedure

### Short-term (Week 1)

- [ ] Gather user feedback
- [ ] Monitor costs and usage
- [ ] Optimize slow queries
- [ ] Review and update documentation
- [ ] Create incident response plan

### Long-term (Month 1)

- [ ] Performance audit and optimization
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Backup and disaster recovery testing
- [ ] Documentation updates

---

## Success Metrics

Track these KPIs post-deployment:

- **Uptime**: Target 99.9%
- **Response Time**: < 500ms (p95)
- **Error Rate**: < 0.1%
- **Build Time**: < 5 minutes
- **Deployment Frequency**: On every PR merge
- **Mean Time to Recovery**: < 5 minutes

---

Generated with [Claude Code](https://claude.com/claude-code)
