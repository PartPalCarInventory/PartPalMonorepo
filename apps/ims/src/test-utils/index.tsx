import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that wraps components with required providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@partpal.co.za',
  name: 'Test User',
  role: 'SELLER' as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockPart = (overrides = {}) => ({
  id: 'part-1',
  vehicleId: 'vehicle-1',
  sellerId: 'seller-1',
  name: 'Test Part',
  description: 'Test part description',
  condition: 'GOOD' as const,
  price: 100,
  currency: 'ZAR' as const,
  status: 'AVAILABLE' as const,
  location: 'A1-B2',
  images: [],
  isListedOnMarketplace: true,
  categoryId: 'category-1',
  partNumber: 'TEST-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockVehicle = (overrides = {}) => ({
  id: 'vehicle-1',
  vin: '1HGCM82633A123456',
  year: 2015,
  make: 'Toyota',
  model: 'Corolla',
  variant: 'XLE',
  condition: 'GOOD' as const,
  acquisitionDate: new Date().toISOString(),
  sellerId: 'seller-1',
  status: 'IN_STOCK' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockSeller = (overrides = {}) => ({
  id: 'seller-1',
  businessName: 'Test Auto Parts',
  contactPerson: 'John Doe',
  email: 'contact@testautoparts.co.za',
  phone: '+27821234567',
  address: '123 Test Street',
  city: 'Cape Town',
  province: 'Western Cape',
  postalCode: '8001',
  isVerified: true,
  subscriptionTier: 'PREMIUM' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
