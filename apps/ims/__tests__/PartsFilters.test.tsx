import { render, screen, fireEvent } from '../test-utils';
import { PartsFilters } from './PartsFilters';
import { Part } from '@partpal/shared-types';

describe('PartsFilters', () => {
  const mockOnFiltersChange = jest.fn();

  const defaultFilters = {
    sortBy: 'newest' as const,
  };

  const getFilterButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.textContent?.includes('Filters'));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Filters', () => {
    it('renders search input', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Search Parts')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by name, part number, description...')).toBeInTheDocument();
    });

    it('renders category dropdown', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('renders sort by dropdown', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('renders filters toggle button', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton();
      expect(filterButton).toBeInTheDocument();
    });

    it('displays initial search value', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, search: 'brake pad' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search by name, part number, description...') as HTMLInputElement;
      expect(searchInput.value).toBe('brake pad');
    });

    it('displays initial sort value', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, sortBy: 'name' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const sortSelect = screen.getByDisplayValue('Name A-Z') as HTMLSelectElement;
      expect(sortSelect.value).toBe('name');
    });
  });

  describe('Search Functionality', () => {
    it('calls onFiltersChange when search input changes', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByPlaceholderText('Search by name, part number, description...');
      fireEvent.change(searchInput, { target: { value: 'engine' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'engine',
      });
    });

    it('handles empty search input', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, search: 'brake' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search by name, part number, description...');
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: '',
      });
    });
  });

  describe('Category Functionality', () => {
    it('renders all categories', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Engine Components')).toBeInTheDocument();
      expect(screen.getByText('Transmission')).toBeInTheDocument();
      expect(screen.getByText('Suspension & Steering')).toBeInTheDocument();
      expect(screen.getByText('Brake System')).toBeInTheDocument();
      expect(screen.getByText('Electrical Components')).toBeInTheDocument();
      expect(screen.getByText('Body & Exterior')).toBeInTheDocument();
      expect(screen.getByText('Interior Components')).toBeInTheDocument();
      expect(screen.getByText('Lighting')).toBeInTheDocument();
      expect(screen.getByText('Cooling System')).toBeInTheDocument();
      expect(screen.getByText('Exhaust System')).toBeInTheDocument();
    });

    it('renders "All Categories" option', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });

    it('calls onFiltersChange when category is selected', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'engine' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        categoryId: 'engine',
      });
    });

    it('clears category when "All Categories" is selected', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'engine' } });
      fireEvent.change(categorySelect, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        ...defaultFilters,
        categoryId: undefined,
      });
    });
  });

  describe('Sort Functionality', () => {
    it('renders all sort options', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Newest First')).toBeInTheDocument();
      expect(screen.getByText('Oldest First')).toBeInTheDocument();
      expect(screen.getByText('Name A-Z')).toBeInTheDocument();
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
    });

    it('calls onFiltersChange when sort option changes', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const sortSelect = screen.getByDisplayValue('Newest First');
      fireEvent.change(sortSelect, { target: { value: 'price_asc' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        sortBy: 'price_asc',
      });
    });

    it('defaults to newest when no sort specified', () => {
      render(
        <PartsFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const sortSelect = screen.getByDisplayValue('Newest First') as HTMLSelectElement;
      expect(sortSelect.value).toBe('newest');
    });
  });

  describe('Advanced Filters Toggle', () => {
    it('does not show advanced filters by default', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.queryByText('Vehicle')).not.toBeInTheDocument();
    });

    it('shows advanced filters when toggle button is clicked', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);

      expect(screen.getByText('Vehicle')).toBeInTheDocument();
      expect(screen.getByText('Min Price (ZAR)')).toBeInTheDocument();
      expect(screen.getByText('Max Price (ZAR)')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
    });

    it('hides advanced filters when toggle button is clicked again', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;

      // Show
      fireEvent.click(filterButton);
      expect(screen.getByText('Vehicle')).toBeInTheDocument();

      // Hide
      fireEvent.click(filterButton);
      expect(screen.queryByText('Vehicle')).not.toBeInTheDocument();
    });

    it('highlights filter button when advanced filters are shown', () => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;

      // Before click
      expect(filterButton).toHaveClass('border-gray-300', 'bg-white');

      // After click
      fireEvent.click(filterButton);
      expect(filterButton).toHaveClass('border-blue-300', 'bg-blue-50');
    });

    it('highlights filter button when active filters are present', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, categoryId: 'engine' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = getFilterButton()!;
      expect(filterButton).toHaveClass('border-blue-300', 'bg-blue-50');
    });
  });

  describe('Active Filter Count', () => {
    it('shows filter count badge when filters are active', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, categoryId: 'engine', search: 'test' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show filter count when only sortBy is set', () => {
      render(
        <PartsFilters
          filters={{ sortBy: 'name' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = getFilterButton()!;
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('counts multiple filter types', () => {
      render(
        <PartsFilters
          filters={{
            ...defaultFilters,
            search: 'test',
            categoryId: 'engine',
            vehicleId: 'vehicle-1',
            priceMin: 100,
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('does not count empty strings as active filters', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, search: '', categoryId: '' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = getFilterButton()!;
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('does not count empty arrays as active filters', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, status: [], condition: [] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = getFilterButton()!;
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('counts arrays with items as active filters', () => {
      render(
        <PartsFilters
          filters={{ ...defaultFilters, status: ['AVAILABLE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Vehicle Filter', () => {
    beforeEach(() => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders vehicle input', () => {
      expect(screen.getByPlaceholderText('Enter vehicle ID or VIN')).toBeInTheDocument();
    });

    it('calls onFiltersChange when vehicle input changes', () => {
      const vehicleInput = screen.getByPlaceholderText('Enter vehicle ID or VIN');
      fireEvent.change(vehicleInput, { target: { value: 'VIN123' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        vehicleId: 'VIN123',
      });
    });

    it('sends vehicle value to onFiltersChange', () => {
      const vehicleInput = screen.getByPlaceholderText('Enter vehicle ID or VIN');
      fireEvent.change(vehicleInput, { target: { value: 'VIN789' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'VIN789',
        })
      );
    });
  });

  describe('Price Filters', () => {
    beforeEach(() => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders price inputs', () => {
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('999999')).toBeInTheDocument();
    });

    it('calls onFiltersChange when min price changes', () => {
      const minPriceInput = screen.getByPlaceholderText('0');
      fireEvent.change(minPriceInput, { target: { value: '100' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priceMin: 100,
      });
    });

    it('calls onFiltersChange when max price changes', () => {
      const maxPriceInput = screen.getByPlaceholderText('999999');
      fireEvent.change(maxPriceInput, { target: { value: '5000' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priceMax: 5000,
      });
    });

    it('handles price value changes', () => {
      const minPriceInput = screen.getByPlaceholderText('0');
      fireEvent.change(minPriceInput, { target: { value: '200' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceMin: 200,
        })
      );
    });

    it('handles max price value changes', () => {
      const maxPriceInput = screen.getByPlaceholderText('999999');
      fireEvent.change(maxPriceInput, { target: { value: '10000' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          priceMax: 10000,
        })
      );
    });
  });

  describe('Status Filters', () => {
    beforeEach(() => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders all status buttons', () => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Reserved')).toBeInTheDocument();
      expect(screen.getByText('Sold')).toBeInTheDocument();
    });

    it('adds status to filters when clicked', () => {
      const availableButton = screen.getByText('Available');
      fireEvent.click(availableButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['AVAILABLE'],
        })
      );
    });

    it('allows multiple statuses to be selected', () => {
      const availableButton = screen.getByText('Available');
      fireEvent.click(availableButton);

      const reservedButton = screen.getByText('Reserved');
      fireEvent.click(reservedButton);

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('highlights selected statuses', () => {
      const { container } = render(
        <PartsFilters
          filters={{ ...defaultFilters, status: ['AVAILABLE'] }}
          onFiltersChange={jest.fn()}
        />
      );

      const filterBtn = Array.from(container.querySelectorAll('button')).find(btn =>
        btn.textContent?.includes('Filters')
      );
      fireEvent.click(filterBtn!);

      // Find all buttons with "Available" text - need to get the status button specifically
      const statusButtons = container.querySelectorAll('button');
      const availableButton = Array.from(statusButtons).find(btn => btn.textContent === 'Available');
      const reservedButton = Array.from(statusButtons).find(btn => btn.textContent === 'Reserved');

      expect(availableButton).toHaveClass('bg-blue-600', 'text-white');
      expect(reservedButton).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  describe('Condition Filters', () => {
    beforeEach(() => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders all condition buttons', () => {
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });

    it('adds condition to filters when clicked', () => {
      const goodButton = screen.getByText('Good');
      fireEvent.click(goodButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: ['GOOD'],
        })
      );
    });

    it('allows multiple conditions to be selected', () => {
      const goodButton = screen.getByText('Good');
      fireEvent.click(goodButton);

      const excellentButton = screen.getByText('Excellent');
      fireEvent.click(excellentButton);

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('highlights selected conditions', () => {
      const { container } = render(
        <PartsFilters
          filters={{ ...defaultFilters, condition: ['GOOD'] }}
          onFiltersChange={jest.fn()}
        />
      );

      const filterBtn = Array.from(container.querySelectorAll('button')).find(btn =>
        btn.textContent?.includes('Filters')
      );
      fireEvent.click(filterBtn!);

      const conditionButtons = container.querySelectorAll('button');
      const goodButton = Array.from(conditionButtons).find(btn => btn.textContent === 'Good');
      const excellentButton = Array.from(conditionButtons).find(btn => btn.textContent === 'Excellent');

      expect(goodButton).toHaveClass('bg-green-600', 'text-white');
      expect(excellentButton).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  describe('Marketplace Toggle', () => {
    beforeEach(() => {
      render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders marketplace checkbox', () => {
      expect(screen.getByText('Only show parts listed on marketplace')).toBeInTheDocument();
    });

    it('calls onFiltersChange when checkbox is toggled', () => {
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isListedOnMarketplace: true,
        })
      );
    });
  });

  describe('Clear Filters', () => {
    beforeEach(() => {
      render(
        <PartsFilters
          filters={{
            search: 'brake',
            categoryId: 'brakes',
            vehicleId: 'vehicle-1',
            priceMin: 100,
            priceMax: 5000,
            status: ['AVAILABLE'],
            condition: ['GOOD'],
            sortBy: 'price_asc',
            isListedOnMarketplace: true,
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders clear all button', () => {
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => btn.textContent?.includes('Clear All'));
      expect(clearButton).toBeInTheDocument();
    });

    it('resets all filters when clear all is clicked', () => {
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => btn.textContent?.includes('Clear All'))!;
      fireEvent.click(clearButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        sortBy: 'newest',
      });
    });
  });

  describe('Search Icon', () => {
    it('renders search icon', () => {
      const { container } = render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchIcon = container.querySelector('svg.h-5.w-5.text-gray-400');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Filter Icon', () => {
    it('renders filter icon in toggle button', () => {
      const { container } = render(
        <PartsFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterIcon = container.querySelector('svg.h-4.w-4');
      expect(filterIcon).toBeInTheDocument();
    });
  });
});
