// Simplified analytics for testing
class Analytics {
  trackPageView(path?: string) {
    if (typeof window !== 'undefined') {
      console.log('📄 Page View:', path || window.location.pathname);
    }
  }

  trackUserEngagement(action: string, details?: any) {
    console.log('👤 User Engagement:', action, details);
  }
}

export const analytics = new Analytics();