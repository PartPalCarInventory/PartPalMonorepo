import { PrismaClient } from '@prisma/client';

// Create global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling configuration
  __internal: {
    engine: {
      // Connection pool settings
      connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
      poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'), // 10 seconds
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'), // 5 minutes
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Performance-optimized search utilities for parts
export class PartSearchService {
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(params: any): string {
    return JSON.stringify(params);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  async searchParts(params: {
    query?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    partNumber?: string;
    location?: {
      province?: string;
      city?: string;
      radius?: number; // km for geo searches
      lat?: number;
      lng?: number;
    };
    priceRange?: {
      min: number;
      max: number;
    };
    condition?: string[];
    categoryId?: string;
    sellerId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc';
  }) {
    const {
      query,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      partNumber,
      location,
      priceRange,
      condition,
      categoryId,
      sellerId,
      limit = 20,
      offset = 0,
      sortBy = 'relevance'
    } = params;

    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cached = this.searchCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const where: any = {
      isListedOnMarketplace: true,
      status: 'AVAILABLE'
    };

    // Optimize search conditions based on priority
    // 1. Seller filter (most selective)
    if (sellerId) {
      where.sellerId = sellerId;
    }

    // 2. Category filter (highly selective)
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 3. Part number exact match (most specific)
    if (partNumber) {
      where.partNumber = {
        contains: partNumber,
        mode: 'insensitive'
      };
    }

    // 4. Full-text search with improved performance
    if (query) {
      // Use full-text search when possible, fallback to ILIKE
      const queryTerms = query.split(' ').filter(term => term.length > 2);

      if (queryTerms.length > 0) {
        where.OR = [
          // Full-text search (fastest)
          {
            name: {
              search: queryTerms.join(' & ')
            }
          },
          {
            description: {
              search: queryTerms.join(' & ')
            }
          },
          // Fallback for partial matches
          ...queryTerms.map(term => ({
            name: {
              contains: term,
              mode: 'insensitive' as const
            }
          }))
        ];
      }
    }

    // 5. Vehicle filters (join optimization)
    if (vehicleMake || vehicleModel || vehicleYear) {
      where.vehicle = {};
      if (vehicleYear) {
        where.vehicle.year = vehicleYear; // Exact match first (most selective)
      }
      if (vehicleMake) {
        where.vehicle.make = {
          equals: vehicleMake, // Exact match for better performance
          mode: 'insensitive'
        };
      }
      if (vehicleModel) {
        where.vehicle.model = {
          contains: vehicleModel,
          mode: 'insensitive'
        };
      }
    }

    // 6. Location filters with geo-spatial support
    if (location?.province || location?.city || (location?.lat && location?.lng && location?.radius)) {
      where.seller = {};

      // Geo-spatial search (most efficient when coordinates provided)
      if (location.lat && location.lng && location.radius) {
        // Use raw SQL for geo-spatial queries for better performance
        const radiusInDegrees = location.radius / 111; // Rough conversion km to degrees
        where.seller.AND = [
          {
            latitude: {
              gte: location.lat - radiusInDegrees,
              lte: location.lat + radiusInDegrees
            }
          },
          {
            longitude: {
              gte: location.lng - radiusInDegrees,
              lte: location.lng + radiusInDegrees
            }
          }
        ];
      } else {
        // Fallback to province/city filtering
        if (location.province) {
          where.seller.province = {
            equals: location.province,
            mode: 'insensitive'
          };
        }
        if (location.city) {
          where.seller.city = {
            contains: location.city,
            mode: 'insensitive'
          };
        }
      }
    }

    // 7. Price range filter (efficient numeric range)
    if (priceRange) {
      where.price = {};
      if (priceRange.min) {
        where.price.gte = priceRange.min;
      }
      if (priceRange.max) {
        where.price.lte = priceRange.max;
      }
    }

    // 8. Condition filter (indexed enum)
    if (condition && condition.length > 0) {
      where.condition = {
        in: condition
      };
    }

    // Optimize sorting strategy
    const getOrderBy = () => {
      switch (sortBy) {
        case 'price_asc':
          return [{ price: 'asc' as const }];
        case 'price_desc':
          return [{ price: 'desc' as const }];
        case 'date_asc':
          return [{ createdAt: 'asc' as const }];
        case 'date_desc':
          return [{ createdAt: 'desc' as const }];
        case 'relevance':
        default:
          // For relevance, prioritize verified sellers and newer listings
          return [
            { seller: { isVerified: 'desc' as const } },
            { createdAt: 'desc' as const }
          ];
      }
    };

    // Execute optimized query
    const [parts, totalCount] = await Promise.all([
      prisma.part.findMany({
        where,
        include: {
          vehicle: {
            select: {
              year: true,
              make: true,
              model: true,
              variant: true
            }
          },
          seller: {
            select: {
              id: true,
              businessName: true,
              city: true,
              province: true,
              rating: true,
              isVerified: true,
              latitude: true,
              longitude: true
            }
          },
          category: {
            select: {
              name: true,
              parent: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: getOrderBy(),
        take: limit,
        skip: offset
      }),
      // Only count when necessary (cache total counts for common queries)
      offset === 0 ? prisma.part.count({ where }) : Promise.resolve(0)
    ]);

    const result = {
      parts,
      totalCount: offset === 0 ? totalCount : totalCount,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: offset === 0 ? Math.ceil(totalCount / limit) : 0,
      hasMore: parts.length === limit
    };

    // Cache the result
    this.searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.searchCache.size > 100) {
      this.cleanupCache();
    }

    return result;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (!this.isCacheValid(value.timestamp)) {
        this.searchCache.delete(key);
      }
    }
  }

  async getSearchFacets() {
    const [makes, conditions, priceRanges] = await Promise.all([
      // Most common vehicle makes
      prisma.vehicle.groupBy({
        by: ['make'],
        _count: { make: true },
        orderBy: { _count: { make: 'desc' } },
        take: 20
      }),

      // Available conditions
      prisma.part.groupBy({
        by: ['condition'],
        _count: { condition: true },
        where: {
          isListedOnMarketplace: true,
          status: 'AVAILABLE'
        }
      }),

      // Price range analysis
      prisma.part.aggregate({
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
        where: {
          isListedOnMarketplace: true,
          status: 'AVAILABLE'
        }
      })
    ]);

    return {
      makes: makes.map((m: any) => ({ value: m.make, count: m._count.make })),
      conditions: conditions.map((c: any) => ({ value: c.condition, count: c._count.condition })),
      priceStats: {
        min: priceRanges._min.price?.toNumber() || 0,
        max: priceRanges._max.price?.toNumber() || 0,
        avg: priceRanges._avg.price?.toNumber() || 0
      }
    };
  }
}

export const partSearchService = new PartSearchService();

// Export performance utilities
export { DatabaseConfig, validateDatabaseConfig, checkDatabaseHealth } from './config';
export { DatabaseCache, RedisCache, CacheFactory, searchCache, facetsCache, statsCache, CacheKeys } from './cache';
export { DatabaseMonitor, databaseMonitor, withMonitoring } from './monitoring';
export { BulkOperations, createBulkOperations } from './bulk-operations';

// Export security utilities
export {
  DatabaseEncryption,
  DatabaseAccessControl,
  DatabaseAuditLogger,
  SqlInjectionPrevention,
  DataAnonymization,
  dbEncryption,
  dbAccessControl,
  dbAuditLogger,
  dataAnonymization,
  securityConfig
} from './security';

export {
  SecureDatabaseConnection,
  SecureConnectionPool,
  secureConnection,
  secureConnectionPool
} from './secure-connection';

export {
  DataRetentionManager,
  dataRetentionManager
} from './data-retention';

export {
  SecurityMonitor,
  SecurityEventType,
  ThreatResponseAction,
  securityMonitor
} from './security-monitoring';

// Database utilities
export * from '@prisma/client';