import { render, screen, waitFor } from '../test-utils';
import { RevenueChart } from './RevenueChart';
import { useQuery } from '@tanstack/react-query';

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('RevenueChart', () => {
  const mockRevenueData = [
    { date: '2025-10-01', revenue: 15000, sales: 10 },
    { date: '2025-10-02', revenue: 22000, sales: 15 },
    { date: '2025-10-03', revenue: 18000, sales: 12 },
    { date: '2025-10-04', revenue: 25000, sales: 18 },
    { date: '2025-10-05', revenue: 30000, sales: 20 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when data is loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<RevenueChart period="7d" />);

      const container = screen.getByText((content, element) => {
        return element?.classList.contains('animate-pulse') || false;
      }).parentElement;

      expect(container).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data available', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="7d" />);

      expect(screen.getByText('No revenue data available')).toBeInTheDocument();
    });

    it('renders empty state when data is undefined', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="7d" />);

      expect(screen.getByText('No revenue data available')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders chart components when data is available', () => {
      render(<RevenueChart period="7d" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders legend with correct labels', () => {
      render(<RevenueChart period="7d" />);

      expect(screen.getByText('Revenue (ZAR)')).toBeInTheDocument();
      expect(screen.getByText('Sales (Parts)')).toBeInTheDocument();
    });

    it('renders chart axes', () => {
      render(<RevenueChart period="7d" />);

      const xAxes = screen.getAllByTestId('x-axis');
      const yAxes = screen.getAllByTestId('y-axis');

      expect(xAxes.length).toBeGreaterThan(0);
      expect(yAxes.length).toBeGreaterThan(0);
    });

    it('renders chart lines', () => {
      render(<RevenueChart period="7d" />);

      const lines = screen.getAllByTestId('line');
      expect(lines.length).toBe(2); // Revenue and sales lines
    });

    it('renders cartesian grid', () => {
      render(<RevenueChart period="7d" />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders tooltip', () => {
      render(<RevenueChart period="7d" />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('fetches data for 7 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="7d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['revenue-chart', '7d'],
        })
      );
    });

    it('fetches data for 30 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="30d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['revenue-chart', '30d'],
        })
      );
    });

    it('fetches data for 90 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="90d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['revenue-chart', '90d'],
        })
      );
    });

    it('fetches data for 1 year period', () => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);

      render(<RevenueChart period="1y" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['revenue-chart', '1y'],
        })
      );
    });
  });

  describe('Legend Styling', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders revenue legend indicator with blue color', () => {
      const { container } = render(<RevenueChart period="7d" />);

      const blueLegend = container.querySelector('.bg-blue-600');
      expect(blueLegend).toBeInTheDocument();
    });

    it('renders sales legend indicator with green color', () => {
      const { container } = render(<RevenueChart period="7d" />);

      const greenLegend = container.querySelector('.bg-green-600');
      expect(greenLegend).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('handles data correctly', () => {
      mockUseQuery.mockReturnValue({
        data: mockRevenueData,
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<RevenueChart period="7d" />);

      // Component should render without errors
      expect(container.querySelector('.h-64.lg\\:h-72')).toBeInTheDocument();
    });
  });
});
