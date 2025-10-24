import { render, screen, fireEvent, waitFor } from '../test-utils';
import Reports from './reports';
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
jest.mock('../components/ReportsHeader', () => ({
  ReportsHeader: ({ filters, onFiltersChange, onExport, activeTab, onTabChange }: any) => (
    <div data-testid="reports-header">
      <button onClick={onExport}>Export</button>
      <button onClick={() => onTabChange('inventory')}>Inventory Tab</button>
      <button onClick={() => onTabChange('financial')}>Financial Tab</button>
      <button onClick={() => onTabChange('performance')}>Performance Tab</button>
      <button onClick={() => onTabChange('sales')}>Sales Tab</button>
      <span>Active: {activeTab}</span>
    </div>
  ),
}));

jest.mock('../components/InventoryReport', () => ({
  InventoryReport: ({ data, filters, compact }: any) => (
    <div data-testid="inventory-report">
      <span>Inventory Report {compact ? '(compact)' : ''}</span>
    </div>
  ),
}));

jest.mock('../components/FinancialReport', () => ({
  FinancialReport: ({ data, filters, compact }: any) => (
    <div data-testid="financial-report">
      <span>Financial Report {compact ? '(compact)' : ''}</span>
    </div>
  ),
}));

jest.mock('../components/PerformanceReport', () => ({
  PerformanceReport: ({ data, filters, compact }: any) => (
    <div data-testid="performance-report">
      <span>Performance Report {compact ? '(compact)' : ''}</span>
    </div>
  ),
}));

jest.mock('../components/SalesReport', () => ({
  SalesReport: ({ data, filters }: any) => (
    <div data-testid="sales-report">
      <span>Sales Report</span>
    </div>
  ),
}));

jest.mock('../components/ExportModal', () => ({
  ExportModal: ({ isOpen, onClose, onExport, reportType }: any) =>
    isOpen ? (
      <div data-testid="export-modal">
        <span>Export Modal: {reportType}</span>
        <button onClick={() => onExport('pdf')}>Export PDF</button>
        <button onClick={() => onExport('excel')}>Export Excel</button>
        <button onClick={() => onExport('csv')}>Export CSV</button>
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
  MobileCard: ({ children }: any) => (
    <div data-testid="mobile-card">{children}</div>
  ),
  MobileButton: ({ children, onClick, fullWidth, variant }: any) => (
    <button onClick={onClick} data-fullwidth={fullWidth} data-variant={variant}>
      {children}
    </button>
  ),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

describe('Reports Page', () => {
  const mockReportsData = {
    inventory: { totalParts: 100, lowStock: 5 },
    financial: { revenue: 50000, expenses: 20000 },
    performance: { salesRate: 85, efficiency: 92 },
    sales: { totalSales: 150, avgOrderValue: 333 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/reports',
      query: {},
      asPath: '/reports',
      route: '/reports',
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

      render(<Reports />);

      expect(screen.getByText('Error Loading Reports')).toBeInTheDocument();
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

      render(<Reports />);

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

      render(<Reports />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeletons when data is loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { container } = render(<Reports />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockReportsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders reports header', () => {
      render(<Reports />);

      expect(screen.getByTestId('reports-header')).toBeInTheDocument();
    });

    it('renders overview tab by default', () => {
      render(<Reports />);

      expect(screen.getByText('Active: overview')).toBeInTheDocument();
    });

    it('renders compact reports in overview mode', () => {
      render(<Reports />);

      // Reports appear in both desktop and mobile layouts
      expect(screen.getAllByText('Inventory Report (compact)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Financial Report (compact)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Performance Report (compact)').length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockReportsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('switches to inventory tab when clicked', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Inventory Tab'));

      expect(screen.getByText('Active: inventory')).toBeInTheDocument();
      expect(screen.queryByText('(compact)')).not.toBeInTheDocument();
    });

    it('switches to financial tab when clicked', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Financial Tab'));

      expect(screen.getByText('Active: financial')).toBeInTheDocument();
    });

    it('switches to performance tab when clicked', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Performance Tab'));

      expect(screen.getByText('Active: performance')).toBeInTheDocument();
    });

    it('switches to sales tab when clicked', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Sales Tab'));

      expect(screen.getByText('Active: sales')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockReportsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens export modal when export button is clicked', () => {
      render(<Reports />);

      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });

    it('closes export modal when close is clicked', () => {
      render(<Reports />);

      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });

    it('closes export modal after exporting PDF', () => {
      render(<Reports />);

      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      const pdfButton = screen.getByText('Export PDF');
      fireEvent.click(pdfButton);

      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });

    it('closes export modal after exporting Excel', () => {
      render(<Reports />);

      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      const excelButton = screen.getByText('Export Excel');
      fireEvent.click(excelButton);

      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });

    it('closes export modal after exporting CSV', () => {
      render(<Reports />);

      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      const csvButton = screen.getByText('Export CSV');
      fireEvent.click(csvButton);

      expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument();
    });

    it('shows correct report type in export modal', () => {
      render(<Reports />);

      // Switch to inventory tab
      fireEvent.click(screen.getByText('Inventory Tab'));

      // Open export modal
      const exportButtons = screen.getAllByText('Export');
      fireEvent.click(exportButtons[0]);

      expect(screen.getByText('Export Modal: inventory')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockReportsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders mobile layout', () => {
      render(<Reports />);

      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('renders date range inputs on mobile', () => {
      render(<Reports />);

      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();

      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      expect(dateInputs.length).toBeGreaterThan(0);
    });

    it('renders report type selector on mobile', () => {
      render(<Reports />);

      expect(screen.getByText('Report Type')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('switches report type on mobile', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Inventory'));

      expect(screen.getByText('Active: inventory')).toBeInTheDocument();
    });

    it('updates date from filter on mobile', () => {
      render(<Reports />);

      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      const fromInput = dateInputs[0];

      fireEvent.change(fromInput, { target: { value: '2025-01-01' } });

      expect(fromInput).toHaveValue('2025-01-01');
    });

    it('updates date to filter on mobile', () => {
      render(<Reports />);

      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      const toInput = dateInputs[1];

      fireEvent.change(toInput, { target: { value: '2025-12-31' } });

      expect(toInput).toHaveValue('2025-12-31');
    });

    it('renders export button on mobile', () => {
      render(<Reports />);

      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    it('opens export modal from mobile button', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Export Report'));

      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });
  });

  describe('Report Content Rendering', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockReportsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders inventory report when inventory tab is active', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Inventory Tab'));

      const inventoryReports = screen.getAllByTestId('inventory-report');
      expect(inventoryReports.length).toBeGreaterThan(0);
    });

    it('renders financial report when financial tab is active', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Financial Tab'));

      const financialReports = screen.getAllByTestId('financial-report');
      expect(financialReports.length).toBeGreaterThan(0);
    });

    it('renders performance report when performance tab is active', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Performance Tab'));

      const performanceReports = screen.getAllByTestId('performance-report');
      expect(performanceReports.length).toBeGreaterThan(0);
    });

    it('renders sales report when sales tab is active', () => {
      render(<Reports />);

      fireEvent.click(screen.getByText('Sales Tab'));

      const salesReports = screen.getAllByTestId('sales-report');
      expect(salesReports.length).toBeGreaterThan(0);
    });
  });
});
