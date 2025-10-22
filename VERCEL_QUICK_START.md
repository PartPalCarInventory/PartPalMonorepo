# PartPal Vercel Quick Start Guide

The absolute fastest way to get PartPal running on Vercel (30 minutes from start to finish).

## What You'll Get

- PartPal IMS running at `your-project-ims.vercel.app`
- PartPal Marketplace running at `your-project-marketplace.vercel.app`
- Free tier services (no credit card required for testing)

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Code pushed to GitHub repository

## Step 1: Quick Account Setup (10 minutes)

### 1. Vercel
```bash
# Install CLI
npm i -g vercel

# Login
vercel login
```

### 2. Database - Supabase (Easiest Free Option)
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New project"
5. Fill in:
   - Name: `partpal`
   - Database Password: (create strong password - save it!)
   - Region: `South Africa (Cape Town)` or closest
6. Click "Create new project" (wait 2 minutes)
7. Go to Settings > Database
8. Copy "Connection string" (Connection pooling mode)
9. Replace `[YOUR-PASSWORD]` with your actual password

### 3. Redis - Upstash (Easiest Free Option)
1. Go to https://upstash.com
2. Sign up with GitHub
3. Click "Create database"
4. Name: `partpal-cache`
5. Type: Regional
6. Region: Europe (closest available)
7. TLS: Enabled
8. Click "Create"
9. Copy connection details

### 4. Cloudinary (Image Storage)
1. Go to https://cloudinary.com
3. Go to Dashboard
4. Copy: Cloud name, API Key, API Secret

---

## Step 2: Deploy IMS (10 minutes)

### Via Vercel Dashboard

1. Go to https://vercel.com/new

2. Import your GitHub repository

3. Configure:
   - **Project Name**: `partpal-ims`
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" and enter `apps/ims`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @partpal/ims build
     ```
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. Before clicking Deploy, add environment variables:

Click "Environment Variables" and add:

```env
# Required - Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true

# Required - Redis
REDIS_URL=redis://default:[PASSWORD]@[HOST].upstash.io:6379

# Required - Auth
JWT_SECRET=your_super_secret_key_at_least_32_characters_long_for_production

# Required - Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Required - URLs (update after deployment)
NEXT_PUBLIC_API_URL=https://partpal-ims.vercel.app
NEXT_PUBLIC_IMS_URL=https://partpal-ims.vercel.app
NEXT_PUBLIC_MARKETPLACE_URL=https://partpal-marketplace.vercel.app

# Optional but recommended
NODE_ENV=production
SECURE_COOKIES=true
TRUST_PROXY=true
```

5. Click "Deploy"

6. Wait 5-10 minutes for build

7. Once deployed, click on the deployment URL to get your live URL

---

## Step 3: Deploy Marketplace (10 minutes)

1. Go to https://vercel.com/new again

2. Import same GitHub repository

3. Configure:
   - **Project Name**: `partpal-marketplace`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/marketplace`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @partpal/marketplace build
     ```
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. Add environment variables:

```env
# Required - Database (same as IMS)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true

# Required - Redis (same as IMS)
REDIS_URL=redis://default:[PASSWORD]@[HOST].upstash.io:6379

# Required - Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name

# Location-based filtering (via seller location)

# Required - URLs
NEXT_PUBLIC_API_URL=https://partpal-ims.vercel.app
NEXT_PUBLIC_IMS_URL=https://partpal-ims.vercel.app
NEXT_PUBLIC_MARKETPLACE_URL=https://partpal-marketplace.vercel.app

# Optional
NODE_ENV=production
```

5. Click "Deploy"

6. Wait for deployment

---

## Step 4: Initialize Database (5 minutes)

After both apps are deployed:

```bash
# From your local project root
cd /home/x-ubuntu/projects/PartPalv2

# Install dependencies
pnpm install

# Set your production database URL
export DATABASE_URL="your_supabase_connection_string"

# Generate Prisma client
cd packages/database
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database with initial data
pnpm prisma db seed
```

If seed script doesn't exist, you can manually create an admin user:

```bash
# Open Prisma Studio
pnpm prisma studio

# Or connect via Supabase dashboard SQL editor
```

---

## Step 5: Test Your Deployment (5 minutes)

### Test IMS
1. Visit your IMS URL: `https://partpal-ims.vercel.app`
2. Try to access the app
3. Check browser console for errors

### Test Marketplace
1. Visit your Marketplace URL: `https://partpal-marketplace.vercel.app`
2. Browse the site
3. Check that map loads

### Check Logs
If something doesn't work:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Functions" tab
4. Click on any function to see logs

---

## Common Quick Fixes

### Build Failed

**Error**: "Cannot find module '@partpal/shared-types'"

**Fix**:
- Ensure Build Command includes `cd ../.. && pnpm install`
- Rebuild: Click "Deployments" > "Redeploy"

### Database Connection Failed

**Error**: "Can't reach database server"

**Fix**:
- Check DATABASE_URL is correct
- Ensure you used the **pooled connection** (port 6543 for Supabase)
- Verify password has no special characters that need escaping

### Images Don't Load

**Error**: Images show broken icon

**Fix**:
- Check Cloudinary credentials
- Verify domain added to `next.config.js` (already done in repo)

### Redis Connection Timeout

**Error**: Redis connection timeout

**Fix**:
- Verify REDIS_URL format: `redis://default:PASSWORD@host:port`
- Check Upstash dashboard that database is active

---

## Next Steps

Now that you have a basic deployment:

1. **Add Custom Domain** (Optional)
   - Go to Project > Settings > Domains
   - Add your domain
   - Configure DNS

2. **Enable Monitoring**
   ```bash
   pnpm add @vercel/analytics
   ```
   Add to `_app.tsx`:
   ```typescript
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

3. **Set Up Error Tracking**
   - Sign up at https://sentry.io
   - Run: `npx @sentry/wizard@latest -i nextjs`
   - Follow prompts

4. **Review Full Deployment Guide**
   - See `VERCEL_DEPLOYMENT_GUIDE.md` for comprehensive setup
   - See `VERCEL_DEPLOYMENT_CHECKLIST.md` for detailed checklist

---

## Cost Breakdown (Free Tier)

All these services have free tiers suitable for testing:

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| Vercel | 100 GB bandwidth/month | $20/month for Pro |
| Supabase | 500 MB database | $25/month |
| Upstash | 10k requests/day | Usage-based |
| Cloudinary | 25 credits/month | $0.02/credit |
| Location Filtering | Included | Via seller info |

**Total**: $0 for development/testing

**Production**: ~$45-70/month with moderate traffic

---

## Troubleshooting

### Build Logs
```bash
# View logs via CLI
vercel logs [deployment-url]

# Or check Dashboard > Deployments > Click deployment > View Function Logs
```

### Check Environment Variables
```bash
# Pull environment variables locally
vercel env pull .env.local
```

### Test Locally with Production Environment
```bash
# Install dependencies
pnpm install

# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run in production mode
pnpm dev
```

### Redeploy
```bash
# Redeploy from CLI
cd apps/ims
vercel --prod

# Or use Dashboard > Deployments > Redeploy
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Community**: https://vercel.com/discord
- **Full Guide**: See `VERCEL_DEPLOYMENT_GUIDE.md` in this repo
- **Checklist**: See `VERCEL_DEPLOYMENT_CHECKLIST.md`

---

## What's Different from Docker Deployment?

| Aspect | Docker/K8s | Vercel |
|--------|------------|--------|
| Setup Time | 10-20 hours | 30 minutes |
| Scaling | Manual | Automatic |
| Server Management | Required | None |
| SSL Certificates | Manual | Automatic |
| CDN | Additional setup | Built-in global |
| Cost | $26-50/month + time | $0-70/month |

**Vercel Trade-offs**:
- Less control over infrastructure
- Serverless cold starts (first request slower)
- Function execution time limits (30 seconds max)
- Better for frontend-heavy apps

---

**Congratulations!** You now have PartPal running on Vercel in under 30 minutes.

For production deployment with custom domains, monitoring, and advanced features, follow the complete guide in `VERCEL_DEPLOYMENT_GUIDE.md`.
