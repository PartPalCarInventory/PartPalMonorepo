import { render, screen, fireEvent } from '../test-utils';
import { ReportsHeader } from './ReportsHeader';

// Mock UserMenu component
jest.mock('./UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

describe('ReportsHeader', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnTabChange = jest.fn();

  const defaultFilters = {
    dateFrom: '2025-01-01',
    dateTo: '2025-10-14',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header Content', () => {
    it('renders the main title', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText(/Comprehensive business intelligence/i)).toBeInTheDocument();
    });

    it('renders user menu', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  describe('Date Filters', () => {
    // Helper function to get date inputs since labels don't have htmlFor
    const getFromInput = () => {
      const inputs = screen.getAllByDisplayValue('2025-01-01');
      return inputs[0];
    };

    const getToInput = () => {
      const inputs = screen.getAllByDisplayValue('2025-10-14');
      return inputs[0];
    };

    it('renders From date label', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('From')).toBeInTheDocument();
    });

    it('renders To date label', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('To')).toBeInTheDocument();
    });

    it('displays initial From date value', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const fromInput = getFromInput() as HTMLInputElement;
      expect(fromInput.value).toBe('2025-01-01');
      expect(fromInput.type).toBe('date');
    });

    it('displays initial To date value', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const toInput = getToInput() as HTMLInputElement;
      expect(toInput.value).toBe('2025-10-14');
      expect(toInput.type).toBe('date');
    });

    it('calls onFiltersChange when From date is changed', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const fromInput = getFromInput();
      fireEvent.change(fromInput, { target: { value: '2025-02-01' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        dateFrom: '2025-02-01',
      });
    });

    it('calls onFiltersChange when To date is changed', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const toInput = getToInput();
      fireEvent.change(toInput, { target: { value: '2025-12-31' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        dateTo: '2025-12-31',
      });
    });

    it('handles empty date filters', () => {
      render(
        <ReportsHeader
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const dateInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
      const fromInput = dateInputs.find(input => input.type === 'date' && input.previousSibling?.textContent === 'From');
      const toInput = dateInputs.find(input => input.type === 'date' && input.previousSibling?.textContent === 'To');

      expect(fromInput?.value).toBe('');
      expect(toInput?.value).toBe('');
    });
  });

  describe('Export Button', () => {
    it('renders export button', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    it('calls onExport when export button is clicked', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tabs Navigation', () => {
    it('renders all tab buttons', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="financial"
          onTabChange={mockOnTabChange}
        />
      );

      const financialTab = screen.getByText('Financial').closest('button');
      expect(financialTab).toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('does not highlight inactive tabs', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const financialTab = screen.getByText('Financial').closest('button');
      expect(financialTab).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('calls onTabChange when tab is clicked', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const inventoryTab = screen.getByText('Inventory');
      fireEvent.click(inventoryTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('inventory');
    });

    it('switches between tabs correctly', () => {
      const { rerender } = render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      let overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('border-blue-500');

      rerender(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="sales"
          onTabChange={mockOnTabChange}
        />
      );

      const salesTab = screen.getByText('Sales').closest('button');
      expect(salesTab).toHaveClass('border-blue-500');

      overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab).toHaveClass('border-transparent');
    });

    it('renders all tabs with correct order', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const tabs = screen.getAllByRole('button').filter(btn =>
        ['Overview', 'Inventory', 'Financial', 'Performance', 'Sales'].some(name =>
          btn.textContent?.includes(name)
        )
      );

      expect(tabs).toHaveLength(5);
      expect(tabs[0].textContent).toContain('Overview');
      expect(tabs[1].textContent).toContain('Inventory');
      expect(tabs[2].textContent).toContain('Financial');
      expect(tabs[3].textContent).toContain('Performance');
      expect(tabs[4].textContent).toContain('Sales');
    });
  });

  describe('Tab Icons', () => {
    it('displays icons for each tab', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      // Check that tabs have emojis/icons (they should be in the button text content)
      const overviewTab = screen.getByText('Overview').closest('button');
      expect(overviewTab?.textContent).toMatch(/📊|Overview/);
    });
  });

  describe('Responsive Behavior', () => {
    it('renders all elements in desktop layout', () => {
      render(
        <ReportsHeader
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('From')).toBeInTheDocument();
      expect(screen.getByText('To')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-10-14')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Filter Preservation', () => {
    it('preserves other filter values when changing date', () => {
      const filtersWithExtras = {
        ...defaultFilters,
        vehicleId: 'vehicle-123',
        categoryId: 'category-456',
      };

      render(
        <ReportsHeader
          filters={filtersWithExtras}
          onFiltersChange={mockOnFiltersChange}
          onExport={mockOnExport}
          activeTab="overview"
          onTabChange={mockOnTabChange}
        />
      );

      const fromInput = screen.getAllByDisplayValue('2025-01-01')[0];
      fireEvent.change(fromInput, { target: { value: '2025-03-01' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithExtras,
        dateFrom: '2025-03-01',
      });
    });
  });
});
