# Quick Start Guide - Backend API Fixes

## What Was Fixed

All critical backend API issues have been resolved:

1. **Missing marketplace public endpoints** - Added complete marketplace API
2. **Authentication mismatch** - Marketplace is now publicly accessible
3. **Response structure inconsistencies** - Fixed to match frontend expectations
4. **Missing analytics tracking** - Full analytics system implemented
5. **Missing location services** - Geocoding and location API added
6. **Missing facets in search** - Added location and all other facets

## Quick Setup (5 minutes)

### 1. Run Database Migration

From the project root:

```bash
# Option A: Use the migration script (recommended)
./scripts/migrate-database.sh

# Option B: Manual migration
cd packages/database
pnpm prisma migrate dev --name add-analytics-and-activity-logging
pnpm prisma generate
cd ../..
```

### 2. (Optional) Add Mapbox Token

For real geocoding (optional - fallback data works without this):

```bash
# Add to services/api/.env
echo "MAPBOX_ACCESS_TOKEN=your_token_here" >> services/api/.env
```

### 3. Restart API Server

```bash
cd services/api
pnpm dev:api
```

### 4. Verify Everything Works

```bash
# Test marketplace search (should work without auth)
curl http://localhost:3333/api/marketplace/parts/search?q=brake

# Test featured parts
curl http://localhost:3333/api/marketplace/parts/featured?limit=5

# Test vehicle makes
curl http://localhost:3333/api/marketplace/vehicles/makes

# Test location service
curl http://localhost:3333/api/location/provinces
```

## New Endpoints Summary

### Marketplace (PUBLIC - No Auth Required)

```
GET  /api/marketplace/parts/search          - Search parts
GET  /api/marketplace/parts/:id             - Get part details
GET  /api/marketplace/parts/featured        - Get featured parts
GET  /api/marketplace/parts/suggestions     - Autocomplete suggestions
GET  /api/marketplace/vehicles/makes        - Get vehicle makes
GET  /api/marketplace/vehicles/models       - Get vehicle models
GET  /api/marketplace/vehicles/:id          - Get vehicle details
GET  /api/marketplace/sellers/:id           - Get seller profile
GET  /api/marketplace/sellers/:id/parts     - Get seller parts
GET  /api/marketplace/sellers/search        - Search sellers
```

### Analytics (PUBLIC for tracking)

```
POST /api/analytics/part-view               - Track part views
POST /api/analytics/search                  - Track searches
POST /api/analytics/seller-contact          - Track contacts
GET  /api/analytics/summary                 - Get summary (auth required)
GET  /api/analytics/top-parts               - Get top parts (auth required)
GET  /api/analytics/popular-searches        - Get popular searches (auth required)
```

### Location Services (PUBLIC)

```
GET  /api/location/geocode                  - Address to coordinates
GET  /api/location/reverse-geocode          - Coordinates to address
GET  /api/location/distance                 - Calculate distance
GET  /api/location/provinces                - Get SA provinces
GET  /api/location/cities                   - Get cities by province
```

## Example Requests

### Search Parts with Filters

```bash
curl "http://localhost:3333/api/marketplace/parts/search?\
q=brake&\
make=BMW&\
minPrice=100&\
maxPrice=2000&\
condition=EXCELLENT&\
condition=GOOD&\
province=Western%20Cape&\
page=1&\
pageSize=20&\
sortBy=price_low"
```

Response:
```json
{
  "success": true,
  "data": {
    "parts": [...],
    "totalCount": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3,
    "facets": {
      "makes": [{"value": "BMW", "count": 25}, ...],
      "models": [{"value": "3 Series", "count": 15}, ...],
      "conditions": [{"value": "EXCELLENT", "count": 20}, ...],
      "priceRanges": [{"range": "0-1000", "count": 12}, ...],
      "locations": [{"value": "Western Cape", "count": 30}, ...]
    }
  }
}
```

### Track Analytics

```bash
# Track part view
curl -X POST http://localhost:3333/api/analytics/part-view \
  -H "Content-Type: application/json" \
  -d '{
    "partId": "part-id-here",
    "sessionId": "session-123",
    "timestamp": "2024-01-20T10:30:00Z"
  }'

# Track search
curl -X POST http://localhost:3333/api/analytics/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "BMW brake pads",
    "filters": {"make": "BMW"},
    "resultsCount": 25
  }'

# Track seller contact
curl -X POST http://localhost:3333/api/analytics/seller-contact \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "seller-id",
    "partId": "part-id",
    "contactMethod": "whatsapp"
  }'
```

### Location Services

```bash
# Geocode address
curl "http://localhost:3333/api/location/geocode?q=Cape%20Town"

# Reverse geocode
curl "http://localhost:3333/api/location/reverse-geocode?lat=-33.9249&lng=18.4241"

# Get provinces
curl "http://localhost:3333/api/location/provinces"

# Get cities
curl "http://localhost:3333/api/location/cities?province=Western%20Cape"
```

## Database Schema Changes

### New Tables

1. **analytics_events** - Tracks all analytics events
   - part views
   - searches
   - seller contacts

2. **activity_logs** - Tracks seller activities
   - parts sold
   - marketplace listings
   - vehicle additions

### Updated Tables

1. **sellers** - Added `email` field for public contact

## Frontend Integration

The frontend API client (`apps/marketplace/src/utils/api.ts`) is now fully compatible. All these methods will work:

```typescript
import { apiClient } from '../utils/api';

// Search parts
const results = await apiClient.searchParts({
  query: 'brake',
  vehicleMake: 'BMW',
  page: 1,
  pageSize: 20
});

// Get part details
const part = await apiClient.getPartById('part-id');

// Get featured parts
const featured = await apiClient.getFeaturedParts(8);

// Get suggestions
const suggestions = await apiClient.getPartSuggestions('bra', 'parts');

// Track analytics (non-blocking)
await apiClient.trackPartView('part-id');
await apiClient.trackSearch('brake pads', filters, 25);
await apiClient.trackSellerContact('seller-id', 'part-id', 'phone');
```

## Troubleshooting

### Issue: "Table does not exist" errors

**Solution:**
```bash
cd packages/database
pnpm prisma migrate reset  # Warning: This will clear data
pnpm prisma migrate dev
pnpm prisma generate
```

### Issue: Marketplace search returns empty results

**Possible causes:**
1. No parts have `isListedOnMarketplace = true`
2. No sellers have `isVerified = true`
3. Database needs seed data

**Solution:**
```bash
cd packages/database
pnpm prisma db seed  # If seed script exists
```

Or manually update data:
```sql
UPDATE parts SET isListedOnMarketplace = 1, status = 'AVAILABLE';
UPDATE sellers SET isVerified = 1;
```

### Issue: Location services return mock data

**This is normal behavior.** The API falls back to mock data when:
- `MAPBOX_ACCESS_TOKEN` is not set
- Mapbox API is unreachable
- Request timeout occurs

Mock data is sufficient for development and testing.

## Performance Tips

1. **Add indexes** - Already done in schema
2. **Enable query logging** - Set `DATABASE_URL` to include query logging
3. **Monitor slow queries** - Check `/api/monitoring` endpoints
4. **Cache frequently accessed data** - Consider adding Redis

## Next Steps

1. **Test the marketplace frontend** - Should now work completely
2. **Check analytics dashboard** - View tracked events
3. **Verify seller profiles** - Ensure email field is populated
4. **Review faceted search** - Test all filter combinations

## Production Checklist

Before deploying to production:

- [ ] Run migrations on production database
- [ ] Add `MAPBOX_ACCESS_TOKEN` to production environment
- [ ] Set up proper `ALLOWED_ORIGINS` in environment
- [ ] Enable query caching (Redis recommended)
- [ ] Set up monitoring for analytics events
- [ ] Configure rate limiting appropriately
- [ ] Test all public endpoints without authentication
- [ ] Verify CORS settings for frontend domains
- [ ] Set up database backups
- [ ] Monitor API performance metrics

## Support

For detailed information, see:
- `BACKEND_FIXES_SUMMARY.md` - Complete documentation
- Prisma schema - `packages/database/prisma/schema.prisma`
- Route implementations - `services/api/src/routes/`

All issues from the analysis report have been resolved!
