# Vercel Monorepo Workspace Dependencies Fix

## Current Error

```
Cannot find module '@partpal/shared-types' or its corresponding type declarations.
```

## Root Cause

When Vercel sets **Root Directory** to `apps/ims`, it runs `pnpm install` from that directory. However, workspace dependencies (`@partpal/shared-types`, `@partpal/shared-ui`, etc.) are located in the parent directories and can only be resolved when installing from the repository root.

## Solution

### Required Vercel Dashboard Configuration

**Access:** https://vercel.com/partpals-projects/part-pal-ims/settings

#### Build & Development Settings

Set these EXACT settings:

```
Framework Preset: Next.js

Root Directory: apps/ims
  [✓] Include source files outside of the Root Directory in the Build Step

Build Command: pnpm build

Output Directory: .next

Install Command: pnpm install --frozen-lockfile=false
  (NOTE: This runs from the REPOSITORY ROOT, not from apps/ims)

Development Command: pnpm dev
```

### Why This Works

1. **Install Command** runs from repository root → installs all workspace packages
2. **Root Directory** tells Vercel where the Next.js app is located
3. **Build Command** runs from `apps/ims` directory → builds the app
4. Workspace symlinks are created properly during install
5. TypeScript can find `@partpal/shared-types` and other workspace packages

### Alternative: Use Turbo's Build Command

If the above doesn't work, try this Install Command instead:

```
Install Command: pnpm install --frozen-lockfile=false && pnpm --filter @partpal/ims... install
```

Or use Turbo for the build:

```
Build Command: cd ../.. && pnpm build --filter=@partpal/ims
```

---

## Files Already Updated

These changes have been committed:

1. **apps/ims/package.json**
   - Moved `typescript` to dependencies
   - Moved `@types/*` to dependencies
   - Moved `eslint` to dependencies
   - Moved `postcss`, `autoprefixer`, `tailwindcss` to dependencies

2. **apps/ims/vercel.json**
   - Removed invalid `functions` configuration

---

## Testing Locally

To verify the fix works locally:

```bash
# Clean install from root
rm -rf node_modules apps/ims/node_modules packages/*/node_modules
pnpm install

# Build IMS app
pnpm --filter @partpal/ims build

# Should succeed without errors
```

---

## Common Vercel Monorepo Issues

### Issue 1: "Cannot find module workspace package"
**Cause:** Install command not running from root
**Fix:** Ensure Install Command runs from root (don't use `cd apps/ims`)

### Issue 2: "Unsupported URL Type workspace:"
**Cause:** Using npm instead of pnpm
**Fix:** Ensure Install Command uses `pnpm install`

### Issue 3: "No Next.js version detected"
**Cause:** Root Directory not set
**Fix:** Set Root Directory to `apps/ims`

### Issue 4: Build succeeds but 404 errors
**Cause:** Root Directory not set correctly
**Fix:** Verify Root Directory is `apps/ims`, not empty or `/`

---

## Recommended Vercel Configuration

### Option A: Simple (Recommended)

```
Root Directory: apps/ims
Install Command: pnpm install --frozen-lockfile=false
Build Command: pnpm build
```

### Option B: Turbo-optimized

```
Root Directory: apps/ims
Install Command: pnpm install --frozen-lockfile=false
Build Command: cd ../.. && turbo run build --filter=@partpal/ims
```

### Option C: Explicit Workspace Install

```
Root Directory: apps/ims
Install Command: pnpm install --filter=@partpal/ims... --frozen-lockfile=false
Build Command: pnpm build
```

---

## Environment Variables Still Required

Don't forget to add these in Vercel Dashboard:

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_API_URL=https://your-deployment.vercel.app/api
```

---

## Next Steps

1. **Go to Vercel Dashboard**
   https://vercel.com/partpals-projects/part-pal-ims/settings

2. **Update Build & Development Settings**
   - Root Directory: `apps/ims`
   - Install Command: `pnpm install --frozen-lockfile=false`
   - Build Command: `pnpm build`
   - Check: "Include source files outside Root Directory"

3. **Save Settings**

4. **Trigger Redeploy**
   - Go to Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

5. **Monitor Build**
   - Should install all workspace packages
   - Should find @partpal/shared-types
   - Should build successfully

---

**Last Updated:** October 22, 2025
**Status:** Configuration update required in Vercel Dashboard
