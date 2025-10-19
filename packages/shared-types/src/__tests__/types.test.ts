import {
  User,
  Vehicle,
  Part,
  Seller,
  Address,
  ContactInfo,
  BusinessHours,
  SearchFilters,
  ApiResponse,
  PaginatedResponse,
  VehicleFormData,
  PartFormData,
  Category
} from '../index';

// Helper function to create valid test data
function createValidUser(): User {
  return {
    id: 'user-123',
    email: 'test@partpal.co.za',
    name: 'Test User',
    role: 'SELLER',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createValidAddress(): Address {
  return {
    street: '123 Test Street',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    country: 'South Africa',
    coordinates: {
      lat: -33.9249,
      lng: 18.4241
    }
  };
}

function createValidContactInfo(): ContactInfo {
  return {
    phone: '0821234567',
    email: 'business@partpal.co.za',
    whatsapp: '0821234567',
    website: 'https://example.co.za'
  };
}

function createValidBusinessHours(): BusinessHours {
  const dayHours = {
    isOpen: true,
    openTime: '08:00',
    closeTime: '17:00'
  };

  return {
    monday: dayHours,
    tuesday: dayHours,
    wednesday: dayHours,
    thursday: dayHours,
    friday: dayHours,
    saturday: { isOpen: true, openTime: '08:00', closeTime: '13:00' },
    sunday: { isOpen: false }
  };
}

describe('Type Validation Tests', () => {
  describe('User Type', () => {
    it('should accept valid user data', () => {
      const user: User = createValidUser();

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@partpal.co.za');
      expect(user.role).toBe('SELLER');
      expect(user.isVerified).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce valid role types', () => {
      const validRoles: User['role'][] = ['ADMIN', 'SELLER', 'BUYER'];

      validRoles.forEach(role => {
        const user: User = { ...createValidUser(), role };
        expect(user.role).toBe(role);
      });
    });

    it('should handle all required properties', () => {
      const user = createValidUser();

      // All these properties should be defined
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.isVerified).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('Vehicle Type', () => {
    it('should accept valid vehicle data', () => {
      const vehicle: Vehicle = {
        id: 'vehicle-123',
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        variant: '1.6L',
        engineSize: '1.6L',
        fuelType: 'Petrol',
        transmission: 'Manual',
        color: 'White',
        mileage: 120000,
        condition: 'GOOD',
        acquisitionDate: new Date(),
        sellerId: 'seller-123'
      };

      expect(vehicle.vin).toMatch(/^[A-HJ-NPR-Z0-9]{17}$/);
      expect(vehicle.year).toBeGreaterThan(1900);
      expect(vehicle.year).toBeLessThan(new Date().getFullYear() + 2);
    });

    it('should enforce valid condition types', () => {
      const validConditions: Vehicle['condition'][] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'];

      validConditions.forEach(condition => {
        const vehicle: Vehicle = {
          id: 'vehicle-123',
          vin: '1HGCM82633A123456',
          year: 2018,
          make: 'Toyota',
          model: 'Corolla',
          condition,
          acquisitionDate: new Date(),
          sellerId: 'seller-123'
        };
        expect(vehicle.condition).toBe(condition);
      });
    });

    it('should handle optional properties correctly', () => {
      const minimalVehicle: Vehicle = {
        id: 'vehicle-123',
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        condition: 'GOOD',
        acquisitionDate: new Date(),
        sellerId: 'seller-123'
      };

      expect(minimalVehicle.variant).toBeUndefined();
      expect(minimalVehicle.engineSize).toBeUndefined();
      expect(minimalVehicle.mileage).toBeUndefined();
    });
  });

  describe('Part Type', () => {
    it('should accept valid part data', () => {
      const part: Part = {
        id: 'part-123',
        vehicleId: 'vehicle-123',
        sellerId: 'seller-123',
        name: 'Alternator',
        partNumber: 'ALT-12V-90A',
        description: 'High-quality alternator in excellent condition',
        condition: 'EXCELLENT',
        price: 850,
        currency: 'ZAR',
        status: 'AVAILABLE',
        location: 'A1-B2',
        images: ['image1.jpg', 'image2.jpg'],
        isListedOnMarketplace: true,
        categoryId: 'category-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(part.price).toBeGreaterThan(0);
      expect(part.currency).toBe('ZAR');
      expect(part.images).toBeInstanceOf(Array);
      expect(part.isListedOnMarketplace).toBe(true);
    });

    it('should enforce valid status types', () => {
      const validStatuses: Part['status'][] = ['AVAILABLE', 'RESERVED', 'SOLD'];

      validStatuses.forEach(status => {
        const part: Part = {
          id: 'part-123',
          vehicleId: 'vehicle-123',
          sellerId: 'seller-123',
          name: 'Test Part',
          description: 'Test description',
          condition: 'GOOD',
          price: 100,
          currency: 'ZAR',
          status,
          location: 'A1',
          images: [],
          isListedOnMarketplace: false,
          categoryId: 'category-123',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        expect(part.status).toBe(status);
      });
    });

    it('should handle South African pricing correctly', () => {
      const part: Part = {
        id: 'part-123',
        vehicleId: 'vehicle-123',
        sellerId: 'seller-123',
        name: 'Test Part',
        description: 'Test description',
        condition: 'GOOD',
        price: 1500.50,
        currency: 'ZAR',
        status: 'AVAILABLE',
        location: 'A1',
        images: [],
        isListedOnMarketplace: false,
        categoryId: 'category-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(part.currency).toBe('ZAR');
      expect(part.price).toBe(1500.50);
      // Price should be formatted as ZAR currency
      expect(`R ${part.price.toFixed(2)}`).toBeValidZARCurrency();
    });
  });

  describe('Seller Type', () => {
    it('should accept valid seller data', () => {
      const seller: Seller = {
        id: 'seller-123',
        userId: 'user-123',
        businessName: 'Test Auto Parts',
        businessType: 'SCRAP_YARD',
        description: 'Quality used auto parts',
        address: createValidAddress(),
        contactInfo: createValidContactInfo(),
        businessHours: createValidBusinessHours(),
        isVerified: true,
        rating: 4.5,
        totalSales: 150,
        subscriptionPlan: 'PROFESSIONAL',
        createdAt: new Date()
      };

      expect(seller.businessType).toBe('SCRAP_YARD');
      expect(seller.rating).toBeGreaterThanOrEqual(0);
      expect(seller.rating).toBeLessThanOrEqual(5);
      expect(seller.address.province).toBe('Western Cape');
    });

    it('should enforce valid business types', () => {
      const validBusinessTypes: Seller['businessType'][] = ['SCRAP_YARD', 'DISMANTLER', 'PRIVATE'];

      validBusinessTypes.forEach(businessType => {
        const seller: Seller = {
          id: 'seller-123',
          userId: 'user-123',
          businessName: 'Test Business',
          businessType,
          address: createValidAddress(),
          contactInfo: createValidContactInfo(),
          businessHours: createValidBusinessHours(),
          isVerified: false,
          totalSales: 0,
          subscriptionPlan: 'STARTER',
          createdAt: new Date()
        };
        expect(seller.businessType).toBe(businessType);
      });
    });

    it('should enforce valid subscription plans', () => {
      const validPlans: Seller['subscriptionPlan'][] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

      validPlans.forEach(plan => {
        const seller: Seller = {
          id: 'seller-123',
          userId: 'user-123',
          businessName: 'Test Business',
          businessType: 'SCRAP_YARD',
          address: createValidAddress(),
          contactInfo: createValidContactInfo(),
          businessHours: createValidBusinessHours(),
          isVerified: false,
          totalSales: 0,
          subscriptionPlan: plan,
          createdAt: new Date()
        };
        expect(seller.subscriptionPlan).toBe(plan);
      });
    });
  });

  describe('Address Type', () => {
    it('should handle South African addresses correctly', () => {
      const address: Address = createValidAddress();

      expect(address.country).toBe('South Africa');
      expect(address.province).toBe('Western Cape');
      expect(address.city).toBe('Cape Town');
      expect(address.postalCode).toMatch(/^\d{4}$/);
    });

    it('should handle coordinates correctly', () => {
      const address: Address = createValidAddress();

      expect(address.coordinates).toBeDefined();
      expect(address.coordinates!.lat).toBeCloseTo(-33.9249, 2);
      expect(address.coordinates!.lng).toBeCloseTo(18.4241, 2);
    });

    it('should handle addresses without coordinates', () => {
      const address: Address = {
        street: '456 Test Road',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa'
      };

      expect(address.coordinates).toBeUndefined();
    });
  });

  describe('ContactInfo Type', () => {
    it('should accept valid South African contact info', () => {
      const contactInfo: ContactInfo = createValidContactInfo();

      expect(contactInfo.phone).toBeValidSAPhoneNumber();
      expect(contactInfo.email).toContain('@');
      expect(contactInfo.whatsapp).toBeValidSAPhoneNumber();
      expect(contactInfo.website).toMatch(/^https?:\/\//);
    });

    it('should handle optional fields correctly', () => {
      const minimalContactInfo: ContactInfo = {
        phone: '0821234567',
        email: 'contact@business.co.za'
      };

      expect(minimalContactInfo.whatsapp).toBeUndefined();
      expect(minimalContactInfo.website).toBeUndefined();
    });
  });

  describe('BusinessHours Type', () => {
    it('should accept valid business hours', () => {
      const businessHours: BusinessHours = createValidBusinessHours();

      expect(businessHours.monday.isOpen).toBe(true);
      expect(businessHours.monday.openTime).toBe('08:00');
      expect(businessHours.monday.closeTime).toBe('17:00');
      expect(businessHours.sunday.isOpen).toBe(false);
    });

    it('should handle closed days correctly', () => {
      const businessHours: BusinessHours = createValidBusinessHours();

      expect(businessHours.sunday.isOpen).toBe(false);
      expect(businessHours.sunday.openTime).toBeUndefined();
      expect(businessHours.sunday.closeTime).toBeUndefined();
    });

    it('should validate time format', () => {
      const businessHours: BusinessHours = createValidBusinessHours();

      Object.values(businessHours).forEach(dayHours => {
        if (dayHours.isOpen) {
          expect(dayHours.openTime).toMatch(/^\d{2}:\d{2}$/);
          expect(dayHours.closeTime).toMatch(/^\d{2}:\d{2}$/);
        }
      });
    });
  });

  describe('SearchFilters Type', () => {
    it('should accept comprehensive search filters', () => {
      const filters: SearchFilters = {
        query: 'alternator',
        vehicleYear: 2018,
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla',
        partName: 'alternator',
        partNumber: 'ALT-12V-90A',
        location: {
          province: 'Western Cape',
          city: 'Cape Town',
          radius: 50
        },
        priceRange: {
          min: 100,
          max: 2000
        },
        condition: ['EXCELLENT', 'GOOD'],
        sellerType: ['SCRAP_YARD', 'DISMANTLER']
      };

      expect(filters.location!.radius).toBe(50);
      expect(filters.priceRange!.min).toBeLessThan(filters.priceRange!.max);
      expect(filters.condition).toContain('EXCELLENT');
      expect(filters.sellerType).toContain('SCRAP_YARD');
    });

    it('should handle optional filter properties', () => {
      const minimalFilters: SearchFilters = {
        query: 'brake pads'
      };

      expect(minimalFilters.vehicleYear).toBeUndefined();
      expect(minimalFilters.location).toBeUndefined();
      expect(minimalFilters.priceRange).toBeUndefined();
    });
  });

  describe('ApiResponse Type', () => {
    it('should handle successful responses', () => {
      const response: ApiResponse<Part[]> = {
        success: true,
        data: [
          {
            id: 'part-123',
            vehicleId: 'vehicle-123',
            sellerId: 'seller-123',
            name: 'Test Part',
            description: 'Test description',
            condition: 'GOOD',
            price: 100,
            currency: 'ZAR',
            status: 'AVAILABLE',
            location: 'A1',
            images: [],
            isListedOnMarketplace: true,
            categoryId: 'category-123',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        message: 'Parts retrieved successfully'
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.error).toBeUndefined();
    });

    it('should handle error responses', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Parts not found',
        message: 'No parts match your search criteria'
      };

      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.error).toBe('Parts not found');
    });
  });

  describe('PaginatedResponse Type', () => {
    it('should handle paginated data correctly', () => {
      const response: PaginatedResponse<Part> = {
        items: [],
        totalCount: 50,
        page: 1,
        pageSize: 20,
        totalPages: 3
      };

      expect(response.totalPages).toBe(Math.ceil(response.totalCount / response.pageSize));
      expect(response.page).toBeGreaterThan(0);
      expect(response.page).toBeLessThanOrEqual(response.totalPages);
    });
  });

  describe('Form Data Types', () => {
    it('should validate VehicleFormData', () => {
      const formData: VehicleFormData = {
        vin: '1HGCM82633A123456',
        year: 2018,
        make: 'Toyota',
        model: 'Corolla',
        variant: '1.6L Manual',
        engineSize: '1.6L',
        fuelType: 'Petrol',
        transmission: 'Manual',
        color: 'White',
        mileage: 120000,
        condition: 'GOOD'
      };

      expect(formData.vin).toBeValidVIN();
      expect(formData.year).toBeGreaterThan(1900);
      expect(formData.condition).toBe('GOOD');
    });

    it('should validate PartFormData', () => {
      const formData: PartFormData = {
        name: 'Alternator',
        partNumber: 'ALT-12V-90A',
        description: 'High-quality alternator',
        condition: 'EXCELLENT',
        price: 850,
        location: 'A1-B2',
        categoryId: 'category-123',
        images: [] // File[] in real usage
      };

      expect(formData.price).toBeGreaterThan(0);
      expect(formData.images).toBeInstanceOf(Array);
      expect(formData.condition).toBe('EXCELLENT');
    });
  });

  describe('Category Type', () => {
    it('should handle category hierarchies', () => {
      const parentCategory: Category = {
        id: 'category-parent',
        name: 'Engine Components',
        description: 'All engine related parts',
        isActive: true
      };

      const childCategory: Category = {
        id: 'category-child',
        name: 'Alternators',
        parentId: 'category-parent',
        description: 'Alternators and related components',
        isActive: true
      };

      expect(parentCategory.parentId).toBeUndefined();
      expect(childCategory.parentId).toBe('category-parent');
      expect(childCategory.isActive).toBe(true);
    });
  });

  describe('South African Specific Validations', () => {
    it('should validate South African provinces', () => {
      const validProvinces = [
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

      const address: Address = createValidAddress();
      expect(validProvinces).toContain(address.province);
    });

    it('should handle ZAR currency consistently', () => {
      const part: Part = {
        id: 'part-123',
        vehicleId: 'vehicle-123',
        sellerId: 'seller-123',
        name: 'Test Part',
        description: 'Test description',
        condition: 'GOOD',
        price: 1500,
        currency: 'ZAR',
        status: 'AVAILABLE',
        location: 'A1',
        images: [],
        isListedOnMarketplace: true,
        categoryId: 'category-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(part.currency).toBe('ZAR');

      // Format price for display
      const formattedPrice = `R ${part.price.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

      expect(formattedPrice).toBeValidZARCurrency();
    });
  });
});