/**
 * Database test setup and teardown
 */

import { PrismaClient } from '@prisma/client';

// Mock Prisma for testing
export const mockPrisma = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  vehicle: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  part: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn()
  },
  seller: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  category: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn()
} as unknown as PrismaClient;

// Mock process.env for database tests
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/partpal_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
});

beforeEach(() => {
  // Reset all mocks before each test
  Object.values(mockPrisma).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });

  if (jest.isMockFunction(mockPrisma.$transaction)) {
    mockPrisma.$transaction.mockReset();
  }
  if (jest.isMockFunction(mockPrisma.$connect)) {
    mockPrisma.$connect.mockReset();
  }
  if (jest.isMockFunction(mockPrisma.$disconnect)) {
    mockPrisma.$disconnect.mockReset();
  }
});

afterAll(() => {
  delete process.env.DATABASE_URL;
  delete process.env.REDIS_URL;
});

// Helper function to create mock data
export const createMockData = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@partpal.co.za',
    name: 'Test User',
    role: 'SELLER',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  vehicle: (overrides = {}) => ({
    id: 'vehicle-123',
    vin: '1HGCM82633A123456',
    year: 2018,
    make: 'Toyota',
    model: 'Corolla',
    condition: 'GOOD',
    acquisitionDate: new Date(),
    sellerId: 'seller-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  part: (overrides = {}) => ({
    id: 'part-123',
    vehicleId: 'vehicle-123',
    sellerId: 'seller-123',
    name: 'Alternator',
    description: 'High-quality alternator',
    condition: 'EXCELLENT',
    price: 850,
    currency: 'ZAR',
    status: 'AVAILABLE',
    location: 'A1-B2',
    images: ['image1.jpg'],
    isListedOnMarketplace: true,
    categoryId: 'category-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  seller: (overrides = {}) => ({
    id: 'seller-123',
    userId: 'user-123',
    businessName: 'Test Auto Parts',
    businessType: 'SCRAP_YARD',
    isVerified: true,
    rating: 4.5,
    totalSales: 100,
    subscriptionPlan: 'PROFESSIONAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  category: (overrides = {}) => ({
    id: 'category-123',
    name: 'Engine Components',
    description: 'Engine related parts',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
};