# Vercel GitHub Integration Guide - PartPal IMS

Complete guide for setting up automatic deployments from GitHub to Vercel for the PartPal IMS application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Vercel Dashboard Configuration](#vercel-dashboard-configuration)
4. [GitHub Integration Setup](#github-integration-setup)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Deployment Workflow](#deployment-workflow)
7. [Testing the Integration](#testing-the-integration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Project Structure

This is a **pnpm monorepo** with the following structure:

```
PartPalv2/
├── apps/
│   ├── ims/              <- Deploy this to Vercel
│   └── marketplace/      <- Separate deployment
├── packages/
│   ├── shared-ui/
│   ├── shared-types/
│   └── shared-utils/
├── vercel.json           <- Root configuration
└── pnpm-workspace.yaml
```

### Deployment Strategy

- **Root Directory:** `apps/ims`
- **Build System:** pnpm workspaces
- **Framework:** Next.js 14
- **Branch Strategy:**
  - `dev` branch → Preview/Development environment
  - `main` branch → Production environment

---

## Prerequisites

### Required Accounts

1. **GitHub Account** with repository access
2. **Vercel Account** (connected to GitHub)
3. **Vercel CLI** installed locally: `npm i -g vercel`

### Repository Setup

Ensure your GitHub repository:
- Has the correct branch structure (dev, main)
- All configuration files are committed
- pnpm-lock.yaml is committed (required for reproducible builds)

---

## Vercel Dashboard Configuration

### Step 1: Access Project Settings

1. Go to: https://vercel.com/dashboard
2. Select your team/organization: **partpals-projects**
3. Select project: **part-pal-ims**
4. Click **Settings**

### Step 2: Configure Build & Development Settings

Navigate to **Settings → Build & Development Settings**

Configure the following settings:

```
Framework Preset: Next.js

Root Directory: apps/ims
  ☑ Include source files outside of the Root Directory in the Build Step

Build Command: pnpm build

Output Directory: .next

Install Command: pnpm install

Development Command: pnpm dev -p 3001
```

### Step 3: Configure General Settings

Navigate to **Settings → General**

```
Node.js Version: 20.x
  (18.x also works, but 20.x is recommended)

Package Manager: pnpm
```

### Step 4: Save Configuration

Click **Save** at the bottom of each section.

---

## GitHub Integration Setup

### Step 1: Connect GitHub Repository

1. In Vercel Dashboard, go to **Settings → Git**
2. If not connected, click **Connect Git Repository**
3. Select **GitHub**
4. Authorize Vercel to access your GitHub account
5. Select repository: **PartPalv2** (or your repository name)

### Step 2: Configure Branch Deployments

Navigate to **Settings → Git → Deploy Branches**

Configure deployment branches:

```
Production Branch: main
  ☑ Automatically deploy commits to this branch

Preview Branches:
  ☑ Automatically deploy commits to the following branches:
    - dev
    - feature/*
    - staging
```

### Step 3: Configure Build Settings

Navigate to **Settings → Git → Deploy Hooks**

Optional: Create deploy hooks for manual triggers if needed.

---

## Environment Variables Configuration

### Critical Variables (Required)

Add these in **Settings → Environment Variables**:

```bash
# Database
DATABASE_URL
  Value: postgresql://user:password@host:5432/database
  Environments: ☑ Production ☑ Preview ☑ Development

# Redis Cache
REDIS_URL
  Value: redis://default:password@host:6379
  Environments: ☑ Production ☑ Preview ☑ Development

# JWT Authentication
JWT_SECRET
  Value: your-secure-random-string
  Environments: ☑ Production ☑ Preview ☑ Development

JWT_EXPIRES_IN
  Value: 7d
  Environments: ☑ Production ☑ Preview ☑ Development

# API Configuration
NEXT_PUBLIC_API_URL
  Production: https://your-production-domain.com/api
  Preview: https://your-preview-domain.vercel.app/api
  Development: http://localhost:3001/api
```

### Optional Variables (Recommended)

```bash
# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Email Service
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
FROM_EMAIL

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

# Sentry Error Tracking
SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT

# Payments (if enabled)
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### Adding Environment Variables

Two methods:

#### Method 1: Via Dashboard

1. Go to **Settings → Environment Variables**
2. Click **Add New**
3. Enter Name and Value
4. Select environments (Production/Preview/Development)
5. Click **Save**

#### Method 2: Via CLI

```bash
# Add single variable
vercel env add DATABASE_URL production preview development

# Pull existing variables to local
vercel env pull .env.local
```

---

## Deployment Workflow

### Automatic Deployments (GitHub Integration)

Once configured, deployments happen automatically:

#### Development Environment (Preview)
```bash
# 1. Make changes locally
git add .
git commit -m "Your commit message"

# 2. Push to dev branch
git push origin dev

# 3. Vercel automatically:
#    - Detects the push
#    - Runs pnpm install
#    - Builds the application
#    - Deploys to preview URL
#    - Comments on PR/commit with deployment URL
```

#### Production Environment
```bash
# 1. Merge dev to main (via PR)
git checkout main
git merge dev
git push origin main

# 2. Vercel automatically:
#    - Deploys to production
#    - Updates production URL
```

### Manual Deployments (CLI)

If you need to deploy manually:

#### Deploy to Preview
```bash
# From repository root
vercel

# Or specify environment
vercel --env preview
```

#### Deploy to Production
```bash
vercel --prod
```

---

## File Configuration

### Root vercel.json

File: `/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/ims && pnpm build",
  "devCommand": "cd apps/ims && pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/ims/.next"
}
```

Note: These settings are overridden by Dashboard settings, but provide defaults.

### IMS App vercel.json

File: `/apps/ims/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "functions": {
    "app/**/*.{js,ts,tsx}": {
      "maxDuration": 30
    },
    "pages/api/**/*.{js,ts}": {
      "maxDuration": 30
    }
  }
}
```

### .gitignore Updates

Ensure `.gitignore` includes:

```gitignore
# Vercel
.vercel
.vercel/**
apps/*/.vercel
apps/*/.vercel/**

# Environment Variables
.env*.local
!.env.example
!.env.vercel.example

# Build outputs
.next/
apps/*/.next/
```

---

## Testing the Integration

### Test Checklist

After configuration, verify:

- [ ] GitHub repository is connected in Vercel Dashboard
- [ ] Root Directory is set to `apps/ims`
- [ ] Install Command is set to `pnpm install`
- [ ] Build Command is set to `pnpm build`
- [ ] All critical environment variables are configured
- [ ] Branch deployments are enabled

### Testing Deployment

1. **Make a test commit to dev branch:**

```bash
# Create a small change
echo "# Test" >> apps/ims/README.md

# Commit and push
git add .
git commit -m "Test: Verify Vercel deployment"
git push origin dev
```

2. **Monitor Deployment:**

- Go to https://vercel.com/partpals-projects/part-pal-ims/deployments
- Watch the build progress
- Check for any errors

3. **Verify Deployment:**

- Click on the deployment URL
- Test homepage loads
- Test login page
- Test dashboard
- Check browser console for errors

---

## Deployment URLs

### URL Structure

```
Production (main branch):
https://part-pal-ims.vercel.app
https://your-custom-domain.com  (if configured)

Preview (dev branch):
https://part-pal-ims-git-dev-partpals-projects.vercel.app

Preview (PR/branch):
https://part-pal-ims-git-<branch>-partpals-projects.vercel.app

Unique deployment:
https://part-pal-ims-<hash>-partpals-projects.vercel.app
```

---

## Troubleshooting

### Issue: "Unsupported URL Type workspace:"

**Cause:** Vercel is using npm instead of pnpm

**Solution:**
1. Go to Dashboard → Settings → Build & Development Settings
2. Verify Install Command is: `pnpm install`
3. Go to Settings → General
4. Verify Node.js version is 18.x or 20.x
5. Redeploy

### Issue: "No Next.js version detected"

**Cause:** Root Directory is not set correctly

**Solution:**
1. Go to Dashboard → Settings → Build & Development Settings
2. Set Root Directory to: `apps/ims`
3. Check "Include source files outside of the Root Directory"
4. Save and redeploy

### Issue: Build fails with module not found errors

**Cause:** Workspace dependencies not resolved

**Solution:**
1. Ensure `pnpm-workspace.yaml` is in repository root
2. Ensure `pnpm-lock.yaml` is committed
3. Install Command should be: `pnpm install` (not filtered)
4. Build Command should be: `pnpm build` (Vercel runs from Root Directory)

### Issue: Environment variables not available

**Cause:** Variables not set for correct environment

**Solution:**
1. Go to Settings → Environment Variables
2. Ensure variables are checked for correct environments
3. Redeploy after adding variables

### Issue: Deployment succeeds but app doesn't work

**Cause:** Missing critical environment variables

**Solution:**
1. Check deployment logs for errors
2. Verify DATABASE_URL is set
3. Verify REDIS_URL is set
4. Verify JWT_SECRET is set
5. Check browser console for API errors

---

## GitHub Workflow Integration

### Deployment Status

GitHub will show Vercel deployment status:

- Commit status checks show deployment progress
- PR comments include preview URLs
- Deployment status visible in commit history

### Branch Protection (Optional)

Configure in GitHub Settings → Branches:

```
Branch name pattern: main

Require status checks to pass:
  ☑ Vercel deployment
  ☑ Build succeeds

Require branches to be up to date:
  ☑ Enabled
```

---

## Monitoring Deployments

### Vercel Dashboard

Monitor at: https://vercel.com/partpals-projects/part-pal-ims

**Deployment Logs:**
- Real-time build output
- Install/build/deploy phases
- Error messages
- Performance metrics

**Runtime Logs:**
- Function execution logs
- API errors
- Performance metrics

### GitHub Checks

View in GitHub:
- Commit status checks
- PR deployment previews
- Automated comments with URLs

---

## Best Practices

### Commit Messages

Use conventional commits for clarity:

```
feat: Add new vehicle search feature
fix: Resolve login authentication issue
chore: Update dependencies
docs: Update API documentation
```

### Branch Strategy

```
main       -> Production deployments only
dev        -> Development/staging previews
feature/*  -> Feature branch previews
hotfix/*   -> Urgent production fixes
```

### Environment Variables

- Never commit .env files
- Use Vercel Dashboard for sensitive values
- Document required variables in README
- Use different values for preview/production

### Database Migrations

For database changes:

1. Test locally first
2. Deploy to preview environment
3. Run migrations on preview database
4. Test thoroughly
5. Deploy to production
6. Run production migrations

---

## Next Steps

### After Initial Setup

1. [ ] Configure custom domain (if needed)
2. [ ] Set up monitoring and alerts
3. [ ] Configure Sentry for error tracking
4. [ ] Set up performance monitoring
5. [ ] Configure CDN and caching
6. [ ] Set up database backups
7. [ ] Configure CI/CD for tests

### Custom Domain Setup

1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Verify domain ownership
5. Configure SSL (automatic)

---

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- Vercel pnpm Support: https://vercel.com/docs/monorepos/pnpm
- Vercel CLI Reference: https://vercel.com/docs/cli
- Next.js Deployment: https://nextjs.org/docs/deployment

---

## Summary

The GitHub integration is configured with:

1. **Automatic deployments** from GitHub pushes
2. **Preview deployments** for dev branch and PRs
3. **Production deployments** from main branch
4. **Environment-specific** variables
5. **Monorepo support** with pnpm workspaces
6. **Build optimization** with caching

Once configured in the Vercel Dashboard, all deployments will happen automatically when you push to GitHub.

---

**Last Updated:** October 22, 2025
**Project:** PartPal IMS
**Deployment Platform:** Vercel
**Repository:** PartPalv2
