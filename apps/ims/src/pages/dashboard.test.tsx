import { render, screen, fireEvent, waitFor } from '../test-utils';
import Dashboard from './dashboard';
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

// Mock all child components to simplify testing
jest.mock('../components/DashboardHeader', () => ({
  DashboardHeader: ({ selectedPeriod, onPeriodChange }: any) => (
    <div data-testid="dashboard-header">
      <button onClick={() => onPeriodChange('7d')}>7 days</button>
      <button onClick={() => onPeriodChange('30d')}>30 days</button>
      <span>Period: {selectedPeriod}</span>
    </div>
  ),
}));

jest.mock('../components/StatsOverview', () => ({
  StatsOverview: ({ stats }: any) => (
    <div data-testid="stats-overview">Stats: {stats?.totalParts || 0}</div>
  ),
}));

jest.mock('../components/RevenueChart', () => ({
  RevenueChart: ({ period }: any) => (
    <div data-testid="revenue-chart">Revenue Chart: {period}</div>
  ),
}));

jest.mock('../components/TopSellingParts', () => ({
  TopSellingParts: ({ parts }: any) => (
    <div data-testid="top-selling-parts">Parts: {parts?.length || 0}</div>
  ),
}));

jest.mock('../components/RecentActivity', () => ({
  RecentActivity: ({ activities }: any) => (
    <div data-testid="recent-activity">Activities: {activities?.length || 0}</div>
  ),
}));

jest.mock('../components/PartsInventoryChart', () => ({
  PartsInventoryChart: ({ period }: any) => (
    <div data-testid="parts-inventory-chart">Inventory: {period}</div>
  ),
}));

jest.mock('../components/MobileLayout', () => ({
  MobileLayout: ({ title, children }: any) => (
    <div data-testid="mobile-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
  MobileCard: ({ children }: any) => (
    <div data-testid="mobile-card">{children}</div>
  ),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('Dashboard', () => {
  const mockDashboardStats = {
    totalVehicles: 50,
    totalParts: 250,
    recentSales: 15,
    monthlyRevenue: 125000,
    topSellingParts: [
      {
        part: {
          id: '1',
          name: 'Engine Block',
          price: 5000,
          partNumber: 'ENG-001',
          categoryId: 'engine',
          vehicleId: 'v1',
          sellerId: 's1',
          description: 'Test',
          condition: 'EXCELLENT' as const,
          location: 'A1',
          status: 'AVAILABLE' as const,
          isListedOnMarketplace: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        salesCount: 25,
      },
      {
        part: {
          id: '2',
          name: 'Brake Pads',
          price: 500,
          partNumber: 'BRK-001',
          categoryId: 'brakes',
          vehicleId: 'v1',
          sellerId: 's1',
          description: 'Test',
          condition: 'GOOD' as const,
          location: 'A2',
          status: 'AVAILABLE' as const,
          isListedOnMarketplace: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        salesCount: 15,
      },
    ],
    recentActivity: [
      {
        id: '1',
        type: 'vehicle_added',
        description: 'Added 2020 Toyota Camry',
        timestamp: new Date('2025-10-13'),
        userId: 'user-1',
      },
      {
        id: '2',
        type: 'part_sold',
        description: 'Sold Engine Block',
        timestamp: new Date('2025-10-12'),
        userId: 'user-1',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      route: '/dashboard',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
  });

  describe('Loading State', () => {
    it('renders loading spinner when data is loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<Dashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('renders loading spinner animation', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<Dashboard />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error message when query fails', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      render(<Dashboard />);

      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument();
    });

    it('renders warning icon in error state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      render(<Dashboard />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders dashboard header', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    });

    it('renders quick navigation links', () => {
      render(<Dashboard />);

      expect(screen.getByText('Vehicle Management')).toBeInTheDocument();
      expect(screen.getByText('Parts Management')).toBeInTheDocument();
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
    });

    it('renders vehicle management link with correct href', () => {
      render(<Dashboard />);

      const link = screen.getByText('Vehicle Management').closest('a');
      expect(link).toHaveAttribute('href', '/vehicles');
    });

    it('renders parts management link with correct href', () => {
      render(<Dashboard />);

      const link = screen.getByText('Parts Management').closest('a');
      expect(link).toHaveAttribute('href', '/parts');
    });

    it('shows marketplace as coming soon', () => {
      render(<Dashboard />);

      expect(screen.getByText('Coming soon')).toBeInTheDocument();
    });

    it('renders stats overview component', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('stats-overview')).toBeInTheDocument();
      expect(screen.getByText('Stats: 250')).toBeInTheDocument();
    });

    it('renders revenue chart with selected period', () => {
      render(<Dashboard />);

      expect(screen.getAllByTestId('revenue-chart')[0]).toBeInTheDocument();
      // Component renders in both desktop and mobile layouts
      expect(screen.getAllByText('Revenue Chart: 30d').length).toBeGreaterThan(0);
    });

    it('renders parts inventory chart', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('parts-inventory-chart')).toBeInTheDocument();
      expect(screen.getByText('Inventory: 30d')).toBeInTheDocument();
    });

    it('renders top selling parts component', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('top-selling-parts')).toBeInTheDocument();
      expect(screen.getByText('Parts: 2')).toBeInTheDocument();
    });

    it('renders recent activity component', () => {
      render(<Dashboard />);

      expect(screen.getAllByTestId('recent-activity')[0]).toBeInTheDocument();
      expect(screen.getByText('Activities: 2')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders mobile layout', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
    });

    it('renders mobile period selector', () => {
      render(<Dashboard />);

      expect(screen.getByText('Time Period')).toBeInTheDocument();
      // Period buttons appear in both header and mobile selector
      expect(screen.getAllByText('7 days').length).toBeGreaterThan(0);
      expect(screen.getAllByText('30 days').length).toBeGreaterThan(0);
      expect(screen.getByText('3 months')).toBeInTheDocument();
      expect(screen.getByText('1 year')).toBeInTheDocument();
    });

    it('renders quick actions on mobile', () => {
      render(<Dashboard />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Manage Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Manage Parts')).toBeInTheDocument();
    });

    it('displays vehicle count in quick actions', () => {
      render(<Dashboard />);

      expect(screen.getByText('50 vehicles')).toBeInTheDocument();
    });

    it('displays parts count in quick actions', () => {
      render(<Dashboard />);

      expect(screen.getByText('250 parts')).toBeInTheDocument();
    });

    it('renders key metrics on mobile', () => {
      render(<Dashboard />);

      expect(screen.getByText('Key Metrics')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // Recent sales
      expect(screen.getByText('R125,000')).toBeInTheDocument(); // Monthly revenue
    });

    it('renders top 3 selling parts on mobile', () => {
      render(<Dashboard />);

      expect(screen.getByText('Engine Block')).toBeInTheDocument();
      expect(screen.getByText('Brake Pads')).toBeInTheDocument();
      expect(screen.getByText('25 sold')).toBeInTheDocument();
      expect(screen.getByText('15 sold')).toBeInTheDocument();
    });

    it('renders recent activity on mobile', () => {
      render(<Dashboard />);

      expect(screen.getByText('Added 2020 Toyota Camry')).toBeInTheDocument();
      expect(screen.getByText('Sold Engine Block')).toBeInTheDocument();
    });
  });

  describe('Period Selection', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      } as any);
    });

    it('defaults to 30 day period', () => {
      render(<Dashboard />);

      expect(screen.getByText('Period: 30d')).toBeInTheDocument();
    });

    it('changes period when mobile period button is clicked', async () => {
      render(<Dashboard />);

      const sevenDayButtons = screen.getAllByText('7 days');
      fireEvent.click(sevenDayButtons[0]);

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['dashboard-stats', '7d'],
          })
        );
      });
    });

    it('updates charts when period changes', () => {
      const { rerender } = render(<Dashboard />);

      // Change period
      const thirtyDayButtons = screen.getAllByText('30 days');
      fireEvent.click(thirtyDayButtons[0]);

      rerender(<Dashboard />);

      // Charts appear in both desktop and mobile layouts
      expect(screen.getAllByText('Revenue Chart: 30d').length).toBeGreaterThan(0);
      expect(screen.getByText('Inventory: 30d')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches dashboard stats with correct query key', () => {
      mockUseQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      } as any);

      render(<Dashboard />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['dashboard-stats', '30d'],
        })
      );
    });

    it('handles empty stats gracefully', () => {
      mockUseQuery.mockReturnValue({
        data: {
          totalVehicles: 0,
          totalParts: 0,
          recentSales: 0,
          monthlyRevenue: 0,
          topSellingParts: [],
          recentActivity: [],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<Dashboard />);

      expect(screen.getByText('0 vehicles')).toBeInTheDocument();
      expect(screen.getByText('0 parts')).toBeInTheDocument();
      expect(screen.getByText('R0')).toBeInTheDocument();
    });

    it('handles undefined stats data', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      render(<Dashboard />);

      // When data is undefined but no error, component renders with empty/zero values
      expect(screen.getByText('0 vehicles')).toBeInTheDocument();
      expect(screen.getByText('0 parts')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockDashboardStats,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders vehicle management link with description', () => {
      render(<Dashboard />);

      expect(screen.getByText('Manage your vehicle inventory')).toBeInTheDocument();
    });

    it('renders parts management link with description', () => {
      render(<Dashboard />);

      expect(screen.getByText('Manage your parts inventory')).toBeInTheDocument();
    });

    it('renders multiple links to vehicles page', () => {
      render(<Dashboard />);

      const vehicleLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/vehicles'
      );
      expect(vehicleLinks.length).toBeGreaterThan(0);
    });

    it('renders multiple links to parts page', () => {
      render(<Dashboard />);

      const partsLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/parts'
      );
      expect(partsLinks.length).toBeGreaterThan(0);
    });
  });
});
