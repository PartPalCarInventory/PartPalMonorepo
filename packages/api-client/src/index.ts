import type {
  User,
  Seller,
  Vehicle,
  Part,
  Category,
  ApiResponse,
  PaginatedResponse
} from '@partpal/shared-types';

/**
 * PartPal API Client
 * TypeScript client for the PartPal API
 */
export class PartPalApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:3333', apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data as T;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Parts API
  async getParts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<PaginatedResponse<Part>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/parts${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Part>>(endpoint);
  }

  async getPartById(id: string): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>(`/api/parts/${id}`);
  }

  async searchParts(query: string, filters?: {
    category?: string;
    condition?: string;
    location?: string;
  }): Promise<PaginatedResponse<Part>> {
    const searchParams = new URLSearchParams({ search: query });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
    }

    return this.request<PaginatedResponse<Part>>(`/api/parts/search?${searchParams}`);
  }

  // Vehicles API
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    make?: string;
    model?: string;
    year?: number;
  }): Promise<PaginatedResponse<Vehicle>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/vehicles${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Vehicle>>(endpoint);
  }

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    return this.request<ApiResponse<Vehicle>>(`/api/vehicles/${id}`);
  }

  async getVehicleParts(vehicleId: string): Promise<PaginatedResponse<Part>> {
    return this.request<PaginatedResponse<Part>>(`/api/vehicles/${vehicleId}/parts`);
  }

  // Sellers API
  async getSellers(params?: {
    page?: number;
    limit?: number;
    businessType?: string;
    city?: string;
    province?: string;
  }): Promise<PaginatedResponse<Seller>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/sellers${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<PaginatedResponse<Seller>>(endpoint);
  }

  async getSellerById(id: string): Promise<ApiResponse<Seller>> {
    return this.request<ApiResponse<Seller>>(`/api/sellers/${id}`);
  }

  async getSellerParts(sellerId: string): Promise<PaginatedResponse<Part>> {
    return this.request<PaginatedResponse<Part>>(`/api/sellers/${sellerId}/parts`);
  }

  // Categories API
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/api/categories');
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/api/categories/${id}`);
  }

  // Authentication API
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request<ApiResponse<{ user: User; token: string }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request<ApiResponse<{ user: User; token: string }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Utility methods
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
}

// Export default instance
export const apiClient = new PartPalApiClient();

// Export types for consumers
export type {
  User,
  Seller,
  Vehicle,
  Part,
  Category,
  ApiResponse,
  PaginatedResponse,
} from '@partpal/shared-types';