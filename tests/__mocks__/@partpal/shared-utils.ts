// Mock analytics
export const analytics = {
  setUserId: jest.fn(),
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackPartSearch: jest.fn(),
  trackPartView: jest.fn(),
  trackSellerContact: jest.fn(),
  trackInventoryAction: jest.fn(),
  getDeviceInfo: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: 'test',
    screenSize: '1920x1080',
  })),
};

// Mock performance monitor
export const performanceMonitor = {
  startTiming: jest.fn(),
  endTiming: jest.fn(() => 100),
  measureWebVitals: jest.fn(),
};

// Mock utility functions
export function trackError(error: Error, context?: string) {
  analytics.trackEvent({
    event: 'error',
    category: 'error',
    action: 'javascript_error',
    label: error.message,
  });
}

export function trackUserEngagement(action: string, details?: any) {
  analytics.trackEvent({
    event: 'user_engagement',
    category: 'engagement',
    action,
    custom_parameters: details,
  });
}