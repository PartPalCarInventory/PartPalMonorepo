// Core Entity Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  variant?: string;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  mileage?: number;
  condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  acquisitionDate: Date;
  sellerId: string;
  images?: string[];
  description?: string;
  location?: string;
  totalParts?: number;
  availableParts?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  vehicleId: string;
  sellerId: string;
  name: string;
  partNumber?: string;
  description: string;
  condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  price: number;
  currency: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  location: string; // Physical location in yard
  images: string[];
  isListedOnMarketplace: boolean;
  categoryId: string;
  category?: Category;
  vehicle?: Vehicle;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  compatibility?: string[];
  warranty?: number;
  installationNotes?: string;
  reservedUntil?: Date;
  soldDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Seller {
  id: string;
  userId: string;
  businessName: string;
  businessType: 'SCRAP_YARD' | 'DISMANTLER' | 'PRIVATE';
  description?: string;
  address: Address;
  contactInfo: ContactInfo;
  businessHours: BusinessHours;
  isVerified: boolean;
  rating?: number;
  totalSales: number;
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  phone: string;
  email: string;
  whatsapp?: string;
  website?: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  partName?: string;
  partNumber?: string;
  location?: {
    province?: string;
    city?: string;
    radius?: number; // km
  };
  priceRange?: {
    min: number;
    max: number;
  };
  condition?: Part['condition'][];
  sellerType?: Seller['businessType'][];
}

export interface SearchResult {
  parts: Part[];
  totalCount: number;
  facets: {
    makes: { value: string; count: number }[];
    models: { value: string; count: number }[];
    conditions: { value: string; count: number }[];
    priceRanges: { range: string; count: number }[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// IMS Specific Types
export interface DashboardStats {
  totalVehicles: number;
  totalParts: number;
  recentSales: number;
  monthlyRevenue: number;
  topSellingParts: { part: Part; salesCount: number }[];
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'vehicle_added' | 'part_listed' | 'part_sold' | 'marketplace_listing';
  description: string;
  timestamp: Date;
  userId: string;
}

// Form Types
export interface VehicleFormData {
  vin: string;
  year: number;
  make: string;
  model: string;
  variant?: string;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
  mileage?: number;
  condition: Vehicle['condition'];
  acquisitionDate: Date;
  description?: string;
  location?: string;
}

export interface PartFormData {
  name: string;
  partNumber?: string;
  description: string;
  condition: Part['condition'];
  price: number;
  location: string;
  categoryId: string;
  images: File[];
}

// Subscription Plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  maxParts: number | null; // null for unlimited
  features: string[];
  isPopular: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
}