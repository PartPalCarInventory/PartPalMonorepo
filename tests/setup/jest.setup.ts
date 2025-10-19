import '@testing-library/jest-dom';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/partpal_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Setup global TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch will be set up in individual tests as needed

// Mock IntersectionObserver for testing
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver for testing
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock geolocation for location-based testing
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
});

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage for testing
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Suppress console warnings during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Setup custom jest matchers for PartPal-specific testing
expect.extend({
  // Custom matcher for testing South African phone numbers
  toBeValidSAPhoneNumber(received) {
    const saPhoneRegex = /^(\+27|0)[1-9][0-9]{8}$/;
    const pass = saPhoneRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid SA phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid SA phone number`,
        pass: false,
      };
    }
  },

  // Custom matcher for testing ZAR currency formatting
  toBeValidZARCurrency(received) {
    const zarRegex = /^R\s?\d{1,3}(,\d{3})*(\.\d{2})?$/;
    const pass = zarRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be valid ZAR currency format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be valid ZAR currency format (e.g., R1,500.00)`,
        pass: false,
      };
    }
  },

  // Custom matcher for testing VIN numbers
  toBeValidVIN(received) {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    const pass = vinRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid VIN`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid 17-character VIN`,
        pass: false,
      };
    }
  }
});

// Add global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: 'user-1',
    email: 'test@partpal.co.za',
    name: 'Test User',
    role: 'SELLER',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to create mock part data
  createMockPart: (overrides = {}) => ({
    id: 'part-1',
    vehicleId: 'vehicle-1',
    sellerId: 'seller-1',
    name: 'Test Part',
    description: 'Test part description',
    condition: 'GOOD',
    price: 100,
    currency: 'ZAR',
    status: 'AVAILABLE',
    location: 'A1-B2',
    images: [],
    isListedOnMarketplace: true,
    categoryId: 'category-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to create mock vehicle data
  createMockVehicle: (overrides = {}) => ({
    id: 'vehicle-1',
    vin: '1HGCM82633A123456',
    year: 2015,
    make: 'Toyota',
    model: 'Corolla',
    condition: 'GOOD',
    acquisitionDate: new Date(),
    sellerId: 'seller-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Helper to wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0))
};