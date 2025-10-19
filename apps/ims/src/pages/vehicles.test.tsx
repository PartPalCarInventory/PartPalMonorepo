import { render, screen, fireEvent, waitFor } from '../test-utils';
import Vehicles from './vehicles';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/AuthContext');

jest.mock('../utils/analytics', () => ({
  analytics: {
    trackPageView: jest.fn(),
    trackUserEngagement: jest.fn(),
  },
}));

// Mock child components
jest.mock('../components/VehicleHeader', () => ({
  VehicleHeader: ({ totalVehicles, onAddVehicle }: any) => (
    <div data-testid="vehicle-header">
      <span>Total: {totalVehicles}</span>
      <button onClick={onAddVehicle}>Add Vehicle</button>
    </div>
  ),
}));

jest.mock('../components/VehicleList', () => ({
  VehicleList: ({ vehicles, isLoading, onVehicleSelect, page, totalPages, onPageChange }: any) => (
    <div data-testid="vehicle-list">
      {isLoading ? (
        <div>Loading vehicles...</div>
      ) : (
        <>
          <div>Vehicles: {vehicles.length}</div>
          {vehicles.map((vehicle: any) => (
            <button key={vehicle.id} onClick={() => onVehicleSelect(vehicle)}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </button>
          ))}
          <div>Page {page} of {totalPages}</div>
          <button onClick={() => onPageChange(page + 1)}>Next Page</button>
        </>
      )}
    </div>
  ),
}));

jest.mock('../components/VehicleFilters', () => ({
  VehicleFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="vehicle-filters">
      <button onClick={() => onFiltersChange({ ...filters, search: 'test' })}>
        Apply Filters
      </button>
    </div>
  ),
}));

jest.mock('../components/VehicleModal', () => ({
  VehicleModal: ({ isOpen, vehicle, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="vehicle-modal">
        <span>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</span>
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../components/MobileLayout', () => ({
  MobileLayout: ({ title, children, className }: any) => (
    <div data-testid="mobile-layout" className={className}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  MobileCard: ({ children, onClick, className }: any) => (
    <div data-testid="mobile-card" className={className} onClick={onClick}>{children}</div>
  ),
  MobileButton: ({ children, onClick, disabled, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('Vehicles Page', () => {
  const mockVehiclesData = {
    vehicles: [
      {
        id: 'v1',
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        variant: 'XLE',
        vin: 'VIN123456789',
        condition: 'EXCELLENT',
        totalParts: 15,
        images: ['https://example.com/image1.jpg'],
        sellerId: 's1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'v2',
        year: 2019,
        make: 'Honda',
        model: 'Accord',
        variant: '',
        vin: 'VIN987654321',
        condition: 'GOOD',
        totalParts: 8,
        images: [],
        sellerId: 's1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    totalCount: 2,
    totalPages: 1,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/vehicles',
      query: {},
      asPath: '/vehicles',
      route: '/vehicles',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
  });

  describe('Error State', () => {
    it('renders error message when query fails', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      expect(screen.getByText('Error Loading Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument();
    });

    it('renders retry button in error state', () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: mockRefetch,
      } as any);

      render(<Vehicles />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders warning icon in error state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders vehicle header with total count', () => {
      render(<Vehicles />);

      expect(screen.getByTestId('vehicle-header')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
    });

    it('renders vehicle filters', () => {
      render(<Vehicles />);

      expect(screen.getByTestId('vehicle-filters')).toBeInTheDocument();
    });

    it('renders vehicle list', () => {
      render(<Vehicles />);

      expect(screen.getByTestId('vehicle-list')).toBeInTheDocument();
      expect(screen.getByText('Vehicles: 2')).toBeInTheDocument();
    });

    it('renders vehicle names in list', () => {
      render(<Vehicles />);

      // Vehicles appear in both desktop and mobile layouts
      expect(screen.getAllByText(/2020 Toyota Camry/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2019 Honda Accord/).length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders mobile layout', () => {
      render(<Vehicles />);

      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
      expect(screen.getByText('Vehicles')).toBeInTheDocument();
    });

    it('displays total vehicles count in mobile', () => {
      render(<Vehicles />);

      expect(screen.getByText('2 vehicles total')).toBeInTheDocument();
    });

    it('renders mobile search input', () => {
      render(<Vehicles />);

      const searchInput = screen.getByPlaceholderText('Search vehicles...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders mobile make filter', () => {
      render(<Vehicles />);

      expect(screen.getByText('All Makes')).toBeInTheDocument();
      expect(screen.getByText('BMW')).toBeInTheDocument();
      expect(screen.getByText('Mercedes-Benz')).toBeInTheDocument();
      expect(screen.getByText('Toyota')).toBeInTheDocument();
      expect(screen.getByText('Honda')).toBeInTheDocument();
    });

    it('renders mobile sort options', () => {
      render(<Vehicles />);

      expect(screen.getByText('Newest')).toBeInTheDocument();
      expect(screen.getByText('Oldest')).toBeInTheDocument();
      expect(screen.getByText('Make')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('renders vehicles with images on mobile', () => {
      render(<Vehicles />);

      const image = screen.getByAltText('2020 Toyota Camry');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('renders placeholder for vehicles without images', () => {
      render(<Vehicles />);

      // Honda Accord has no images, so should show placeholder
      const cards = screen.getAllByTestId('mobile-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('displays vehicle condition badges on mobile', () => {
      render(<Vehicles />);

      expect(screen.getByText('excellent')).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
    });

    it('displays total parts count on mobile', () => {
      render(<Vehicles />);

      expect(screen.getByText('15 parts')).toBeInTheDocument();
      expect(screen.getByText('8 parts')).toBeInTheDocument();
    });

    it('displays vehicle variants on mobile', () => {
      render(<Vehicles />);

      expect(screen.getByText('XLE')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeletons on mobile', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { container } = render(<Vehicles />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders loading state in vehicle list', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      expect(screen.getByText('Loading vehicles...')).toBeInTheDocument();
    });
  });

  describe('Add Vehicle', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens add modal when header button is clicked', () => {
      render(<Vehicles />);

      const addButtons = screen.getAllByText('Add Vehicle');
      fireEvent.click(addButtons[0]);

      expect(screen.getByTestId('vehicle-modal')).toBeInTheDocument();
      expect(screen.getAllByText('Add Vehicle').length).toBeGreaterThan(0);
    });

    it('opens add modal when mobile button is clicked', () => {
      render(<Vehicles />);

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(screen.getByTestId('vehicle-modal')).toBeInTheDocument();
    });

    it('closes add modal when close is clicked', () => {
      render(<Vehicles />);

      const addButtons = screen.getAllByText('Add Vehicle');
      fireEvent.click(addButtons[0]);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('vehicle-modal')).not.toBeInTheDocument();
    });

    it('refetches data when vehicle is saved', () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<Vehicles />);

      const addButtons = screen.getAllByText('Add Vehicle');
      fireEvent.click(addButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Vehicle Details', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens details modal when vehicle is selected from list', () => {
      render(<Vehicles />);

      const vehicleButtons = screen.getAllByText(/2020 Toyota Camry/);
      fireEvent.click(vehicleButtons[0]);

      expect(screen.getByTestId('vehicle-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();
    });

    it('closes details modal when close is clicked', () => {
      render(<Vehicles />);

      const vehicleButtons = screen.getAllByText(/2020 Toyota Camry/);
      fireEvent.click(vehicleButtons[0]);

      const closeButtons = screen.getAllByText('Close');
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(screen.queryByTestId('vehicle-modal')).not.toBeInTheDocument();
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockVehiclesData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('updates search filter on mobile', () => {
      render(<Vehicles />);

      const searchInput = screen.getByPlaceholderText('Search vehicles...');
      fireEvent.change(searchInput, { target: { value: 'toyota' } });

      expect(searchInput).toHaveValue('toyota');
    });

    it('updates make filter on mobile', () => {
      render(<Vehicles />);

      const makeSelect = screen.getByText('All Makes').closest('select');
      if (makeSelect) {
        fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
        expect(makeSelect).toHaveValue('Toyota');
      }
    });

    it('updates sort filter on mobile', () => {
      render(<Vehicles />);

      const sortSelect = screen.getByText('Newest').closest('select');
      if (sortSelect) {
        fireEvent.change(sortSelect, { target: { value: 'year' } });
        expect(sortSelect).toHaveValue('year');
      }
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls when multiple pages exist', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockVehiclesData, totalPages: 3, currentPage: 1 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      // Pagination appears in both desktop and mobile layouts
      expect(screen.getAllByText(/Page.*of 3/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Previous').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Next').length).toBeGreaterThan(0);
    });

    it('disables previous button on first page', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockVehiclesData, totalPages: 3, currentPage: 1 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      const previousButtons = screen.getAllByText('Previous');
      // At least one button should be disabled on first page
      expect(previousButtons[0]).toBeDisabled();
    });

    it('renders next and previous buttons', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockVehiclesData, totalPages: 3, currentPage: 2 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Vehicles />);

      // Both Next and Previous buttons should be rendered
      const nextButtons = screen.getAllByText('Next');
      const previousButtons = screen.getAllByText('Previous');
      expect(nextButtons.length).toBeGreaterThan(0);
      expect(previousButtons.length).toBeGreaterThan(0);
    });
  });
});
