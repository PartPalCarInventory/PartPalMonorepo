import { analytics, performanceMonitor, trackError, trackUserEngagement } from '../analytics';

// Mock window and global objects
const mockWindow = {
  location: {
    pathname: '/test-path',
    href: 'https://partpal.co.za/test-path'
  },
  innerWidth: 1024,
  innerHeight: 768,
  performance: {
    now: jest.fn(() => 1000)
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (test browser)',
    connection: { effectiveType: '4g' }
  },
  document: {
    title: 'Test Page',
    createElement: jest.fn(() => ({
      async: true,
      src: '',
      parentNode: null
    })),
    head: {
      appendChild: jest.fn()
    }
  },
  dataLayer: []
};

// Mock gtag function
const mockGtag = jest.fn();

// Setup DOM environment
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockWindow.document,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockWindow.navigator,
  writable: true
});

Object.defineProperty(global, 'performance', {
  value: mockWindow.performance,
  writable: true
});

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).gtag = mockGtag;
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = 'GA_TEST_ID';
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  });

  describe('Initialization', () => {
    it('should initialize with session ID', () => {
      expect(analytics).toBeDefined();
      // Session ID should be set (private property, so we test behavior)
    });

    it('should set up Google Analytics when GA ID is provided', () => {
      expect(mockWindow.document.createElement).toHaveBeenCalledWith('script');
      expect(mockWindow.document.head.appendChild).toHaveBeenCalled();
    });

    it('should handle missing GA ID gracefully', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
      // Should not throw an error
      expect(() => analytics.trackPageView()).not.toThrow();
    });
  });

  describe('User ID Management', () => {
    it('should set user ID correctly', () => {
      analytics.setUserId('user-123');

      expect(mockGtag).toHaveBeenCalledWith(
        'config',
        'GA_TEST_ID',
        expect.objectContaining({
          user_id: 'user-123'
        })
      );
    });
  });

  describe('Event Tracking', () => {
    it('should track basic events', () => {
      const event = {
        event: 'test_event',
        category: 'test_category',
        action: 'test_action',
        label: 'test_label',
        value: 42
      };

      analytics.trackEvent(event);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'test_action',
        expect.objectContaining({
          event_category: 'test_category',
          event_label: 'test_label',
          value: 42
        })
      );
    });

    it('should include custom parameters', () => {
      const event = {
        event: 'custom_event',
        action: 'custom_action',
        custom_parameters: {
          custom_param: 'custom_value',
          another_param: 123
        }
      };

      analytics.trackEvent(event);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'custom_action',
        expect.objectContaining({
          custom_param: 'custom_value',
          another_param: 123
        })
      );
    });

    it('should log events in development mode', () => {
      process.env.NODE_ENV = 'development';

      const event = {
        event: 'dev_event',
        action: 'dev_action'
      };

      analytics.trackEvent(event);

      expect(console.log).toHaveBeenCalledWith('📊 Analytics Event:', event);
    });
  });

  describe('Page View Tracking', () => {
    it('should track page views with current location', () => {
      analytics.trackPageView();

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_location: 'https://partpal.co.za/test-path',
          page_path: '/test-path',
          page_title: 'Test Page'
        })
      );
    });

    it('should track page views with custom path', () => {
      analytics.trackPageView('/custom-path');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/custom-path'
        })
      );
    });

    it('should log page views in development mode', () => {
      process.env.NODE_ENV = 'development';
      analytics.trackPageView('/dev-path');

      expect(console.log).toHaveBeenCalledWith('📄 Page View:', '/dev-path');
    });
  });

  describe('PartPal-specific Tracking', () => {
    it('should track part searches correctly', () => {
      const query = 'alternator';
      const filters = { make: 'Toyota', year: 2018 };
      const resultCount = 5;

      analytics.trackPartSearch(query, filters, resultCount);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'search',
        expect.objectContaining({
          event_category: 'marketplace',
          event_label: 'alternator',
          value: 5,
          search_query: 'alternator',
          search_filters: filters,
          result_count: 5
        })
      );
    });

    it('should track part views correctly', () => {
      analytics.trackPartView('part-123', 'Toyota Alternator', 'seller-456');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'view_part',
        expect.objectContaining({
          event_category: 'marketplace',
          event_label: 'Toyota Alternator',
          part_id: 'part-123',
          part_name: 'Toyota Alternator',
          seller_id: 'seller-456'
        })
      );
    });

    it('should track seller contact correctly', () => {
      analytics.trackSellerContact('seller-123', 'part-456', 'whatsapp');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'contact_seller',
        expect.objectContaining({
          event_category: 'marketplace',
          event_label: 'whatsapp',
          seller_id: 'seller-123',
          part_id: 'part-456',
          contact_method: 'whatsapp'
        })
      );
    });

    it('should track inventory actions correctly', () => {
      const details = { vehicle_id: 'vehicle-123', part_count: 5 };
      analytics.trackInventoryAction('add_vehicle', details);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'add_vehicle',
        expect.objectContaining({
          event_category: 'ims',
          vehicle_id: 'vehicle-123',
          part_count: 5
        })
      );
    });
  });

  describe('Device Information', () => {
    it('should detect desktop correctly', () => {
      (window as any).innerWidth = 1200;
      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        userAgent: 'Mozilla/5.0 (test browser)',
        screenSize: '1200x768',
        connectionType: '4g'
      });
    });

    it('should detect mobile correctly', () => {
      (window as any).innerWidth = 375;
      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo).toEqual(
        expect.objectContaining({
          isMobile: true,
          isTablet: false,
          isDesktop: false
        })
      );
    });

    it('should detect tablet correctly', () => {
      (window as any).innerWidth = 768;
      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo).toEqual(
        expect.objectContaining({
          isMobile: false,
          isTablet: true,
          isDesktop: false
        })
      );
    });

    it('should handle server-side rendering', () => {
      const originalWindow = (global as any).window;
      delete (global as any).window;

      const deviceInfo = analytics.getDeviceInfo();

      expect(deviceInfo).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        userAgent: '',
        screenSize: 'unknown'
      });

      (global as any).window = originalWindow;
    });
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    performance.now = jest.fn()
      .mockReturnValueOnce(1000) // startTiming
      .mockReturnValueOnce(1500); // endTiming
  });

  it('should measure timing correctly', () => {
    performanceMonitor.startTiming('test-operation');
    const duration = performanceMonitor.endTiming('test-operation');

    expect(duration).toBe(500);
    expect(performance.now).toHaveBeenCalledTimes(2);
  });

  it('should log timing in development mode', () => {
    process.env.NODE_ENV = 'development';

    performanceMonitor.startTiming('dev-operation');
    performanceMonitor.endTiming('dev-operation');

    expect(console.log).toHaveBeenCalledWith('⏱️ dev-operation: 500.00ms');
  });

  it('should return 0 for unknown timing labels', () => {
    const duration = performanceMonitor.endTiming('unknown-operation');
    expect(duration).toBe(0);
  });

  it('should handle web vitals measurement', () => {
    const mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn()
    };

    (global as any).PerformanceObserver = jest.fn(() => mockObserver);

    performanceMonitor.measureWebVitals();

    expect(global.PerformanceObserver).toHaveBeenCalled();
    expect(mockObserver.observe).toHaveBeenCalledWith({
      entryTypes: ['largest-contentful-paint']
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).gtag = mockGtag;
    console.error = jest.fn();
  });

  describe('trackError', () => {
    it('should track errors correctly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      trackError(error, 'test context');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'javascript_error',
        expect.objectContaining({
          event_category: 'error',
          event_label: 'Test error',
          error_stack: 'Error stack trace',
          error_context: 'test context',
          user_agent: 'Mozilla/5.0 (test browser)'
        })
      );
    });

    it('should log errors in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');

      trackError(error, 'dev context');

      expect(console.error).toHaveBeenCalledWith(
        '🚨 Error tracked:',
        error,
        'dev context'
      );
    });

    it('should handle errors without context', () => {
      const error = new Error('No context error');

      expect(() => trackError(error)).not.toThrow();

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'javascript_error',
        expect.objectContaining({
          event_label: 'No context error',
          error_context: undefined
        })
      );
    });
  });

  describe('trackUserEngagement', () => {
    it('should track user engagement correctly', () => {
      const details = { button_clicked: 'search', page: 'marketplace' };

      trackUserEngagement('button_click', details);

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'button_click',
        expect.objectContaining({
          event_category: 'engagement',
          button_clicked: 'search',
          page: 'marketplace'
        })
      );
    });

    it('should handle engagement tracking without details', () => {
      trackUserEngagement('page_scroll');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'page_scroll',
        expect.objectContaining({
          event_category: 'engagement'
        })
      );
    });
  });
});

describe('South African Specific Features', () => {
  it('should handle ZAR currency formatting in analytics', () => {
    analytics.trackEvent({
      event: 'part_price_view',
      action: 'view_price',
      custom_parameters: {
        price: 1500,
        currency: 'ZAR',
        formatted_price: 'R 1,500.00'
      }
    });

    expect(mockGtag).toHaveBeenCalledWith(
      'event',
      'view_price',
      expect.objectContaining({
        price: 1500,
        currency: 'ZAR',
        formatted_price: 'R 1,500.00'
      })
    );
  });

  it('should track location-based searches for SA provinces', () => {
    analytics.trackPartSearch('alternator', {
      location: 'Western Cape',
      city: 'Cape Town',
      radius: 50
    }, 8);

    expect(mockGtag).toHaveBeenCalledWith(
      'event',
      'search',
      expect.objectContaining({
        search_filters: expect.objectContaining({
          location: 'Western Cape',
          city: 'Cape Town',
          radius: 50
        })
      })
    );
  });
});