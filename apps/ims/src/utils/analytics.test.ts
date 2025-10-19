import { analytics } from './analytics';

describe('Analytics', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('trackPageView', () => {
    it('tracks page view with provided path', () => {
      analytics.trackPageView('/dashboard');

      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Page View:', '/dashboard');
    });

    it('tracks page view without path', () => {
      // When no path is provided, it uses window.location.pathname
      analytics.trackPageView();

      // Should be called with current window pathname
      expect(consoleLogSpy).toHaveBeenCalledWith('📄 Page View:', window.location.pathname);
    });

    it('tracks page view with empty string', () => {
      analytics.trackPageView('');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('trackUserEngagement', () => {
    it('tracks user engagement with action only', () => {
      analytics.trackUserEngagement('button_click');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '👤 User Engagement:',
        'button_click',
        undefined
      );
    });

    it('tracks user engagement with action and details', () => {
      const details = { componentId: 'add-part-btn', timestamp: Date.now() };
      analytics.trackUserEngagement('part_added', details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '👤 User Engagement:',
        'part_added',
        details
      );
    });

    it('tracks user engagement with nested details', () => {
      const details = {
        action: 'vehicle_created',
        vehicle: {
          id: 'v1',
          make: 'Toyota',
          model: 'Camry',
        },
        timestamp: new Date().toISOString(),
      };

      analytics.trackUserEngagement('vehicle_operation', details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '👤 User Engagement:',
        'vehicle_operation',
        details
      );
    });

    it('tracks user engagement with null details', () => {
      analytics.trackUserEngagement('action_name', null);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '👤 User Engagement:',
        'action_name',
        null
      );
    });
  });

  describe('Analytics instance', () => {
    it('exports a singleton analytics instance', () => {
      expect(analytics).toBeDefined();
      expect(typeof analytics.trackPageView).toBe('function');
      expect(typeof analytics.trackUserEngagement).toBe('function');
    });
  });
});
