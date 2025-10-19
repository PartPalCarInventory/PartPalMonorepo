# Redis Integration for PartPal API

This document describes the Redis integration for the PartPal API service, providing production-ready caching, rate limiting, and session management.

## Overview

Redis has been integrated into the PartPal API to provide:

1. **Distributed Rate Limiting** - Production-ready rate limiting that works across multiple instances
2. **Session Storage** - Fast, secure session management with automatic expiration
3. **Caching Layer** - High-performance caching for frequently accessed data
4. **Pub/Sub Support** - Real-time event distribution (future use)

## Architecture

### Redis Client Configuration

Location: `services/api/src/config/redis.ts`

The Redis client is configured as a singleton with:
- Automatic reconnection with exponential backoff
- Connection pooling for optimal performance
- Health monitoring and error handling
- Separate instances for pub/sub operations

### Components

#### 1. Rate Limiter (`redisRateLimiter.ts`)

Provides three-tier rate limiting:

- **Auth Limiter**: 5 attempts per 15 minutes (login/register endpoints)
- **General Limiter**: 100 requests per 15 minutes (standard API endpoints)
- **API Limiter**: 1000 requests per hour (authenticated API clients)

Features:
- Falls back to in-memory rate limiting if Redis is unavailable
- Per-IP and per-user tracking
- Configurable via environment variables
- Rate limit headers in responses

#### 2. Session Store (`sessionStore.ts`)

Secure session management with:
- 7-day default TTL with automatic renewal
- Session metadata tracking (IP, user agent, timestamps)
- Multi-session support per user
- Bulk operations for user session cleanup

#### 3. Cache Layer (`redisCache.ts`)

Flexible caching utilities:
- Generic cache operations (get, set, delete)
- Get-or-set pattern for cache-through operations
- Pattern-based deletion for cache invalidation
- Specialized caches for different data types
- Built-in cache statistics

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Rate Limiting Configuration
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=900
RATE_LIMIT_AUTH_BLOCK=900
RATE_LIMIT_GENERAL_POINTS=100
RATE_LIMIT_GENERAL_DURATION=900
RATE_LIMIT_API_POINTS=1000
RATE_LIMIT_API_DURATION=3600
```

### Docker Setup

For local development with Docker:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
```

### Production Setup

For production deployments:

1. **AWS ElastiCache** (Recommended for AWS):
   ```bash
   REDIS_HOST=your-cluster.cache.amazonaws.com
   REDIS_PORT=6379
   REDIS_PASSWORD=your_strong_password
   ```

2. **Redis Cluster** (High availability):
   - Configure Redis Sentinel for automatic failover
   - Use connection string with multiple nodes
   - Enable authentication and encryption in transit

3. **Azure Cache for Redis**:
   ```bash
   REDIS_HOST=your-cache.redis.cache.windows.net
   REDIS_PORT=6380
   REDIS_PASSWORD=your_access_key
   ```

## Usage Examples

### Rate Limiting

Already integrated into the API middleware:

```typescript
import { redisRateLimiter } from './middleware/redisRateLimiter';

app.use(redisRateLimiter);
```

### Session Management

```typescript
import { sessionStore } from './utils/sessionStore';

// Create a session
await sessionStore.createSession('session-id', {
  userId: 'user-123',
  email: 'user@example.com',
  role: 'seller',
  createdAt: Date.now(),
  lastAccessedAt: Date.now(),
});

// Retrieve session
const session = await sessionStore.getSession('session-id');

// Delete session on logout
await sessionStore.deleteSession('session-id');

// Delete all user sessions (e.g., on password change)
await sessionStore.deleteUserSessions('user-123');
```

### Caching

```typescript
import { cache, partsCache, CacheKeys } from './utils/redisCache';

// Simple cache operations
await cache.set('key', { data: 'value' }, { ttl: 3600 });
const value = await cache.get('key');

// Get-or-set pattern
const parts = await partsCache.getOrSet(
  CacheKeys.partsByVehicle('vehicle-123'),
  async () => {
    // Fetch from database
    return await prisma.part.findMany({ where: { vehicleId: 'vehicle-123' } });
  },
  { ttl: 300 } // 5 minutes
);

// Cache invalidation
await partsCache.deletePattern('parts:vehicle:*');

// Specialized caches
import { searchCache, userCache, analyticsCache } from './utils/redisCache';

// Cache search results (short TTL)
await searchCache.set(searchKey, results, { ttl: 60 });

// Cache user data (medium TTL)
await userCache.set(CacheKeys.user(userId), userData, { ttl: 600 });

// Cache analytics (long TTL)
await analyticsCache.set(analyticsKey, stats, { ttl: 3600 });
```

### Cache Keys Helper

```typescript
import { CacheKeys } from './utils/redisCache';

// Generate consistent cache keys
const userKey = CacheKeys.user('user-123');
const partKey = CacheKeys.part('part-456');
const searchKey = CacheKeys.search('engine', { make: 'Toyota', year: 2020 });
const statsKey = CacheKeys.dashboardStats('seller-789', 'weekly');
```

## Monitoring

### Health Check

The API health endpoint now includes Redis status:

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "database": "healthy",
  "redis": "healthy",
  "timestamp": "2025-10-19T...",
  "uptime": 12345
}
```

### Cache Statistics

```typescript
import { cache } from './utils/redisCache';

const stats = await cache.getStats();
console.log(stats);
// {
//   totalKeys: 1234,
//   memoryUsed: 5242880,
//   hits: 10000,
//   misses: 500,
//   hitRate: 0.952
// }
```

### Redis Info

```typescript
import { RedisClient } from './config/redis';

const info = await RedisClient.getInfo();
console.log(info);
// Contains server info, memory usage, persistence, etc.
```

## Testing

Run Redis integration tests:

```bash
# Start Redis (if not already running)
docker run -d -p 6379:6379 redis:7-alpine

# Run tests
pnpm --filter @partpal/api test redis
```

## Performance Considerations

### Cache TTL Strategy

- **Search results**: 60 seconds (frequently changing)
- **User data**: 10 minutes (moderate changes)
- **Parts catalog**: 5 minutes (updated when inventory changes)
- **Analytics**: 1 hour (computed data, expensive to generate)
- **Sessions**: 7 days (with automatic renewal on access)

### Memory Management

Redis memory is managed through:
- TTL-based automatic expiration
- LRU eviction policy (configure in production)
- Pattern-based cache invalidation
- Monitoring of memory usage

### Connection Pooling

The Redis client uses connection pooling:
- Automatic reconnection on failure
- Exponential backoff retry strategy
- Keep-alive for persistent connections
- Separate instances for pub/sub

## Migration from In-Memory

The system gracefully falls back to in-memory rate limiting if Redis is unavailable. This ensures:
- No downtime during Redis maintenance
- Development without Redis dependency
- Gradual migration path

## Security

### Authentication

Always use Redis password in production:
```bash
REDIS_PASSWORD=strong_random_password
```

### Encryption

For production:
- Use TLS/SSL for Redis connections
- Enable encryption at rest (ElastiCache/Azure)
- Use VPC/VNET isolation

### Access Control

- Restrict Redis access to application servers only
- Use Redis ACLs for fine-grained permissions (Redis 6+)
- Regular security audits of cached data

## Troubleshooting

### Redis Connection Issues

1. Check Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check logs:
   ```bash
   docker logs <redis-container>
   ```

3. Verify connection:
   ```bash
   redis-cli -h <host> -p <port> -a <password>
   ```

### Performance Issues

1. Monitor slow queries:
   ```bash
   redis-cli slowlog get 10
   ```

2. Check memory usage:
   ```bash
   redis-cli info memory
   ```

3. Analyze key patterns:
   ```bash
   redis-cli --bigkeys
   ```

## Future Enhancements

Planned improvements:
- [ ] Redis pub/sub for real-time notifications
- [ ] Redis Streams for event sourcing
- [ ] Lua scripts for atomic operations
- [ ] Redis search for full-text search
- [ ] Geo-spatial queries for location-based features

## Resources

- [ioredis Documentation](https://github.com/luin/ioredis)
- [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Redis logs
- Contact the development team
