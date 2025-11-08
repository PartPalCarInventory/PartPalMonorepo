# PartPal Vercel Deployment - Quick Start Guide

**Last Updated**: 2025-10-24

This is a quick reference for deploying PartPal to Vercel. For detailed information, see `VERCEL_DEPLOYMENT_GUIDE.md` and `CICD_SETUP.md`.

## Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Vercel CLI installed: `pnpm add -g vercel@latest`
- [ ] PostgreSQL database ready (Vercel Postgres, Supabase, or Neon)
- [ ] Redis instance ready (Upstash recommended)
- [ ] Cloudinary account for images
- [ ] All environment variables prepared

## Quick Setup (30 Minutes)

### Step 1: Get Vercel Credentials (5 min)

```bash
# Install Vercel CLI
pnpm add -g vercel@latest

# Login
vercel login

# Link project
cd apps/ims
vercel link

# Get credentials
cat .vercel/project.json
# Copy orgId and projectId
```

### Step 2: Add GitHub Secrets (5 min)

Go to GitHub: `Settings > Secrets and variables > Actions > New repository secret`

Add these secrets:
```
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # From step 1
VERCEL_PROJECT_ID     # From step 1
```

### Step 3: Configure Vercel Project (10 min)

In Vercel Dashboard for your project:

1. **Settings > General**:
   - Framework: Next.js
   - Root Directory: `apps/ims`
   - Node.js Version: `18.x`

2. **Settings > Environment Variables**:
   Add at minimum:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=<random-32-char-string>
   CLOUDINARY_CLOUD_NAME=your-cloud
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   NODE_ENV=production
   ```

3. **Settings > Git**:
   - Production Branch: `main`
   - Enable "Automatically deploy all pushes"

### Step 4: Test Deployment (10 min)

```bash
# Create test branch
git checkout -b test-vercel-deployment

# Make a small change
echo "# Vercel Test" >> README.md

# Commit and push
git add .
git commit -m "test: Verify Vercel deployment"
git push origin test-vercel-deployment

# Create PR on GitHub
# Check GitHub Actions for deployment status
# Verify preview URL appears in PR comment
```

## Daily Workflow

### Creating a Feature

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Commit
git add .
git commit -m "feat: Add my feature"

# Push
git push origin feature/my-feature

# Create PR - automatic preview deployment will trigger
```

### Deploying to Production

```bash
# Merge PR to main via GitHub
# Automatic production deployment will trigger

# Or manual deployment:
git checkout main
git pull
vercel --prod
```

## Common Commands

### Local Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build locally
pnpm build
```

### Vercel CLI

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# View project
vercel inspect

# Pull env variables
vercel env pull .env.local
```

### Deployment Management

```bash
# Check deployment status
gh pr checks

# View GitHub Actions
gh run list

# View specific run
gh run view [run-id]

# Cancel deployment
gh run cancel [run-id]
```

## Environment Variables Quick Reference

### Essential Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Images
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

### Optional Variables

```env
# Redis (if using)
REDIS_URL=redis://...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Monitoring
SENTRY_DSN=https://...
```

## Troubleshooting Quick Fixes

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules .turbo
pnpm install
pnpm build

# Check for type errors
pnpm typecheck

# Check for lint errors
pnpm lint
```

### Deployment Fails

1. Check Vercel Dashboard > Deployments > View Logs
2. Verify environment variables are set
3. Check GitHub Actions logs
4. Try manual deployment: `vercel --prod`

### Preview Not Working

1. Check PR has no conflicts
2. Verify GitHub Actions completed
3. Check Vercel project is linked
4. Try commenting `/vercel` in PR

### Database Connection Issues

```env
# Add connection pooling
DATABASE_URL=postgresql://...?pgbouncer=true&connect_timeout=15

# Or use direct URL
POSTGRES_URL_NON_POOLING=postgresql://...
```

## Quick Health Checks

### After Deployment

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Check database connection
curl https://your-app.vercel.app/api/health/db

# View recent logs
vercel logs --follow
```

### Performance Check

```bash
# Run Lighthouse
pnpm dlx lighthouse https://your-app.vercel.app

# Check Core Web Vitals
# Visit: Vercel Dashboard > Analytics > Web Vitals
```

## Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/[your-org]/[your-repo]/actions
- **Documentation**:
  - `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment guide
  - `CICD_SETUP.md` - CI/CD pipeline documentation
  - `CICD_COMPLETION_SUMMARY.md` - What's been set up

## Getting Help

### Issue Checklist

Before asking for help:
- [ ] Check GitHub Actions logs
- [ ] Check Vercel deployment logs
- [ ] Verify environment variables
- [ ] Try local build: `pnpm build`
- [ ] Check Vercel status: https://vercel-status.com
- [ ] Check GitHub status: https://githubstatus.com

### Support Channels

1. **Internal**: Check project documentation
2. **Vercel**: https://vercel.com/support
3. **Community**: https://github.com/vercel/vercel/discussions

## Quick Tips

1. **Always test locally first**: `pnpm build` before pushing
2. **Use preview deployments**: Test changes before merging
3. **Monitor costs**: Check Vercel billing dashboard weekly
4. **Keep secrets safe**: Never commit `.env` files
5. **Document changes**: Update environment variables doc when adding new vars

## Emergency Procedures

### Rollback Deployment

```bash
# Via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." > "Promote to Production"

# Via CLI:
vercel rollback [deployment-url]
```

### Database Emergency

```bash
# Restore from backup (if using Vercel Postgres)
# Contact support for restore

# Or restore from SQL backup
psql $DATABASE_URL < backup.sql
```

## Success Metrics

Track these metrics:
- **Deployment Success Rate**: Should be >95%
- **Build Time**: Should be <5 minutes
- **Preview Deployment Time**: Should be <3 minutes
- **Failed Deployments**: Should be <5%

## Next Steps After First Deployment

1. [ ] Configure custom domain
2. [ ] Enable Vercel Analytics
3. [ ] Set up error tracking (Sentry)
4. [ ] Configure branch protection rules
5. [ ] Set up deployment notifications
6. [ ] Create runbook for common operations
7. [ ] Schedule regular security audits

---

For detailed information, refer to:
- `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `CICD_SETUP.md` - CI/CD pipeline documentation

Generated with [Claude Code](https://claude.com/claude-code)
