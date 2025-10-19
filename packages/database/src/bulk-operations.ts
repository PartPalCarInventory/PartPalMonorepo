import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from './config';
import { databaseMonitor, withMonitoring } from './monitoring';

// Bulk operation utilities for high-performance data operations
export interface BulkOperationConfig {
  batchSize: number;
  maxConcurrency: number;
  timeout: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, batch: any[]) => void;
}

export interface BulkResult<T = any> {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string; data: any }>;
  duration: number;
  results?: T[];
}

export class BulkOperations {
  private config: BulkOperationConfig;

  constructor(
    private prisma: PrismaClient,
    config?: Partial<BulkOperationConfig>
  ) {
    this.config = {
      batchSize: DatabaseConfig.bulk.batchSize,
      maxConcurrency: DatabaseConfig.bulk.maxConcurrency,
      timeout: DatabaseConfig.bulk.timeout,
      ...config
    };
  }

  // Bulk insert vehicles with optimized performance
  async bulkCreateVehicles(vehicles: Array<{
    vin: string;
    year: number;
    make: string;
    model: string;
    variant?: string;
    engineSize?: string;
    fuelType?: string;
    transmission?: string;
    color?: string;
    mileage?: number;
    condition: string;
    acquisitionDate: Date;
    sellerId: string;
  }>): Promise<BulkResult> {
    return this.executeBulkOperation(
      'bulkCreateVehicles',
      vehicles,
      async (batch) => {
        // Use createMany for optimal performance
        const result = await this.prisma.vehicle.createMany({
          data: batch,
          skipDuplicates: true // Skip vehicles with duplicate VINs
        });
        return result;
      }
    );
  }

  // Bulk insert parts with validation and deduplication
  async bulkCreateParts(parts: Array<{
    vehicleId: string;
    sellerId: string;
    name: string;
    partNumber?: string;
    description: string;
    condition: string;
    price: number;
    currency?: string;
    status?: string;
    location: string;
    images?: string[];
    isListedOnMarketplace?: boolean;
    categoryId?: string;
  }>): Promise<BulkResult> {
    return this.executeBulkOperation(
      'bulkCreateParts',
      parts,
      async (batch) => {
        // Pre-process batch to ensure valid references
        const validatedBatch = await this.validatePartReferences(batch);

        const result = await this.prisma.part.createMany({
          data: validatedBatch.map(part => ({
            ...part,
            currency: part.currency || 'ZAR',
            status: part.status || 'AVAILABLE',
            isListedOnMarketplace: part.isListedOnMarketplace || false,
            images: part.images || []
          })),
          skipDuplicates: false
        });
        return result;
      }
    );
  }

  // Bulk update part marketplace status
  async bulkUpdatePartMarketplaceStatus(
    updates: Array<{ id: string; isListedOnMarketplace: boolean }>
  ): Promise<BulkResult> {
    return this.executeBulkOperation(
      'bulkUpdatePartMarketplaceStatus',
      updates,
      async (batch) => {
        // Use transaction for consistency
        const results = await this.prisma.$transaction(
          batch.map(update =>
            this.prisma.part.update({
              where: { id: update.id },
              data: { isListedOnMarketplace: update.isListedOnMarketplace }
            })
          )
        );
        return results;
      }
    );
  }

  // Bulk create sellers with address normalization
  async bulkCreateSellers(sellers: Array<{
    userId: string;
    businessName: string;
    businessType: string;
    description?: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    phone: string;
    whatsapp?: string;
    website?: string;
    businessHours?: any;
    isVerified?: boolean;
    subscriptionPlan?: string;
  }>): Promise<BulkResult> {
    return this.executeBulkOperation(
      'bulkCreateSellers',
      sellers,
      async (batch) => {
        // Normalize addresses and geocode if needed
        const processedBatch = await this.processSellerAddresses(batch);

        const result = await this.prisma.seller.createMany({
          data: processedBatch.map(seller => ({
            ...seller,
            country: seller.country || 'South Africa',
            isVerified: seller.isVerified || false,
            subscriptionPlan: seller.subscriptionPlan || 'STARTER'
          })),
          skipDuplicates: true
        });
        return result;
      }
    );
  }

  // Bulk import from CSV/JSON with schema validation
  async bulkImportFromData<T>(
    data: T[],
    entityType: 'vehicles' | 'parts' | 'sellers',
    options?: {
      validateSchema?: boolean;
      transform?: (item: T) => any;
      onProgress?: (processed: number, total: number) => void;
    }
  ): Promise<BulkResult> {
    const startTime = Date.now();

    try {
      // Transform data if transformer provided
      let processedData = data;
      if (options?.transform) {
        processedData = data.map(options.transform);
      }

      // Validate schema if requested
      if (options?.validateSchema) {
        processedData = await this.validateSchema(processedData, entityType);
      }

      // Route to appropriate bulk operation
      let result: BulkResult;
      switch (entityType) {
        case 'vehicles':
          result = await this.bulkCreateVehicles(processedData as any);
          break;
        case 'parts':
          result = await this.bulkCreateParts(processedData as any);
          break;
        case 'sellers':
          result = await this.bulkCreateSellers(processedData as any);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      return {
        ...result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        processed: 0,
        successful: 0,
        failed: data.length,
        errors: [{
          index: -1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        }],
        duration: Date.now() - startTime
      };
    }
  }

  // Bulk delete with cascade handling
  async bulkDelete(
    entityType: 'vehicles' | 'parts' | 'sellers',
    ids: string[]
  ): Promise<BulkResult> {
    return this.executeBulkOperation(
      `bulkDelete${entityType}`,
      ids,
      async (batch) => {
        let result;
        switch (entityType) {
          case 'vehicles':
            result = await this.prisma.vehicle.deleteMany({
              where: { id: { in: batch } }
            });
            break;
          case 'parts':
            result = await this.prisma.part.deleteMany({
              where: { id: { in: batch } }
            });
            break;
          case 'sellers':
            result = await this.prisma.seller.deleteMany({
              where: { id: { in: batch } }
            });
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
        return result;
      }
    );
  }

  // Core bulk operation executor with concurrency control
  private async executeBulkOperation<T, R>(
    operationName: string,
    data: T[],
    operation: (batch: T[]) => Promise<R>
  ): Promise<BulkResult<R>> {
    const startTime = Date.now();
    const totalItems = data.length;
    const results: R[] = [];
    const errors: Array<{ index: number; error: string; data: any }> = [];

    let processed = 0;
    let successful = 0;
    let failed = 0;

    // Create batches
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += this.config.batchSize) {
      batches.push(data.slice(i, i + this.config.batchSize));
    }

    // Process batches with concurrency control
    const semaphore = new Semaphore(this.config.maxConcurrency);

    const processBatch = async (batch: T[], batchIndex: number) => {
      await semaphore.acquire();

      try {
        const wrappedOperation = withMonitoring(
          databaseMonitor,
          operationName,
          operation
        );

        const result = await Promise.race([
          wrappedOperation(batch),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
          )
        ]) as R;

        results.push(result);
        successful += batch.length;
        processed += batch.length;

        // Report progress
        if (this.config.onProgress) {
          this.config.onProgress(processed, totalItems);
        }

      } catch (error) {
        failed += batch.length;
        processed += batch.length;

        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Record errors for each item in the batch
        batch.forEach((item, itemIndex) => {
          errors.push({
            index: batchIndex * this.config.batchSize + itemIndex,
            error: errorMsg,
            data: item
          });
        });

        // Call error handler if provided
        if (this.config.onError) {
          this.config.onError(error as Error, batch);
        }

      } finally {
        semaphore.release();
      }
    };

    // Execute all batches
    const batchPromises = batches.map((batch, index) => processBatch(batch, index));
    await Promise.all(batchPromises);

    return {
      processed,
      successful,
      failed,
      errors,
      duration: Date.now() - startTime,
      results
    };
  }

  // Validate part references (vehicle, seller, category existence)
  private async validatePartReferences(parts: any[]): Promise<any[]> {
    const vehicleIds = [...new Set(parts.map(p => p.vehicleId))];
    const sellerIds = [...new Set(parts.map(p => p.sellerId))];
    const categoryIds = [...new Set(parts.map(p => p.categoryId).filter(Boolean))];

    // Check if references exist
    const [existingVehicles, existingSellers, existingCategories] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true }
      }),
      this.prisma.seller.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true }
      }),
      categoryIds.length > 0 ? this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true }
      }) : []
    ]);

    const validVehicleIds = new Set(existingVehicles.map((v: { id: string }) => v.id));
    const validSellerIds = new Set(existingSellers.map((s: { id: string }) => s.id));
    const validCategoryIds = new Set(existingCategories.map((c: { id: string }) => c.id));

    // Filter out parts with invalid references
    return parts.filter(part => {
      const hasValidVehicle = validVehicleIds.has(part.vehicleId);
      const hasValidSeller = validSellerIds.has(part.sellerId);
      const hasValidCategory = !part.categoryId || validCategoryIds.has(part.categoryId);

      return hasValidVehicle && hasValidSeller && hasValidCategory;
    });
  }

  // Process seller addresses (geocoding, normalization)
  private async processSellerAddresses(sellers: any[]): Promise<any[]> {
    return sellers.map(seller => {
      // Normalize South African provinces
      const normalizedProvince = this.normalizeSouthAfricanProvince(seller.province);

      // Basic geocoding for major SA cities (in production, use proper geocoding service)
      const coordinates = this.getApproximateCoordinates(seller.city, normalizedProvince);

      return {
        ...seller,
        province: normalizedProvince,
        latitude: seller.latitude || coordinates.lat,
        longitude: seller.longitude || coordinates.lng
      };
    });
  }

  // Normalize South African province names
  private normalizeSouthAfricanProvince(province: string): string {
    const provinceMap: { [key: string]: string } = {
      'wc': 'Western Cape',
      'western cape': 'Western Cape',
      'wp': 'Western Cape',
      'gauteng': 'Gauteng',
      'gp': 'Gauteng',
      'kzn': 'KwaZulu-Natal',
      'kwazulu-natal': 'KwaZulu-Natal',
      'kwazulu natal': 'KwaZulu-Natal',
      'ec': 'Eastern Cape',
      'eastern cape': 'Eastern Cape',
      'nc': 'Northern Cape',
      'northern cape': 'Northern Cape',
      'fs': 'Free State',
      'free state': 'Free State',
      'mp': 'Mpumalanga',
      'mpumalanga': 'Mpumalanga',
      'lp': 'Limpopo',
      'limpopo': 'Limpopo',
      'nw': 'North West',
      'north west': 'North West',
      'northwest': 'North West'
    };

    const normalized = province.toLowerCase().trim();
    return provinceMap[normalized] || province;
  }

  // Get approximate coordinates for major SA cities
  private getApproximateCoordinates(city: string, province: string): { lat: number; lng: number } {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      'cape town': { lat: -33.9249, lng: 18.4241 },
      'johannesburg': { lat: -26.2041, lng: 28.0473 },
      'durban': { lat: -29.8587, lng: 31.0218 },
      'pretoria': { lat: -25.7479, lng: 28.2293 },
      'port elizabeth': { lat: -33.9608, lng: 25.6022 },
      'bloemfontein': { lat: -29.0852, lng: 26.1596 },
      'east london': { lat: -33.0153, lng: 27.9116 },
      'nelspruit': { lat: -25.4753, lng: 30.9703 },
      'polokwane': { lat: -23.9045, lng: 29.4689 },
      'kimberley': { lat: -28.7282, lng: 24.7499 }
    };

    const cityKey = city.toLowerCase().trim();
    return coordinates[cityKey] || { lat: -25.7461, lng: 28.1881 }; // Default to South Africa center
  }

  // Basic schema validation
  private async validateSchema(data: any[], entityType: string): Promise<any[]> {
    // This is a simplified validation - in production, use a schema validation library
    return data.filter(item => {
      switch (entityType) {
        case 'vehicles':
          return item.vin && item.year && item.make && item.model && item.sellerId;
        case 'parts':
          return item.name && item.description && item.price && item.vehicleId && item.sellerId;
        case 'sellers':
          return item.businessName && item.street && item.city && item.province && item.phone && item.userId;
        default:
          return true;
      }
    });
  }
}

// Semaphore for concurrency control
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

// Factory function for creating bulk operations instance
export const createBulkOperations = (prisma: PrismaClient, config?: Partial<BulkOperationConfig>) => {
  return new BulkOperations(prisma, config);
};

export default BulkOperations;