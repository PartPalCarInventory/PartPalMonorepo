# How to Run PartPal - Frontend and Backend

This guide will help you run the entire PartPal application including both frontends (IMS and Marketplace) and the backend API.

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18.0.0 or higher
- **pnpm** 8.0.0 or higher
- **Terminal/Command Prompt** access

Check your versions:
```bash
node --version   # Should be >= 18.0.0
pnpm --version   # Should be >= 8.0.0
```

## Quick Start (Recommended)

### Option 1: Run Everything at Once

From the project root, run:

```bash
# Install all dependencies
pnpm install

# Run database migration (first time only)
./scripts/migrate-database.sh

# Start all services (API + IMS + Marketplace)
pnpm dev
```

This will start:
- **API Server** on http://localhost:3333
- **IMS Application** on http://localhost:3001
- **Marketplace Application** on http://localhost:3000

### Option 2: Run Services Individually

If you want more control or only need specific services:

```bash
# Terminal 1 - API Backend
pnpm dev:api

# Terminal 2 - IMS Frontend
pnpm dev:ims

# Terminal 3 - Marketplace Frontend
pnpm dev:marketplace
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /home/x-ubuntu/projects/PartPalv2
pnpm install
```

This will install all dependencies for:
- Shared packages
- API service
- IMS app
- Marketplace app

**Expected output:**
```
Progress: resolved X, reused Y, downloaded Z, added A
Done in Xs
```

### 2. Run Database Migration

**First time only** - Set up the database:

```bash
./scripts/migrate-database.sh
```

Or manually:
```bash
cd packages/database
pnpm prisma migrate dev --name initial-setup
pnpm prisma generate
cd ../..
```

**Expected output:**
```
✓ Prisma schema found
✓ Dependencies installed
✓ Migration created successfully
✓ Prisma Client generated
```

### 3. (Optional) Configure Environment Variables

Create `.env` files if needed:

**services/api/.env**
```bash
DATABASE_URL="file:./dev.db"
PORT=3333
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
MAPBOX_ACCESS_TOKEN="your_token_here"  # Optional
```

**apps/ims/.env.local**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
```

**apps/marketplace/.env.local**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
```

### 4. Start the Backend API

In Terminal 1:

```bash
pnpm dev:api
```

**Expected output:**
```
API Server running on port 3333
Health check: http://localhost:3333/health
Admin panel: http://localhost:3333/api/admin
```

**Verify it's working:**
```bash
curl http://localhost:3333/health
```

Should return:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2024-01-20T...",
  "uptime": 5.123
}
```

### 5. Start the IMS Frontend

In Terminal 2:

```bash
pnpm dev:ims
```

**Expected output:**
```
ready - started server on 0.0.0.0:3001, url: http://localhost:3001
event - compiled client and server successfully
```

**Access IMS:**
Open http://localhost:3001 in your browser

### 6. Start the Marketplace Frontend

In Terminal 3:

```bash
pnpm dev:marketplace
```

**Expected output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

**Access Marketplace:**
Open http://localhost:3000 in your browser

## Application URLs

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Marketplace** | http://localhost:3000 | Public marketplace for buyers |
| **IMS** | http://localhost:3001 | Inventory management for sellers |
| **API** | http://localhost:3333 | Backend API |
| **API Health** | http://localhost:3333/health | Health check endpoint |
| **API Docs** | http://localhost:3333/api | API root |

## Testing the Setup

### Test Backend API

```bash
# Test health check
curl http://localhost:3333/health

# Test marketplace search (public - no auth)
curl http://localhost:3333/api/marketplace/parts/search?q=brake

# Test featured parts
curl http://localhost:3333/api/marketplace/parts/featured?limit=5

# Test vehicle makes
curl http://localhost:3333/api/marketplace/vehicles/makes

# Test provinces
curl http://localhost:3333/api/location/provinces
```

### Test Frontend Applications

**Marketplace (http://localhost:3000):**
1. Open in browser
2. Should see homepage with search bar
3. Try searching for parts
4. Browse categories
5. View seller profiles

**IMS (http://localhost:3001):**
1. Open in browser
2. Should see login page
3. Create account or login
4. Access dashboard
5. Manage inventory

## Common Commands

### Development Commands

```bash
# Start all services
pnpm dev

# Start individual services
pnpm dev:api          # Backend API only
pnpm dev:ims          # IMS frontend only
pnpm dev:marketplace  # Marketplace frontend only

# Build everything
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

### Database Commands

```bash
cd packages/database

# Create a new migration
pnpm prisma migrate dev --name your-migration-name

# Generate Prisma Client
pnpm prisma generate

# View database in browser
pnpm prisma studio

# Reset database (WARNING: deletes data)
pnpm prisma migrate reset

# Check migration status
pnpm prisma migrate status
```

## Troubleshooting

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. Find and kill the process using the port:
```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3333 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or change the port:
```bash
# For API
PORT=3334 pnpm dev:api

# For Next.js apps
PORT=3002 pnpm dev:ims
```

### Issue: Database Connection Failed

**Error:**
```
ERROR: Database connection failed
```

**Solutions:**

1. Check if database file exists:
```bash
ls packages/database/prisma/dev.db
```

2. Run migration:
```bash
./scripts/migrate-database.sh
```

3. Reset database:
```bash
cd packages/database
pnpm prisma migrate reset
pnpm prisma migrate dev
```

### Issue: Module Not Found

**Error:**
```
Error: Cannot find module '@partpal/shared-types'
```

**Solution:**

```bash
# Reinstall all dependencies
pnpm install

# Build shared packages
pnpm --filter @partpal/shared-types build
pnpm --filter @partpal/shared-ui build
pnpm --filter @partpal/shared-utils build
```

### Issue: Prisma Client Not Generated

**Error:**
```
PrismaClient is unable to run in this browser environment
```

**Solution:**

```bash
cd packages/database
pnpm prisma generate
```

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- Frontend shows "Network Error"
- API requests fail
- CORS errors in browser console

**Solutions:**

1. Verify API is running:
```bash
curl http://localhost:3333/health
```

2. Check CORS settings in `services/api/src/index.ts`:
```typescript
cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
})
```

3. Verify environment variables:
```bash
# In apps/marketplace/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3333/api

# In apps/ims/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

### Issue: Slow Startup

**Symptoms:**
- Takes a long time to start
- High CPU usage

**Solutions:**

1. Clear node_modules and reinstall:
```bash
pnpm clean
rm -rf node_modules
pnpm install
```

2. Clear Next.js cache:
```bash
rm -rf apps/ims/.next
rm -rf apps/marketplace/.next
```

3. Increase Node memory:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev
```

## Development Workflow

### Making Changes

**When you modify shared code:**
```bash
# 1. Make changes in packages/*
# 2. Rebuild the package
pnpm --filter @partpal/shared-types build

# 3. Restart services using that package
pnpm dev:api  # or pnpm dev:ims, etc.
```

**When you modify API routes:**
- API server auto-restarts with nodemon
- No manual restart needed
- Check terminal for compilation errors

**When you modify frontend code:**
- Next.js auto-reloads with hot module replacement
- Changes appear instantly in browser
- Check browser console for errors

### Adding Dependencies

```bash
# Add to root workspace
pnpm add <package> -w

# Add to specific workspace
pnpm --filter @partpal/api add <package>
pnpm --filter @partpal/ims add <package>
pnpm --filter @partpal/marketplace add <package>
```

## Production Build

### Build All Services

```bash
# Build everything
pnpm build

# Or build individually
pnpm --filter @partpal/api build
pnpm --filter @partpal/ims build
pnpm --filter @partpal/marketplace build
```

### Start Production Build

```bash
# API
cd services/api
pnpm start

# IMS
cd apps/ims
pnpm start

# Marketplace
cd apps/marketplace
pnpm start
```

## Monitoring and Logs

### View Logs

```bash
# API logs
tail -f services/api/logs/app.log  # If logging to file

# Development console logs
# Logs appear in the terminal where you ran pnpm dev
```

### Monitor Performance

```bash
# API monitoring endpoint
curl http://localhost:3333/api/monitoring

# Database monitoring
cd packages/database
pnpm prisma studio
```

## Useful Tips

1. **Use Turbo for faster builds:**
   - Turbo caches builds and only rebuilds changed packages
   - `pnpm dev` uses Turbo automatically

2. **Run specific workspace commands:**
   ```bash
   pnpm --filter @partpal/api <command>
   pnpm --filter @partpal/ims <command>
   ```

3. **View all available scripts:**
   ```bash
   cat package.json | grep scripts -A 20
   ```

4. **Check workspace structure:**
   ```bash
   pnpm list --depth 0
   ```

5. **Open Prisma Studio:**
   ```bash
   cd packages/database
   pnpm prisma studio
   # Opens at http://localhost:5555
   ```

## Next Steps

After getting everything running:

1. **Explore the applications:**
   - Browse marketplace at http://localhost:3000
   - Login to IMS at http://localhost:3001
   - Test API at http://localhost:3333

2. **Add seed data** (if needed):
   ```bash
   cd packages/database
   pnpm prisma db seed
   ```

3. **Read the documentation:**
   - `BACKEND_FIXES_SUMMARY.md` - API documentation
   - `QUICK_START.md` - Quick setup guide
   - `BACKEND_FIX_COMPLETE.md` - What's been implemented

4. **Start developing:**
   - Make changes to code
   - Watch for auto-reload
   - Test your changes

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review logs in the terminal
3. Check `QUICK_START.md` for setup issues
4. Review `BACKEND_FIXES_SUMMARY.md` for API issues
5. Check database status: `curl http://localhost:3333/health`

## Summary

**To run everything:**

```bash
# 1. First time setup
pnpm install
./scripts/migrate-database.sh

# 2. Start all services
pnpm dev

# 3. Access applications
# Marketplace: http://localhost:3000
# IMS:         http://localhost:3001
# API:         http://localhost:3333
```

That's it! You're ready to develop with PartPal.
