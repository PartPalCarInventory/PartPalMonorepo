# Vercel Quick Commands - PartPal IMS

Quick reference for common Vercel deployment commands.

---

## Local Development Testing

```bash
# Test IMS app with Vercel dev server
cd apps/ims
vercel dev --yes

# Access at: http://localhost:3000
```

---

## Deployment Commands

### Deploy to Preview (for testing)
```bash
cd apps/ims
vercel
```

### Deploy to Production
```bash
cd apps/ims
vercel --prod
```

### Deploy with Build Logs
```bash
cd apps/ims
vercel --prod --debug
```

---

## Environment Variables

### Add Environment Variable
```bash
# Production only
vercel env add VARIABLE_NAME production

# All environments
vercel env add VARIABLE_NAME production preview development
```

### Pull Environment Variables
```bash
cd apps/ims
vercel env pull .env.local
```

### List Environment Variables
```bash
vercel env ls
```

---

## Project Management

### Link to Existing Project
```bash
cd apps/ims
vercel link
```

### Check Project Status
```bash
vercel ls
```

### View Deployment Logs
```bash
vercel logs <deployment-url>
```

---

## Common Issues & Fixes

### Issue: JSX Runtime Error (500)
**Cause:** Running vercel from root directory
**Fix:** Always run from `apps/ims/` directory

```bash
# Wrong
vercel dev

# Correct
cd apps/ims && vercel dev --yes
```

### Issue: Module Not Found
**Cause:** Dependencies not installed
**Fix:** Install from root (handles workspace dependencies)

```bash
cd ../..
pnpm install
cd apps/ims
vercel dev --yes
```

### Issue: Build Fails on Vercel
**Cause:** Missing environment variables
**Fix:** Add required environment variables

```bash
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add JWT_SECRET production
```

---

## Critical Environment Variables

Required for deployment:

```bash
DATABASE_URL              # PostgreSQL connection
REDIS_URL                 # Redis cache
JWT_SECRET                # Authentication secret
NEXT_PUBLIC_API_URL       # API endpoint
```

Optional but recommended:

```bash
CLOUDINARY_CLOUD_NAME     # Image storage
CLOUDINARY_API_KEY        # Image storage
CLOUDINARY_API_SECRET     # Image storage
```

---

## Useful URLs

- Vercel Dashboard: https://vercel.com/dashboard
- Project Settings: https://vercel.com/partpals-projects/ims/settings
- Environment Variables: https://vercel.com/partpals-projects/ims/settings/environment-variables
- Deployment Logs: https://vercel.com/partpals-projects/ims/deployments

---

## Testing Checklist

Before deploying to production:

- [ ] Test locally with `vercel dev`
- [ ] All pages load (/, /login, /dashboard)
- [ ] Database connection configured
- [ ] Redis cache configured
- [ ] Environment variables set
- [ ] Preview deployment tested
- [ ] No build errors
- [ ] No runtime errors

---

## Marketplace Deployment

To deploy the marketplace app separately:

```bash
cd apps/marketplace
vercel link --yes
vercel --prod
```

---

**Last Updated:** October 22, 2025
**Project:** PartPal IMS
