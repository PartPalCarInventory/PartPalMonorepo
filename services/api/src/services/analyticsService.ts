import { User, Part, Vehicle, Seller } from '@partpal/shared-types';

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referer?: string;
    page?: string;
  };
}

export interface SearchAnalytics {
  query?: string;
  filters: Record<string, any>;
  resultsCount: number;
  responseTime: number;
  userId?: string;
  sessionId: string;
}

export interface BusinessAnalytics {
  sellerId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    views: number;
    inquiries: number;
    conversions: number;
    revenue: number;
    newParts: number;
    topParts: Array<{ partId: string; name: string; views: number }>;
  };
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  totalParts: number;
  marketplaceParts: number;
  totalSearches: number;
  topSearchQueries: Array<{ query: string; count: number }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private isConfigured = false;
  private googleAnalyticsId: string | null = null;

  constructor() {
    this.configure();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private configure(): void {
    this.googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID || null;

    if (!this.googleAnalyticsId) {
      console.warn('Google Analytics not configured. Analytics will be stored locally only.');
    } else {
      console.log('Analytics service configured with Google Analytics');
    }

    this.isConfigured = true;
  }

  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Store locally (you would implement database storage here)
      await this.storeEventLocally(analyticsEvent);

      // Send to Google Analytics if configured
      if (this.googleAnalyticsId) {
        await this.sendToGoogleAnalytics(analyticsEvent);
      }

      console.log('Analytics event tracked:', analyticsEvent.event);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  async trackUserRegistration(user: User, source?: string): Promise<void> {
    await this.trackEvent({
      event: 'user_registration',
      userId: user.id,
      properties: {
        userRole: user.role,
        source: source || 'direct',
        isVerified: user.isVerified,
      },
    });
  }

  async trackUserLogin(user: User, method: 'email' | 'social' = 'email'): Promise<void> {
    await this.trackEvent({
      event: 'user_login',
      userId: user.id,
      properties: {
        userRole: user.role,
        loginMethod: method,
        isVerified: user.isVerified,
      },
    });
  }

  async trackPartView(part: Part, userId?: string, sessionId?: string): Promise<void> {
    await this.trackEvent({
      event: 'part_view',
      userId,
      sessionId,
      properties: {
        partId: part.id,
        partName: part.name,
        partCategory: part.categoryId,
        partPrice: Number(part.price),
        partCondition: part.condition,
        sellerId: part.sellerId,
        vehicleMake: part.vehicle?.make,
        vehicleModel: part.vehicle?.model,
        vehicleYear: part.vehicle?.year,
        isMarketplaceListing: part.isListedOnMarketplace,
      },
    });
  }

  async trackPartInquiry(part: Part, buyerUserId?: string): Promise<void> {
    await this.trackEvent({
      event: 'part_inquiry',
      userId: buyerUserId,
      properties: {
        partId: part.id,
        partName: part.name,
        partPrice: Number(part.price),
        sellerId: part.sellerId,
        vehicleMake: part.vehicle?.make,
        vehicleModel: part.vehicle?.model,
      },
    });
  }

  async trackPartSale(part: Part, sellerId: string): Promise<void> {
    await this.trackEvent({
      event: 'part_sale',
      userId: sellerId,
      properties: {
        partId: part.id,
        partName: part.name,
        salePrice: Number(part.price),
        partCondition: part.condition,
        sellerId,
        vehicleMake: part.vehicle?.make,
        vehicleModel: part.vehicle?.model,
        revenue: Number(part.price),
      },
    });
  }

  async trackSearch(searchData: SearchAnalytics): Promise<void> {
    await this.trackEvent({
      event: 'marketplace_search',
      userId: searchData.userId,
      sessionId: searchData.sessionId,
      properties: {
        query: searchData.query,
        filters: searchData.filters,
        resultsCount: searchData.resultsCount,
        responseTime: searchData.responseTime,
        hasQuery: !!searchData.query,
        hasFilters: Object.keys(searchData.filters).length > 0,
      },
    });
  }

  async trackSellerVerification(seller: Seller, adminUserId: string, approved: boolean): Promise<void> {
    await this.trackEvent({
      event: 'seller_verification',
      userId: adminUserId,
      properties: {
        sellerId: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        approved,
        sellerLocation: `${(seller as any).city}, ${(seller as any).province}`,
      },
    });
  }

  async trackVehicleAdded(vehicle: Vehicle, sellerId: string): Promise<void> {
    await this.trackEvent({
      event: 'vehicle_added',
      userId: sellerId,
      properties: {
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        condition: vehicle.condition,
        sellerId,
      },
    });
  }

  async trackMarketplaceListing(part: Part, sellerId: string, listed: boolean): Promise<void> {
    await this.trackEvent({
      event: 'marketplace_listing',
      userId: sellerId,
      properties: {
        partId: part.id,
        partName: part.name,
        listed,
        sellerId,
        vehicleMake: part.vehicle?.make,
        vehicleModel: part.vehicle?.model,
      },
    });
  }

  private async storeEventLocally(event: AnalyticsEvent): Promise<void> {
    // In a real implementation, you would store this in your database
    // For now, we'll just log it
    console.log('Storing analytics event locally:', {
      event: event.event,
      userId: event.userId,
      timestamp: event.timestamp,
      properties: Object.keys(event.properties),
    });
  }

  private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!this.googleAnalyticsId) return;

    try {
      // Google Analytics 4 Measurement Protocol
      const measurementId = this.googleAnalyticsId;
      const apiSecret = process.env.GA4_API_SECRET;

      if (!apiSecret) {
        console.warn('GA4 API Secret not configured');
        return;
      }

      const payload = {
        client_id: event.userId || event.sessionId || 'anonymous',
        events: [
          {
            name: event.event,
            params: {
              ...event.properties,
              timestamp_micros: event.timestamp.getTime() * 1000,
            },
          },
        ],
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`GA4 request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send to Google Analytics:', error);
    }
  }

  async getBusinessAnalytics(sellerId: string, period: BusinessAnalytics['period']): Promise<BusinessAnalytics> {
    // In a real implementation, you would query your analytics database
    // This is a mock implementation
    return {
      sellerId,
      period,
      metrics: {
        views: 0,
        inquiries: 0,
        conversions: 0,
        revenue: 0,
        newParts: 0,
        topParts: [],
      },
    };
  }

  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    // In a real implementation, you would aggregate data from your database
    // This is a mock implementation
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSellers: 0,
      verifiedSellers: 0,
      totalParts: 0,
      marketplaceParts: 0,
      totalSearches: 0,
      topSearchQueries: [],
    };
  }

  async trackCustomEvent(
    eventName: string,
    properties: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      event: eventName,
      userId,
      sessionId,
      properties,
    });
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}

export const analyticsService = AnalyticsService.getInstance();