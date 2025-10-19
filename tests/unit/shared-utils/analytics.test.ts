/**
 * @jest-environment jsdom
 */

import {
  analytics,
  performanceMonitor,
  trackError,
  trackUserEngagement
} from '@partpal/shared-utils';

// Mock Google Analytics gtag
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

// Mock dataLayer
Object.defineProperty(window, 'dataLayer', {
  value: [],
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    connection: { effectiveType: '4g' },
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Analytics Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = 'GA_TEST_ID';
    process.env.NODE_ENV = 'test';
  });

  describe('Analytics Class Initialization', () => {
    it('initializes with session ID', () => {
      expect(analytics).toBeDefined();
      // Session ID should be generated and stored
    });

    it('sets up Google Analytics when GA ID is provided', () => {
      // Analytics should initialize GA scripts
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      expect(scripts.length).toBeGreaterThan(0);
    });

    it('handles missing Google Analytics ID gracefully', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
      // Should not throw errors when GA ID is missing
      expect(() => analytics.trackEvent({ event: 'test' })).not.toThrow();
    });
  });

  describe('User ID Management', () => {
    it('sets user ID correctly', () => {
      const testUserId = 'user123';
      analytics.setUserId(testUserId);

      // Should call gtag config with user ID
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA_TEST_ID', {
        user_id: testUserId,
      });
    });

    it('handles user ID setting when gtag is not available', () => {
      const originalGtag = (window as any).gtag;
      delete (window as any).gtag;

      expect(() => analytics.setUserId('user123')).not.toThrow();

      (window as any).gtag = originalGtag;
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      (window as any).gtag = mockGtag;
    });

    it('tracks basic events correctly', () => {
      const event = {
        event: 'test_event',
        category: 'test_category',
        action: 'test_action',
        label: 'test_label',
        value: 100,
      };

      analytics.trackEvent(event);

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_action', {
        event_category: 'test_category',
        event_label: 'test_label',
        value: 100,
        custom_session_id: expect.any(String),
      });
    });

    it('tracks events with custom parameters', () => {
      const event = {
        event: 'custom_event',
        custom_parameters: {
          custom_param: 'custom_value',
          another_param: 123,
        },
      };

      analytics.trackEvent(event);

      expect(mockGtag).toHaveBeenCalledWith('event', 'custom_event', {
        event_category: undefined,
        event_label: undefined,
        value: undefined,
        custom_session_id: expect.any(String),
        custom_param: 'custom_value',
        another_param: 123,
      });
    });

    it('handles event tracking when gtag is not available', () => {
      delete (window as any).gtag;

      expect(() => analytics.trackEvent({ event: 'test' })).not.toThrow();
    });

    it('logs events in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      analytics.trackEvent({ event: 'dev_event' });

      expect(consoleSpy).toHaveBeenCalledWith('📊 Analytics Event:', { event: 'dev_event' });
      consoleSpy.mockRestore();
    });
  });

  describe('Page View Tracking', () => {
    beforeEach(() => {
      (window as any).gtag = mockGtag;
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/test-path',
          href: 'https://example.com/test-path',
        },
        writable: true,
      });
      Object.defineProperty(document, 'title', {
        value: 'Test Page',
        writable: true,
      });
    });

    it('tracks page views with current location', () => {
      analytics.trackPageView();

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_location: 'https://example.com/test-path',
        page_path: '/test-path',
        page_title: 'Test Page',
        custom_session_id: expect.any(String),
      });
    });

    it('tracks page views with custom path', () => {
      const customPath = '/custom/path';
      analytics.trackPageView(customPath);

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_location: 'https://example.com/test-path',
        page_path: customPath,
        page_title: 'Test Page',
        custom_session_id: expect.any(String),
      });
    });

    it('logs page views in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      analytics.trackPageView('/dev-path');

      expect(consoleSpy).toHaveBeenCalledWith('📄 Page View:', '/dev-path');
      consoleSpy.mockRestore();
    });
  });

  describe('PartPal-Specific Tracking', () => {
    beforeEach(() => {
      (window as any).gtag = mockGtag;
    });

    it('tracks part searches correctly', () => {
      const query = 'engine block';
      const filters = { make: 'Toyota', year: 2015 };
      const resultCount = 25;

      analytics.trackPartSearch(query, filters, resultCount);

      expect(mockGtag).toHaveBeenCalledWith('event', 'search', {
        event_category: 'marketplace',
        event_label: query,
        value: resultCount,
        custom_session_id: expect.any(String),
        search_query: query,
        search_filters: filters,
        result_count: resultCount,
      });
    });

    it('tracks part views correctly', () => {
      const partId = 'part123';
      const partName = 'Engine Block';
      const sellerId = 'seller456';

      analytics.trackPartView(partId, partName, sellerId);

      expect(mockGtag).toHaveBeenCalledWith('event', 'view_part', {
        event_category: 'marketplace',
        event_label: partName,
        custom_session_id: expect.any(String),
        part_id: partId,
        part_name: partName,
        seller_id: sellerId,
      });
    });

    it('tracks seller contact correctly', () => {
      const sellerId = 'seller123';
      const partId = 'part456';
      const contactMethod = 'phone';

      analytics.trackSellerContact(sellerId, partId, contactMethod);

      expect(mockGtag).toHaveBeenCalledWith('event', 'contact_seller', {
        event_category: 'marketplace',
        event_label: contactMethod,
        custom_session_id: expect.any(String),
        seller_id: sellerId,
        part_id: partId,
        contact_method: contactMethod,
      });
    });

    it('tracks inventory actions correctly', () => {
      const action = 'add_vehicle';
      const details = {
        make: 'Toyota',
        model: 'Camry',
        year: 2015,
        vin: 'TEST123456789'
      };

      analytics.trackInventoryAction(action, details);

      expect(mockGtag).toHaveBeenCalledWith('event', action, {
        event_category: 'ims',
        custom_session_id: expect.any(String),
        ...details,
      });
    });
  });

  describe('Device Information', () => {
    it('detects mobile devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo.isMobile).toBe(true);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.screenSize).toBe('400x800');
    });

    it('detects tablet devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1200, writable: true });

      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(true);
      expect(deviceInfo.isDesktop).toBe(false);
      expect(deviceInfo.screenSize).toBe('900x1200');
    });

    it('detects desktop devices correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });

      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isTablet).toBe(false);
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.screenSize).toBe('1440x900');
    });

    it('includes connection type when available', () => {
      const deviceInfo = analytics.getDeviceInfo();
      expect(deviceInfo.connectionType).toBe('4g');
    });

    it('handles server-side rendering gracefully', () => {
      // Simulate server environment
      const originalWindow = global.window;
      delete (global as any).window;

      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo.isMobile).toBe(false);
      expect(deviceInfo.isDesktop).toBe(true);
      expect(deviceInfo.screenSize).toBe('unknown');

      global.window = originalWindow;
    });
  });
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window.performance.now as jest.Mock).mockReturnValue(1000);
  });

  describe('Timing Measurements', () => {
    it('measures timing correctly', () => {
      (window.performance.now as jest.Mock)
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1250); // End time

      performanceMonitor.startTiming('test-operation');
      const duration = performanceMonitor.endTiming('test-operation');

      expect(duration).toBe(250);
    });

    it('returns 0 for unknown timing labels', () => {
      const duration = performanceMonitor.endTiming('unknown-operation');
      expect(duration).toBe(0);
    });

    it('logs timing in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (window.performance.now as jest.Mock)
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1150);

      performanceMonitor.startTiming('dev-operation');
      performanceMonitor.endTiming('dev-operation');

      expect(consoleSpy).toHaveBeenCalledWith('⏱️ dev-operation: 150.00ms');
      consoleSpy.mockRestore();
    });

    it('cleans up timing data after measurement', () => {
      performanceMonitor.startTiming('cleanup-test');

      // End timing should remove the stored start time
      performanceMonitor.endTiming('cleanup-test');

      // Ending again should return 0
      const secondDuration = performanceMonitor.endTiming('cleanup-test');
      expect(secondDuration).toBe(0);
    });
  });

  describe('Web Vitals Measurement', () => {
    it('sets up LCP observer correctly', () => {
      performanceMonitor.measureWebVitals();

      expect(PerformanceObserver).toHaveBeenCalledWith(expect.any(Function));

      const mockObserver = (PerformanceObserver as jest.Mock).mock.results[0].value;
      expect(mockObserver.observe).toHaveBeenCalledWith({
        entryTypes: ['largest-contentful-paint']
      });
    });

    it('handles PerformanceObserver errors gracefully', () => {
      const mockObserver = {
        observe: jest.fn().mockImplementation(() => {
          throw new Error('Not supported');
        }),
      };

      (PerformanceObserver as jest.Mock).mockReturnValue(mockObserver);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceMonitor.measureWebVitals();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Web Vitals not supported:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('handles server-side rendering gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => performanceMonitor.measureWebVitals()).not.toThrow();

      global.window = originalWindow;
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).gtag = mockGtag;
  });

  describe('trackError', () => {
    it('tracks errors with context correctly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      const context = 'test context';

      trackError(error, context);

      expect(mockGtag).toHaveBeenCalledWith('event', 'javascript_error', {
        event_category: 'error',
        event_label: 'Test error',
        custom_session_id: expect.any(String),
        error_stack: 'Error stack trace',
        error_context: context,
        user_agent: expect.any(String),
      });
    });

    it('tracks errors without context', () => {
      const error = new Error('Simple error');

      trackError(error);

      expect(mockGtag).toHaveBeenCalledWith('event', 'javascript_error', {
        event_category: 'error',
        event_label: 'Simple error',
        custom_session_id: expect.any(String),
        error_stack: expect.any(String),
        error_context: undefined,
        user_agent: expect.any(String),
      });
    });

    it('logs errors in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const error = new Error('Dev error');
      const context = 'dev context';

      trackError(error, context);

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Error tracked:', error, context);
      consoleSpy.mockRestore();
    });
  });

  describe('trackUserEngagement', () => {
    it('tracks user engagement with details', () => {
      const action = 'scroll_depth';
      const details = { depth: 75, page: '/marketplace' };

      trackUserEngagement(action, details);

      expect(mockGtag).toHaveBeenCalledWith('event', action, {
        event_category: 'engagement',
        custom_session_id: expect.any(String),
        ...details,
      });
    });

    it('tracks user engagement without details', () => {
      const action = 'button_click';

      trackUserEngagement(action);

      expect(mockGtag).toHaveBeenCalledWith('event', action, {
        event_category: 'engagement',
        custom_session_id: expect.any(String),
      });
    });
  });
});

describe('PartPal Business Scenarios', () => {
  beforeEach(() => {
    (window as any).gtag = mockGtag;
  });

  it('tracks complete part search journey', () => {
    // User searches for parts
    analytics.trackPartSearch('brake pads', { make: 'BMW', year: 2018 }, 15);

    // User views a specific part
    analytics.trackPartView('part789', 'BMW Brake Pads', 'seller123');

    // User contacts seller
    analytics.trackSellerContact('seller123', 'part789', 'whatsapp');

    expect(mockGtag).toHaveBeenCalledTimes(3);
    expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'search', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'view_part', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(3, 'event', 'contact_seller', expect.any(Object));
  });

  it('tracks inventory management workflow', () => {
    // Add vehicle to inventory
    analytics.trackInventoryAction('add_vehicle', {
      make: 'Ford',
      model: 'Focus',
      year: 2019,
      vin: 'FORD123456789'
    });

    // Add parts from vehicle
    analytics.trackInventoryAction('add_part', {
      partName: 'Headlight Assembly',
      condition: 'excellent',
      price: 2500
    });

    // Publish part to marketplace
    analytics.trackInventoryAction('publish_part', {
      partId: 'part123',
      listingPrice: 2500
    });

    expect(mockGtag).toHaveBeenCalledTimes(3);
    expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'add_vehicle', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'add_part', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(3, 'event', 'publish_part', expect.any(Object));
  });

  it('tracks user engagement patterns', () => {
    // Track various engagement actions
    trackUserEngagement('page_scroll', { depth: 50 });
    trackUserEngagement('filter_applied', { filterType: 'price_range' });
    trackUserEngagement('image_gallery_view', { imageCount: 5 });

    expect(mockGtag).toHaveBeenCalledTimes(3);
    expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'page_scroll', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'filter_applied', expect.any(Object));
    expect(mockGtag).toHaveBeenNthCalledWith(3, 'event', 'image_gallery_view', expect.any(Object));
  });
});