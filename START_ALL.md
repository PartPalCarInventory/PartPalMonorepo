# Quick Start - All Services

Your PartPal application is ready to run!

## Database Setup - COMPLETE ✓

- Dependencies installed
- Database schema created
- Prisma client generated
- Analytics tables added

## How to Start

### Option 1: Start All Services Together (Recommended)

Open a terminal and run:

```bash
cd /home/x-ubuntu/projects/PartPalv2
pnpm dev
```

This starts:
- API Server → http://localhost:3333
- IMS App → http://localhost:3001
- Marketplace → http://localhost:3000

### Option 2: Start Services Separately

**Terminal 1 - Backend API:**
```bash
cd /home/x-ubuntu/projects/PartPalv2
pnpm dev:api
```

**Terminal 2 - IMS (Inventory Management):**
```bash
cd /home/x-ubuntu/projects/PartPalv2
pnpm dev:ims
```

**Terminal 3 - Marketplace (Public):**
```bash
cd /home/x-ubuntu/projects/PartPalv2
pnpm dev:marketplace
```

## Access Your Applications

Once started, open these URLs in your browser:

| Application | URL | Description |
|-------------|-----|-------------|
| **Marketplace** | http://localhost:3000 | Public parts marketplace |
| **IMS** | http://localhost:3001 | Seller inventory system |
| **API** | http://localhost:3333 | Backend API server |
| **Health Check** | http://localhost:3333/health | API status |

## Quick Tests

Test the new marketplace API endpoints:

```bash
# Test marketplace search (no login required!)
curl http://localhost:3333/api/marketplace/parts/search?q=brake

# Test featured parts
curl http://localhost:3333/api/marketplace/parts/featured

# Test vehicle makes
curl http://localhost:3333/api/marketplace/vehicles/makes

# Test locations
curl http://localhost:3333/api/location/provinces
```

## What's New

All backend issues have been fixed:

✓ Public marketplace API (no authentication required)
✓ Advanced search with filters and facets
✓ Featured parts endpoint
✓ Vehicle makes/models endpoints
✓ Seller profiles (public)
✓ Analytics tracking
✓ Location services (geocoding)
✓ Autocomplete suggestions

## Need Help?

- **Full guide**: See `HOW_TO_RUN.md`
- **API docs**: See `services/api/BACKEND_FIXES_SUMMARY.md`
- **Quick setup**: See `services/api/QUICK_START.md`
- **Troubleshooting**: Check `HOW_TO_RUN.md` troubleshooting section

## Common Issues

**Port already in use?**
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9  # Marketplace
lsof -ti:3001 | xargs kill -9  # IMS
lsof -ti:3333 | xargs kill -9  # API
```

**Database error?**
```bash
cd packages/database
pnpm prisma db push
pnpm prisma generate
```

**Module not found?**
```bash
pnpm install
```

---

**Ready to start?** Run `pnpm dev` and visit http://localhost:3000!
