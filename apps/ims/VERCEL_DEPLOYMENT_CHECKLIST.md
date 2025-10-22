# Vercel Deployment Checklist - PartPal IMS

Quick checklist to ensure successful deployment to Vercel.

---

## Vercel Dashboard Configuration Required

**IMPORTANT: Before deploying, configure these settings in the Vercel Dashboard:**

Access: https://vercel.com/partpals-projects/part-pal-ims/settings

### Build & Development Settings
- Framework Preset: **Next.js**
- Root Directory: **apps/ims**
- **CHECK** Include source files outside of the Root Directory  
- Build Command: **pnpm build**
- Output Directory: **.next**
- Install Command: **pnpm install**
- Development Command: **pnpm dev -p 3001**

### General Settings
- Node.js Version: **20.x** (or 18.x)

---

## Environment Variables Required

Minimum variables needed for deployment:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://default:password@host:6379
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=https://your-deployment.vercel.app/api
```

Add in: https://vercel.com/partpals-projects/part-pal-ims/settings/environment-variables

---

## Files to Commit

These files should be committed for GitHub integration:

- [x] `vercel.json` (root)
- [x] `apps/ims/vercel.json`
- [x] `pnpm-lock.yaml`
- [x] `.gitignore` (with .vercel excluded)
- [x] `VERCEL_GITHUB_INTEGRATION_GUIDE.md`
- [x] `VERCEL_DEV_TEST_RESULTS.md`
- [x] `VERCEL_QUICK_COMMANDS.md`

---

**Last Updated:** October 22, 2025
