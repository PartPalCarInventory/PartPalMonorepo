import { prisma } from '@partpal/database';
import bcrypt from 'bcryptjs';

export interface TestUser {
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'buyer';
  isVerified: boolean;
  password?: string;
}

export interface TestVehicle {
  sellerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage?: number;
  engineSize?: string;
  fuelType?: string;
}

export interface TestPart {
  sellerId: string;
  vehicleId: string;
  name: string;
  partNumber: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  price: number;
  isListedOnMarketplace: boolean;
  description?: string;
  category?: string;
}

export async function createTestUser(userData: TestUser) {
  const hashedPassword = await bcrypt.hash(userData.password || 'testpass123', 10);

  return await prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      isVerified: userData.isVerified,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function createTestVehicle(vehicleData: TestVehicle) {
  return await prisma.vehicle.create({
    data: {
      sellerId: vehicleData.sellerId,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      vin: vehicleData.vin,
      mileage: vehicleData.mileage || 50000,
      engineSize: vehicleData.engineSize || '2.0L',
      fuelType: vehicleData.fuelType || 'petrol',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function createTestPart(partData: TestPart) {
  return await prisma.part.create({
    data: {
      sellerId: partData.sellerId,
      vehicleId: partData.vehicleId,
      name: partData.name,
      partNumber: partData.partNumber,
      condition: partData.condition,
      price: partData.price,
      isListedOnMarketplace: partData.isListedOnMarketplace,
      description: partData.description || `Test ${partData.name} in ${partData.condition} condition`,
      category: partData.category || 'engine',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function createTestSeller() {
  return await createTestUser({
    email: 'testseller@partpal.test',
    name: 'Test Auto Parts',
    role: 'seller',
    isVerified: true,
  });
}

export async function createTestBuyer() {
  return await createTestUser({
    email: 'testbuyer@partpal.test',
    name: 'Test Mechanic Shop',
    role: 'buyer',
    isVerified: true,
  });
}

export async function createTestAdmin() {
  return await createTestUser({
    email: 'testadmin@partpal.test',
    name: 'Test Administrator',
    role: 'admin',
    isVerified: true,
  });
}

export async function createPartPalTestScenario() {
  // Create a complete test scenario with seller, vehicles, and parts
  const seller = await createTestSeller();

  const vehicle1 = await createTestVehicle({
    sellerId: seller.id,
    make: 'Toyota',
    model: 'Hilux',
    year: 2018,
    vin: 'TOYOTA2018HILUX001',
    mileage: 120000,
    engineSize: '3.0L',
    fuelType: 'diesel',
  });

  const vehicle2 = await createTestVehicle({
    sellerId: seller.id,
    make: 'BMW',
    model: '320i',
    year: 2016,
    vin: 'BMW2016320I001',
    mileage: 85000,
    engineSize: '2.0L',
    fuelType: 'petrol',
  });

  const parts = await Promise.all([
    createTestPart({
      sellerId: seller.id,
      vehicleId: vehicle1.id,
      name: 'Turbocharger',
      partNumber: 'HIL-TURBO-001',
      condition: 'excellent',
      price: 8500,
      isListedOnMarketplace: true,
      category: 'engine',
      description: 'Low mileage turbocharger from 2018 Hilux, excellent condition',
    }),
    createTestPart({
      sellerId: seller.id,
      vehicleId: vehicle1.id,
      name: 'Brake Discs Set',
      partNumber: 'HIL-BRK-DISC-001',
      condition: 'good',
      price: 1200,
      isListedOnMarketplace: true,
      category: 'braking',
      description: 'Front and rear brake discs, good condition with minimal wear',
    }),
    createTestPart({
      sellerId: seller.id,
      vehicleId: vehicle2.id,
      name: 'Xenon Headlight',
      partNumber: 'BMW-XENON-001',
      condition: 'excellent',
      price: 4500,
      isListedOnMarketplace: true,
      category: 'lighting',
      description: 'BMW 320i xenon headlight assembly, perfect working order',
    }),
    createTestPart({
      sellerId: seller.id,
      vehicleId: vehicle2.id,
      name: 'Gear Box',
      partNumber: 'BMW-GBOX-001',
      condition: 'fair',
      price: 15000,
      isListedOnMarketplace: false, // Not listed yet
      category: 'transmission',
      description: 'Manual gearbox, needs minor repair but functional',
    }),
  ]);

  return {
    seller,
    vehicles: [vehicle1, vehicle2],
    parts,
    listedParts: parts.filter(p => p.isListedOnMarketplace),
  };
}

export async function cleanupTestData(userIds: string[]) {
  // Clean up test data in the correct order to handle foreign key constraints

  // Delete parts first
  await prisma.part.deleteMany({
    where: {
      sellerId: { in: userIds },
    },
  });

  // Delete vehicles
  await prisma.vehicle.deleteMany({
    where: {
      sellerId: { in: userIds },
    },
  });

  // Delete users last
  await prisma.user.deleteMany({
    where: {
      id: { in: userIds },
    },
  });
}

export function generateTestVIN(make: string, year: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${make.toUpperCase()}${year}${randomSuffix}`;
}

export function generateTestPartNumber(make: string, category: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${make.toUpperCase()}-${categoryCode}-${randomSuffix}`;
}

export function createTestPartData(overrides: Partial<TestPart> = {}): Omit<TestPart, 'sellerId' | 'vehicleId'> {
  const make = overrides.name?.split(' ')[0] || 'Toyota';
  const category = overrides.category || 'engine';

  return {
    name: 'Test Engine Block',
    partNumber: generateTestPartNumber(make, category),
    condition: 'good',
    price: 5000,
    isListedOnMarketplace: true,
    description: 'Test part for automated testing',
    category,
    ...overrides,
  };
}

export function createTestVehicleData(overrides: Partial<TestVehicle> = {}): Omit<TestVehicle, 'sellerId'> {
  const make = overrides.make || 'Toyota';
  const year = overrides.year || 2020;

  return {
    make,
    model: 'Corolla',
    year,
    vin: generateTestVIN(make, year),
    mileage: 45000,
    engineSize: '1.6L',
    fuelType: 'petrol',
    ...overrides,
  };
}