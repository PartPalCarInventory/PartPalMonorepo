// Analytics and monitoring utilities

interface AnalyticsEvent {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenSize: string;
  connectionType?: string;
}

class Analytics {
  private isInitialized = false;
  private userId?: string;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeIfBrowser();
  }

  private initializeIfBrowser() {
    if (typeof window !== 'undefined') {
      this.isInitialized = true;
      this.setupGoogleAnalytics();
      this.trackPageView();
    }
  }

  private setupGoogleAnalytics() {
    const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
    if (!gaId) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(arguments);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', gaId, {
      send_page_view: false, // We'll handle page views manually
      user_id: this.userId,
      custom_map: {
        custom_session_id: this.sessionId,
      },
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (this.isInitialized && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
        user_id: userId,
      });
    }
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action || event.event, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_session_id: this.sessionId,
        ...event.custom_parameters,
      });
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }
  }

  trackPageView(path?: string) {
    if (!this.isInitialized) return;

    const page = path || window.location.pathname;

    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_location: window.location.href,
        page_path: page,
        page_title: document.title,
        custom_session_id: this.sessionId,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📄 Page View:', page);
    }
  }

  // PartPal-specific tracking methods
  trackPartSearch(query: string, filters: any, resultCount: number) {
    this.trackEvent({
      event: 'part_search',
      category: 'marketplace',
      action: 'search',
      label: query,
      value: resultCount,
      custom_parameters: {
        search_query: query,
        search_filters: filters,
        result_count: resultCount,
      },
    });
  }

  trackPartView(partId: string, partName: string, sellerId: string) {
    this.trackEvent({
      event: 'part_view',
      category: 'marketplace',
      action: 'view_part',
      label: partName,
      custom_parameters: {
        part_id: partId,
        part_name: partName,
        seller_id: sellerId,
      },
    });
  }

  trackSellerContact(sellerId: string, partId: string, contactMethod: string) {
    this.trackEvent({
      event: 'seller_contact',
      category: 'marketplace',
      action: 'contact_seller',
      label: contactMethod,
      custom_parameters: {
        seller_id: sellerId,
        part_id: partId,
        contact_method: contactMethod,
      },
    });
  }

  trackInventoryAction(action: 'add_vehicle' | 'add_part' | 'publish_part' | 'sell_part', details: any) {
    this.trackEvent({
      event: 'inventory_action',
      category: 'ims',
      action,
      custom_parameters: details,
    });
  }

  getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        userAgent: '',
        screenSize: 'unknown',
      };
    }

    const userAgent = navigator.userAgent;
    const width = window.innerWidth;

    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      userAgent,
      screenSize: `${width}x${window.innerHeight}`,
      connectionType: (navigator as any).connection?.effectiveType,
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  startTiming(label: string) {
    this.metrics.set(label, performance.now());
  }

  endTiming(label: string): number {
    const startTime = this.metrics.get(label);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.metrics.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measureWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          analytics.trackEvent({
            event: 'web_vitals',
            category: 'performance',
            action: 'lcp',
            value: Math.round(entry.startTime),
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Web Vitals not supported:', error);
    }
  }
}

// Export singleton instances
export const analytics = new Analytics();
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function trackError(error: Error, context?: string) {
  analytics.trackEvent({
    event: 'error',
    category: 'error',
    action: 'javascript_error',
    label: error.message,
    custom_parameters: {
      error_stack: error.stack,
      error_context: context,
      user_agent: navigator.userAgent,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error tracked:', error, context);
  }
}

export function trackUserEngagement(action: string, details?: any) {
  analytics.trackEvent({
    event: 'user_engagement',
    category: 'engagement',
    action,
    custom_parameters: details,
  });
}