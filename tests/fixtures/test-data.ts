import { User, Vehicle, Part, Seller, Category, Address, ContactInfo, BusinessHours } from '@partpal/shared-types';

// South African test data
export const southAfricanProvinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

export const southAfricanCities = {
  'Western Cape': ['Cape Town', 'Stellenbosch', 'George', 'Worcester', 'Paarl'],
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Sandton', 'Midrand'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Richards Bay', 'Newcastle']
};

// Mock business hours
export const mockBusinessHours: BusinessHours = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  saturday: { isOpen: true, openTime: '08:00', closeTime: '13:00' },
  sunday: { isOpen: false }
};

// Test user factory
export class TestUserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Math.random().toString(36).substr(2, 9)}@partpal.co.za`,
      name: 'Test User',
      role: 'SELLER',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createBuyer(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'BUYER',
      email: `buyer-${Math.random().toString(36).substr(2, 9)}@gmail.com`,
      name: 'Test Buyer',
      ...overrides
    });
  }

  static createSeller(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'SELLER',
      email: `seller-${Math.random().toString(36).substr(2, 9)}@partpal.co.za`,
      name: 'Test Seller',
      ...overrides
    });
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'ADMIN',
      email: `admin-${Math.random().toString(36).substr(2, 9)}@partpal.co.za`,
      name: 'Test Admin',
      ...overrides
    });
  }
}

// Test address factory
export class TestAddressFactory {
  static create(overrides: Partial<Address> = {}): Address {
    const province = southAfricanProvinces[Math.floor(Math.random() * southAfricanProvinces.length)];
    const cities = southAfricanCities[province as keyof typeof southAfricanCities] || ['Test City'];
    const city = cities[Math.floor(Math.random() * cities.length)];

    return {
      street: `${Math.floor(Math.random() * 999) + 1} Test Street`,
      city,
      province,
      postalCode: Math.floor(Math.random() * 9000 + 1000).toString(),
      country: 'South Africa',
      coordinates: {
        lat: -25.7479 + (Math.random() - 0.5) * 10, // Roughly South Africa
        lng: 28.2293 + (Math.random() - 0.5) * 10
      },
      ...overrides
    };
  }

  static createCapeTown(overrides: Partial<Address> = {}): Address {
    return this.create({
      city: 'Cape Town',
      province: 'Western Cape',
      coordinates: {
        lat: -33.9249 + (Math.random() - 0.5) * 0.2,
        lng: 18.4241 + (Math.random() - 0.5) * 0.2
      },
      ...overrides
    });
  }

  static createJohannesburg(overrides: Partial<Address> = {}): Address {
    return this.create({
      city: 'Johannesburg',
      province: 'Gauteng',
      coordinates: {
        lat: -26.2041 + (Math.random() - 0.5) * 0.2,
        lng: 28.0473 + (Math.random() - 0.5) * 0.2
      },
      ...overrides
    });
  }
}

// Test contact info factory
export class TestContactInfoFactory {
  static create(overrides: Partial<ContactInfo> = {}): ContactInfo {
    const phoneNumber = `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000 + 10000000)}`;

    return {
      phone: phoneNumber,
      email: `business-${Math.random().toString(36).substr(2, 9)}@partpal.co.za`,
      whatsapp: phoneNumber,
      website: `https://${Math.random().toString(36).substr(2, 9)}.co.za`,
      ...overrides
    };
  }
}

// Test seller factory
export class TestSellerFactory {
  static create(overrides: Partial<Seller> = {}): Seller {
    return {
      id: `seller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      businessName: `${['Auto', 'Motor', 'Car', 'Vehicle'][Math.floor(Math.random() * 4)]} ${['Parts', 'Spares', 'Components'][Math.floor(Math.random() * 3)]}`,
      businessType: 'SCRAP_YARD',
      description: 'Test scrap yard with quality used auto parts',
      address: TestAddressFactory.create(),
      contactInfo: TestContactInfoFactory.create(),
      businessHours: mockBusinessHours,
      isVerified: true,
      rating: Math.round((Math.random() * 2 + 3) * 100) / 100, // 3.0 - 5.0
      totalSales: Math.floor(Math.random() * 1000),
      subscriptionPlan: 'PROFESSIONAL',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createScrapYard(overrides: Partial<Seller> = {}): Seller {
    return this.create({
      businessType: 'SCRAP_YARD',
      businessName: `${['City', 'Metro', 'Central', 'Auto'][Math.floor(Math.random() * 4)]} Scrap Yard`,
      ...overrides
    });
  }

  static createDismantler(overrides: Partial<Seller> = {}): Seller {
    return this.create({
      businessType: 'DISMANTLER',
      businessName: `${['Professional', 'Quality', 'Precision'][Math.floor(Math.random() * 3)]} Auto Dismantlers`,
      ...overrides
    });
  }
}

// Test vehicle factory
export class TestVehicleFactory {
  static readonly MAKES = ['Toyota', 'Volkswagen', 'Ford', 'BMW', 'Mercedes-Benz', 'Nissan', 'Hyundai', 'Kia'];
  static readonly MODELS = {
    Toyota: ['Corolla', 'Camry', 'Hilux', 'Fortuner', 'Prius'],
    Volkswagen: ['Polo', 'Golf', 'Jetta', 'Passat', 'Tiguan'],
    Ford: ['Fiesta', 'Focus', 'Ranger', 'EcoSport', 'Everest'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', '1 Series'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLA', 'GLC', 'A-Class'],
    Nissan: ['Micra', 'Almera', 'Qashqai', 'X-Trail', 'NP200'],
    Hyundai: ['i10', 'i20', 'Accent', 'Tucson', 'Creta'],
    Kia: ['Picanto', 'Rio', 'Cerato', 'Sportage', 'Sorento']
  };

  static create(overrides: Partial<Vehicle> = {}): Vehicle {
    const make = this.MAKES[Math.floor(Math.random() * this.MAKES.length)];
    const models = this.MODELS[make as keyof typeof this.MODELS];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = Math.floor(Math.random() * 15) + 2010; // 2010-2024

    return {
      id: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vin: this.generateVIN(),
      year,
      make,
      model,
      variant: Math.random() > 0.5 ? `${model} 1.6L` : undefined,
      engineSize: ['1.0L', '1.2L', '1.4L', '1.6L', '2.0L', '2.4L'][Math.floor(Math.random() * 6)],
      fuelType: ['Petrol', 'Diesel', 'Hybrid'][Math.floor(Math.random() * 3)],
      transmission: ['Manual', 'Automatic'][Math.floor(Math.random() * 2)],
      color: ['White', 'Silver', 'Black', 'Blue', 'Red', 'Grey'][Math.floor(Math.random() * 6)],
      mileage: Math.floor(Math.random() * 200000) + 10000,
      condition: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'][Math.floor(Math.random() * 5)] as any,
      acquisitionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Within last year
      sellerId: `seller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...overrides
    };
  }

  static generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  }

  static createToyotaCorolla(overrides: Partial<Vehicle> = {}): Vehicle {
    return this.create({
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      engineSize: '1.6L',
      fuelType: 'Petrol',
      ...overrides
    });
  }
}

// Test part factory
export class TestPartFactory {
  static readonly PART_NAMES = [
    'Alternator', 'Starter Motor', 'Brake Pads', 'Disc Brakes', 'Headlight',
    'Tail Light', 'Radiator', 'Water Pump', 'Fuel Pump', 'Air Filter',
    'Oil Filter', 'Spark Plugs', 'Battery', 'Shock Absorbers', 'Struts',
    'CV Joint', 'Drive Belt', 'Timing Belt', 'Clutch Kit', 'Gearbox'
  ];

  static create(overrides: Partial<Part> = {}): Part {
    const partName = this.PART_NAMES[Math.floor(Math.random() * this.PART_NAMES.length)];
    const basePrice = Math.floor(Math.random() * 2000) + 50; // R50 - R2050

    return {
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sellerId: `seller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: partName,
      partNumber: Math.random() > 0.3 ? `PN-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined,
      description: `Quality used ${partName.toLowerCase()} in good working condition. Tested and guaranteed.`,
      condition: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'][Math.floor(Math.random() * 4)] as any,
      price: basePrice,
      currency: 'ZAR',
      status: 'AVAILABLE',
      location: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 20) + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10) + 1}`,
      images: [
        `https://example.com/parts/${partName.toLowerCase().replace(' ', '-')}-1.jpg`,
        `https://example.com/parts/${partName.toLowerCase().replace(' ', '-')}-2.jpg`
      ],
      isListedOnMarketplace: Math.random() > 0.2, // 80% listed
      categoryId: `category-${Math.floor(Math.random() * 10) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createAlternator(overrides: Partial<Part> = {}): Part {
    return this.create({
      name: 'Alternator',
      description: 'High-quality alternator, fully tested and in excellent working condition. 12V, 90A output.',
      price: 850,
      partNumber: 'ALT-12V-90A',
      ...overrides
    });
  }

  static createExpensivePart(overrides: Partial<Part> = {}): Part {
    return this.create({
      name: 'Engine Block',
      description: 'Complete engine block, professionally inspected and guaranteed.',
      price: 15000,
      condition: 'GOOD',
      ...overrides
    });
  }
}

// Test category factory
export class TestCategoryFactory {
  static readonly CATEGORIES = [
    { name: 'Engine Components', description: 'Engine related parts and components' },
    { name: 'Electrical System', description: 'Electrical components and accessories' },
    { name: 'Braking System', description: 'Brake pads, discs, and related components' },
    { name: 'Suspension', description: 'Shock absorbers, struts, and suspension parts' },
    { name: 'Body Parts', description: 'Doors, bumpers, mirrors, and body panels' },
    { name: 'Interior', description: 'Seats, dashboard, and interior accessories' },
    { name: 'Transmission', description: 'Gearbox and transmission components' },
    { name: 'Fuel System', description: 'Fuel pumps, injectors, and fuel system parts' }
  ];

  static create(overrides: Partial<Category> = {}): Category {
    const category = this.CATEGORIES[Math.floor(Math.random() * this.CATEGORIES.length)];

    return {
      id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: category.name,
      description: category.description,
      isActive: true,
      ...overrides
    };
  }

  static createWithSubcategories(): Category[] {
    const parent = this.create({
      name: 'Engine Components',
      description: 'All engine related parts and components'
    });

    const subcategories = [
      'Alternators',
      'Starter Motors',
      'Water Pumps',
      'Oil Pumps',
      'Timing Components'
    ].map(name => this.create({
      name,
      parentId: parent.id,
      description: `${name} and related components`
    }));

    return [parent, ...subcategories];
  }
}

// Helper functions for test scenarios
export const testScenarios = {
  // Create a complete seller with vehicle and parts
  createSellerWithInventory: () => {
    const seller = TestSellerFactory.create();
    const vehicles = Array.from({ length: 3 }, () =>
      TestVehicleFactory.create({ sellerId: seller.id })
    );
    const parts = vehicles.flatMap(vehicle =>
      Array.from({ length: Math.floor(Math.random() * 5) + 2 }, () =>
        TestPartFactory.create({
          vehicleId: vehicle.id,
          sellerId: seller.id
        })
      )
    );

    return { seller, vehicles, parts };
  },

  // Create search test data
  createSearchTestData: () => {
    const categories = Array.from({ length: 5 }, () => TestCategoryFactory.create());
    const sellers = Array.from({ length: 3 }, () => TestSellerFactory.create());
    const vehicles = sellers.flatMap(seller =>
      Array.from({ length: 2 }, () =>
        TestVehicleFactory.create({ sellerId: seller.id })
      )
    );
    const parts = vehicles.flatMap(vehicle =>
      Array.from({ length: 4 }, () =>
        TestPartFactory.create({
          vehicleId: vehicle.id,
          sellerId: vehicle.sellerId,
          categoryId: categories[Math.floor(Math.random() * categories.length)].id,
          isListedOnMarketplace: true
        })
      )
    );

    return { categories, sellers, vehicles, parts };
  }
};

// Export all factories for easy import
export {
  TestUserFactory as UserFactory,
  TestSellerFactory as SellerFactory,
  TestVehicleFactory as VehicleFactory,
  TestPartFactory as PartFactory,
  TestCategoryFactory as CategoryFactory,
  TestAddressFactory as AddressFactory,
  TestContactInfoFactory as ContactInfoFactory
};