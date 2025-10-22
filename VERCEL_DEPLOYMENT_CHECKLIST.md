# PartPal Vercel Deployment Checklist

Quick reference checklist for deploying PartPal to Vercel.

## Pre-Deployment (30 minutes)

### Repository Setup
- [ ] Code pushed to GitHub repository
- [ ] All changes committed
- [ ] `.gitignore` configured for Vercel
- [ ] `vercel.json` files created for both apps

### Local Testing
- [ ] Run `pnpm install` successfully
- [ ] Run `pnpm build` without errors
- [ ] Run `pnpm typecheck` passes
- [ ] Run `pnpm lint` passes
- [ ] Test both apps locally (`pnpm dev`)

### Configuration Files
- [ ] `apps/ims/vercel.json` configured
- [ ] `apps/marketplace/vercel.json` configured
- [ ] `apps/ims/next.config.js` - `output: 'standalone'` commented out
- [ ] `apps/marketplace/next.config.js` - `output: 'standalone'` commented out
- [ ] `.env.vercel.example` reviewed and values prepared

---

## Account Setup (20 minutes)

### Vercel
- [ ] Vercel account created at https://vercel.com
- [ ] GitHub account connected to Vercel
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Logged in to CLI: `vercel login`

### Database Service (Choose one)
- [ ] Vercel Postgres database created
- [ ] OR Supabase project created
- [ ] OR Neon project created
- [ ] Connection string saved securely
- [ ] Connection pooling enabled

### Redis Service
- [ ] Upstash Redis database created
- [ ] Connection details saved
- [ ] OR alternative Redis service configured

### Additional Services
- [ ] Cloudinary account created
- [ ] Cloudinary API keys obtained
- [ ] SendGrid account created (optional)
- [ ] SendGrid API key obtained (optional)

---

## Deploy IMS Application (15 minutes)

### Initial Deployment
- [ ] Navigate to https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Configure project settings:
  - [ ] Name: `partpal-ims`
  - [ ] Framework: Next.js
  - [ ] Root Directory: `apps/ims`
  - [ ] Build Command: `cd ../.. && pnpm install && pnpm --filter @partpal/ims build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `pnpm install`
  - [ ] Node.js Version: 18.x or 20.x

### Environment Variables - IMS
Add the following in Settings > Environment Variables:

**Database & Cache:**
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `REDIS_HOST`
- [ ] `REDIS_PORT`
- [ ] `REDIS_PASSWORD`

**Authentication:**
- [ ] `JWT_SECRET` (minimum 32 characters)
- [ ] `JWT_EXPIRES_IN` (e.g., "7d")
- [ ] `BCRYPT_ROUNDS` (e.g., "12")

**API & URLs:**
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `API_URL`
- [ ] `NEXT_PUBLIC_MARKETPLACE_URL`
- [ ] `NEXT_PUBLIC_IMS_URL`

**Cloudinary:**
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**Rate Limiting:**
- [ ] `RATE_LIMIT_AUTH_POINTS` (e.g., "5")
- [ ] `RATE_LIMIT_AUTH_DURATION` (e.g., "900")
- [ ] `RATE_LIMIT_GENERAL_POINTS` (e.g., "100")
- [ ] `RATE_LIMIT_GENERAL_DURATION` (e.g., "900")

**Security:**
- [ ] `CORS_ORIGIN` (comma-separated URLs)
- [ ] `SECURE_COOKIES` ("true")
- [ ] `TRUST_PROXY` ("true")

**Environment:**
- [ ] `NODE_ENV` ("production")
- [ ] `LOG_LEVEL` ("info")

**Optional - Stripe:**
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

**Optional - Email:**
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `FROM_EMAIL`

### Deploy
- [ ] Click "Deploy" button
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Note deployment URL (e.g., `partpal-ims.vercel.app`)

---

## Deploy Marketplace Application (15 minutes)

### Initial Deployment
- [ ] Navigate to https://vercel.com/new
- [ ] Import same GitHub repository
- [ ] Configure project settings:
  - [ ] Name: `partpal-marketplace`
  - [ ] Framework: Next.js
  - [ ] Root Directory: `apps/marketplace`
  - [ ] Build Command: `cd ../.. && pnpm install && pnpm --filter @partpal/marketplace build`
  - [ ] Output Directory: `.next`
  - [ ] Install Command: `pnpm install`
  - [ ] Node.js Version: 18.x or 20.x

### Environment Variables - Marketplace
Add the following in Settings > Environment Variables:

**Database & Cache:**
- [ ] `DATABASE_URL` (can be read-only replica)
- [ ] `REDIS_URL`

**API & URLs:**
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_MARKETPLACE_URL`
- [ ] `NEXT_PUBLIC_IMS_URL`

**Cloudinary:**
- [ ] `CLOUDINARY_CLOUD_NAME`


**Analytics:**
- [ ] `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` (optional)

**Error Tracking:**
- [ ] `SENTRY_DSN` (optional)
- [ ] `SENTRY_ORG` (optional)
- [ ] `SENTRY_PROJECT` (optional)

**Security:**
- [ ] `CORS_ORIGIN`
- [ ] `SECURE_COOKIES` ("true")

**Environment:**
- [ ] `NODE_ENV` ("production")
- [ ] `LOG_LEVEL` ("info")

**Feature Flags:**
- [ ] `FEATURE_ADVANCED_SEARCH` ("true")
- [ ] `FEATURE_MAP_INTEGRATION` ("true")

### Deploy
- [ ] Click "Deploy" button
- [ ] Wait for deployment to complete
- [ ] Note deployment URL (e.g., `partpal-marketplace.vercel.app`)

---

## Database Setup (10 minutes)

### Prisma Migrations
- [ ] Install dependencies locally: `pnpm install`
- [ ] Generate Prisma client: `cd packages/database && pnpm prisma generate`
- [ ] Run migrations: `DATABASE_URL="your_production_url" pnpm prisma migrate deploy`
- [ ] Seed database (optional): `DATABASE_URL="your_production_url" pnpm prisma db seed`

### Verify Database
- [ ] Check tables created in database dashboard
- [ ] Verify indexes exist
- [ ] Test connection from Vercel function (check logs)

---

## Domain Configuration (20 minutes)

### IMS Domain
- [ ] Go to IMS project > Settings > Domains
- [ ] Add domain: `ims.partpal.co.za` (or your domain)
- [ ] Copy DNS records provided by Vercel
- [ ] Add CNAME record to DNS provider:
  - Type: `CNAME`
  - Name: `ims`
  - Value: `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5-60 minutes)
- [ ] Verify SSL certificate issued

### Marketplace Domain
- [ ] Go to Marketplace project > Settings > Domains
- [ ] Add apex domain: `partpal.co.za` (or your domain)
- [ ] Add A records to DNS provider:
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21`
- [ ] Add www subdomain:
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`
- [ ] Configure redirect (www → apex or vice versa)
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate issued

---

## Post-Deployment Testing (20 minutes)

### IMS Application Testing
- [ ] Visit IMS URL (custom domain or Vercel URL)
- [ ] Test user registration flow
- [ ] Test login functionality
- [ ] Test JWT token generation
- [ ] Upload a test vehicle image
- [ ] Verify image appears in Cloudinary
- [ ] Add a test part
- [ ] Toggle part listing to marketplace
- [ ] Test dashboard loads correctly
- [ ] Verify charts and statistics display

### Marketplace Application Testing
- [ ] Visit Marketplace URL
- [ ] Test part search functionality
- [ ] Verify parts from IMS appear
- [ ] Test map integration
- [ ] Test location-based filtering
- [ ] Check responsive design on mobile
- [ ] Test image loading and optimization
- [ ] Verify contact functionality works

### Cross-Application Testing
- [ ] Part listed in IMS appears in Marketplace
- [ ] Part unlisted in IMS removed from Marketplace
- [ ] Images accessible from both applications
- [ ] Seller information syncs correctly

### Performance Testing
- [ ] Run Lighthouse audit on both apps
- [ ] Check Core Web Vitals (LCP, FID, CLS)
- [ ] Verify page load times acceptable
- [ ] Test on slow 3G network (DevTools)
- [ ] Check mobile performance

### Security Testing
- [ ] Verify HTTPS enforced
- [ ] Check security headers present (X-Frame-Options, etc.)
- [ ] Test CORS configuration
- [ ] Verify authentication required for protected routes
- [ ] Test rate limiting on API routes
- [ ] Check environment variables not exposed to client

---

## Monitoring Setup (15 minutes)

### Vercel Analytics
- [ ] Enable Vercel Analytics for both projects
- [ ] Install `@vercel/analytics` package
- [ ] Add Analytics component to both apps
- [ ] Verify analytics tracking in dashboard

### Error Tracking (Optional)
- [ ] Set up Sentry projects for IMS and Marketplace
- [ ] Install `@sentry/nextjs` in both apps
- [ ] Configure Sentry DSN in environment variables
- [ ] Test error reporting
- [ ] Set up error alerts

### Uptime Monitoring (Optional)
- [ ] Configure uptime monitoring service (e.g., UptimeRobot)
- [ ] Add both application URLs
- [ ] Set up alerts for downtime
- [ ] Configure status page

### Database Monitoring
- [ ] Check database monitoring dashboard (Vercel Postgres/Supabase)
- [ ] Set up alerts for high connection count
- [ ] Monitor storage usage
- [ ] Set up query performance monitoring

### Redis Monitoring
- [ ] Check Redis dashboard (Upstash)
- [ ] Monitor memory usage
- [ ] Set up alerts for errors
- [ ] Track request count

---

## CI/CD Setup (Optional, 15 minutes)

### GitHub Actions
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Configure workflow for IMS deployment
- [ ] Configure workflow for Marketplace deployment
- [ ] Add Vercel secrets to GitHub:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID_IMS`
  - [ ] `VERCEL_PROJECT_ID_MARKETPLACE`
- [ ] Test automated deployment on push to main
- [ ] Verify preview deployments on pull requests

### Pre-Deploy Checks
- [ ] Add type checking to workflow
- [ ] Add linting to workflow
- [ ] Add tests to workflow
- [ ] Configure branch protection rules

---

## Documentation (10 minutes)

### Update Documentation
- [ ] Document deployed URLs
- [ ] Update environment variable documentation
- [ ] Document deployment process
- [ ] Create troubleshooting guide
- [ ] Document backup procedures

### Team Onboarding
- [ ] Share access to Vercel projects
- [ ] Share access to database
- [ ] Share access to Cloudinary
- [ ] Share access to monitoring tools
- [ ] Document emergency procedures

---

## Backup & Recovery (15 minutes)

### Database Backups
- [ ] Verify automatic backups enabled
- [ ] Test manual backup: `pg_dump`
- [ ] Store backup encryption keys securely
- [ ] Document restoration procedure
- [ ] Set up automated backup notifications

### Configuration Backups
- [ ] Export environment variables: `vercel env pull`
- [ ] Store environment variables securely (1Password, etc.)
- [ ] Document all third-party service configurations
- [ ] Back up DNS records

### Disaster Recovery Plan
- [ ] Document recovery procedures
- [ ] Test database restoration
- [ ] Document RTO (Recovery Time Objective)
- [ ] Document RPO (Recovery Point Objective)

---

## Final Verification (10 minutes)

### Production Readiness
- [ ] All tests passing
- [ ] No errors in Vercel logs
- [ ] No errors in Sentry (if configured)
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Backups configured and tested

### Communication
- [ ] Notify team of deployment
- [ ] Share production URLs
- [ ] Share monitoring dashboard access
- [ ] Document known issues (if any)
- [ ] Schedule post-deployment review

### Post-Launch Monitoring
- [ ] Monitor error rates first 24 hours
- [ ] Monitor performance metrics
- [ ] Check database performance
- [ ] Monitor function invocations and costs
- [ ] Gather user feedback

---

## Estimated Total Time

- **Pre-Deployment**: 30 minutes
- **Account Setup**: 20 minutes
- **Deploy IMS**: 15 minutes
- **Deploy Marketplace**: 15 minutes
- **Database Setup**: 10 minutes
- **Domain Configuration**: 20 minutes
- **Testing**: 20 minutes
- **Monitoring**: 15 minutes
- **Documentation**: 10 minutes
- **Backup Setup**: 15 minutes
- **Final Verification**: 10 minutes

**Total**: ~2.5 - 3 hours

---

## Common Issues Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Check build command includes `cd ../.. && pnpm install` |
| Module not found | Ensure `pnpm install` runs before build |
| Database timeout | Enable connection pooling |
| Redis connection fails | Use `lazyConnect: true` |
| Images don't load | Add domain to `next.config.js` images.domains |
| Env vars not working | Redeploy after adding variables |
| Cold start slow | Upgrade to Vercel Pro or implement warming |
| Type errors in build | Run `pnpm typecheck` locally first |

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Support Email**: support@vercel.com (Pro/Enterprise)

---

## Rollback Procedure

If deployment fails or issues occur:

1. **Immediate Rollback**:
   - Go to Vercel Dashboard > Deployments
   - Find last working deployment
   - Click "..." > "Promote to Production"

2. **Investigate Issue**:
   - Check Vercel function logs
   - Check error tracking (Sentry)
   - Review recent code changes

3. **Fix and Redeploy**:
   - Fix issue locally
   - Test thoroughly
   - Push to repository
   - Automatic redeployment triggers

---

**Congratulations!** You have successfully deployed PartPal to Vercel.

For detailed information on any step, refer to `VERCEL_DEPLOYMENT_GUIDE.md`.
