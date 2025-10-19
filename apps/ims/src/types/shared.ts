// Temporary shared types for testing
export interface DashboardStats {
  totalVehicles: number;
  totalParts: number;
  recentSales: number;
  monthlyRevenue: number;
  topSellingParts: { part: Part; salesCount: number }[];
  recentActivity: Activity[];
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
  location: string;
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

export interface Activity {
  id: string;
  type: 'vehicle_added' | 'part_listed' | 'part_sold' | 'marketplace_listing';
  description: string;
  timestamp: Date;
  userId: string;
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

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
  subcategories?: Category[];
}

export interface PartFormData {
  vehicleId: string;
  name: string;
  partNumber?: string;
  description: string;
  condition: Part['condition'];
  price: number;
  location: string;
  categoryId: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  compatibility?: string[];
  warranty?: number;
  installationNotes?: string;
  images?: File[];
}