export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'buyer';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  sellerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage?: number;
  engineSize?: string;
  fuelType?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  vehicleId: string;
  sellerId: string;
  name: string;
  partNumber: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  price: number;
  description?: string;
  category?: string;
  isListedOnMarketplace: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}