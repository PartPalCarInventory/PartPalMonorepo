// Test environment global types
import '@testing-library/jest-dom';

declare global {
  namespace NodeJS {
    interface Global {
      testUtils: any;
    }
  }

  const global: NodeJS.Global & typeof globalThis;
}

// Mock module declarations for workspace packages when they can't be resolved
declare module '@partpal/shared-ui' {
  export const Button: any;
  export const Card: any;
  export const CardHeader: any;
  export const CardTitle: any;
  export const CardDescription: any;
  export const CardContent: any;
  export const CardFooter: any;
  export const Badge: any;
}

declare module '@partpal/shared-utils' {
  export const analytics: any;
  export const performanceMonitor: any;
  export function trackError(error: Error, context?: string): void;
  export function trackUserEngagement(action: string, details?: any): void;
}

declare module '@partpal/shared-types' {
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }

  export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
  }
}

declare module '@partpal/database' {
  export const prisma: any;
}

declare module '@partpal/api-client' {
  export default {};
}

// Jest and testing library extensions
declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
    toBeValidPartNumber(): R;
    toBeValidVIN(): R;
    toBeWithinPriceRange(min: number, max: number): R;
  }
}