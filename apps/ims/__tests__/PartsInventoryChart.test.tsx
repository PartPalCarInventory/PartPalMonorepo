import { render, screen } from '../test-utils';
import { PartsInventoryChart } from './PartsInventoryChart';
import { useQuery } from '@tanstack/react-query';

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('PartsInventoryChart', () => {
  const mockInventoryData = [
    { status: 'AVAILABLE', count: 120, percentage: 40 },
    { status: 'RESERVED', count: 60, percentage: 20 },
    { status: 'SOLD', count: 90, percentage: 30 },
    { status: 'LISTED', count: 30, percentage: 10 },
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

      render(<PartsInventoryChart period="7d" />);

      const container = screen.getByText((content, element) => {
        return element?.classList.contains('animate-pulse') || false;
      }).parentElement;

      expect(container).toBeInTheDocument();
    });

    it('shows loading skeleton with correct height', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<PartsInventoryChart period="7d" />);
      const loadingContainer = container.querySelector('.h-80');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no data available', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByText('No inventory data available')).toBeInTheDocument();
    });

    it('renders empty state when data is undefined', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByText('No inventory data available')).toBeInTheDocument();
    });

    it('renders empty state icon', () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { container } = render(<PartsInventoryChart period="7d" />);
      const icon = container.querySelector('.text-gray-400');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders chart components when data is available', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders chart axes', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders cartesian grid', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders tooltip', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders bar chart', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });
  });

  describe('Summary Stats', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders all status labels', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Reserved')).toBeInTheDocument();
      expect(screen.getByText('Sold')).toBeInTheDocument();
      expect(screen.getByText('Listed on Marketplace')).toBeInTheDocument();
    });

    it('displays counts for each status', () => {
      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('formats large numbers with locale string', () => {
      mockUseQuery.mockReturnValue({
        data: [{ status: 'AVAILABLE', count: 1250, percentage: 100 }],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);

      expect(screen.getByText('1,250')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('fetches data for 7 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['inventory-chart', '7d'],
        })
      );
    });

    it('fetches data for 30 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="30d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['inventory-chart', '30d'],
        })
      );
    });

    it('fetches data for 90 day period', () => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="90d" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['inventory-chart', '90d'],
        })
      );
    });

    it('fetches data for 1 year period', () => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="1y" />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['inventory-chart', '1y'],
        })
      );
    });
  });

  describe('Status Colors', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders color indicators for all statuses', () => {
      const { container } = render(<PartsInventoryChart period="7d" />);

      const colorIndicators = container.querySelectorAll('.w-2\\.5, .w-3');
      expect(colorIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders with responsive height classes', () => {
      const { container } = render(<PartsInventoryChart period="7d" />);

      const chartContainer = container.querySelector('.h-56.lg\\:h-64');
      expect(chartContainer).toBeInTheDocument();
    });

    it('renders summary stats with responsive grid', () => {
      const { container } = render(<PartsInventoryChart period="7d" />);

      const grid = container.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Label Formatting', () => {
    it('formats AVAILABLE status correctly', () => {
      mockUseQuery.mockReturnValue({
        data: [{ status: 'AVAILABLE', count: 100, percentage: 100 }],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);
      expect(screen.getByText('Available')).toBeInTheDocument();
    });

    it('formats RESERVED status correctly', () => {
      mockUseQuery.mockReturnValue({
        data: [{ status: 'RESERVED', count: 100, percentage: 100 }],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);
      expect(screen.getByText('Reserved')).toBeInTheDocument();
    });

    it('formats SOLD status correctly', () => {
      mockUseQuery.mockReturnValue({
        data: [{ status: 'SOLD', count: 100, percentage: 100 }],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);
      expect(screen.getByText('Sold')).toBeInTheDocument();
    });

    it('formats LISTED status correctly', () => {
      mockUseQuery.mockReturnValue({
        data: [{ status: 'LISTED', count: 100, percentage: 100 }],
        isLoading: false,
        error: null,
      } as any);

      render(<PartsInventoryChart period="7d" />);
      expect(screen.getByText('Listed on Marketplace')).toBeInTheDocument();
    });
  });
});
