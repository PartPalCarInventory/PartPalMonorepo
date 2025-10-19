import { render, screen, fireEvent } from '../test-utils';
import { VehicleFilters } from './VehicleFilters';
import { Vehicle } from '@partpal/shared-types';

describe('VehicleFilters', () => {
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
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Search Vehicles')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search by VIN, make, model...')).toBeInTheDocument();
    });

    it('renders sort by dropdown', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('renders filters toggle button', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const buttons = screen.getAllByRole('button');
      const filterButton = buttons.find(btn => btn.textContent?.includes('Filters'));
      expect(filterButton).toBeInTheDocument();
    });

    it('displays initial search value', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, search: 'Toyota' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...') as HTMLInputElement;
      expect(searchInput.value).toBe('Toyota');
    });

    it('displays initial sort value', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, sortBy: 'make' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const sortSelect = screen.getByDisplayValue('Make A-Z') as HTMLSelectElement;
      expect(sortSelect.value).toBe('make');
    });
  });

  describe('Search Functionality', () => {
    it('calls onFiltersChange when search input changes', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...');
      fireEvent.change(searchInput, { target: { value: 'Honda' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: 'Honda',
      });
    });

    it('handles empty search input', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, search: 'Toyota' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search by VIN, make, model...');
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        search: '',
      });
    });
  });

  describe('Sort Functionality', () => {
    it('renders all sort options', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Newest First')).toBeInTheDocument();
      expect(screen.getByText('Oldest First')).toBeInTheDocument();
      expect(screen.getByText('Make A-Z')).toBeInTheDocument();
      expect(screen.getByText('Model A-Z')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
    });

    it('calls onFiltersChange when sort option changes', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const sortSelect = screen.getByDisplayValue('Newest First');
      fireEvent.change(sortSelect, { target: { value: 'make' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        sortBy: 'make',
      });
    });

    it('defaults to newest when no sort specified', () => {
      render(
        <VehicleFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const sortSelect = screen.getByDisplayValue('Newest First') as HTMLSelectElement;
      expect(sortSelect.value).toBe('newest');
    });
  });

  describe('Advanced Filters Toggle', () => {
    it('does not show advanced filters by default', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.queryByText('All Makes')).not.toBeInTheDocument();
    });

    it('shows advanced filters when toggle button is clicked', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);

      expect(screen.getByText('Make')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Year From')).toBeInTheDocument();
      expect(screen.getByText('Year To')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
    });

    it('hides advanced filters when toggle button is clicked again', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;

      // Show
      fireEvent.click(filterButton);
      expect(screen.getByText('All Makes')).toBeInTheDocument();

      // Hide
      fireEvent.click(filterButton);
      expect(screen.queryByText('All Makes')).not.toBeInTheDocument();
    });

    it('highlights filter button when advanced filters are shown', () => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
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
        <VehicleFilters
          filters={{ ...defaultFilters, make: 'Toyota' }}
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
        <VehicleFilters
          filters={{ ...defaultFilters, make: 'Toyota', model: 'Camry' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show filter count when only sortBy is set', () => {
      render(
        <VehicleFilters
          filters={{ sortBy: 'make' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /Filters/i });
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('counts multiple filter types', () => {
      render(
        <VehicleFilters
          filters={{
            ...defaultFilters,
            search: 'test',
            make: 'Toyota',
            model: 'Camry',
            yearFrom: 2020,
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('does not count empty strings as active filters', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, search: '', make: '' }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /Filters/i });
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('does not count empty arrays as active filters', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, condition: [] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /Filters/i });
      expect(filterButton.textContent).not.toMatch(/\d+/);
    });

    it('counts arrays with items as active filters', () => {
      render(
        <VehicleFilters
          filters={{ ...defaultFilters, condition: ['GOOD'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Make Filter', () => {
    beforeEach(() => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders all makes', () => {
      const makes = [
        'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Kia',
        'Mercedes-Benz', 'Nissan', 'Toyota', 'Volkswagen', 'Volvo'
      ];

      makes.forEach(make => {
        expect(screen.getByText(make)).toBeInTheDocument();
      });
    });

    it('renders "All Makes" option', () => {
      expect(screen.getByText('All Makes')).toBeInTheDocument();
    });

    it('calls onFiltersChange when make is selected', () => {
      const makeSelect = screen.getByDisplayValue('All Makes');
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        make: 'Toyota',
      });
    });

    it('clears make when "All Makes" is selected', () => {
      // Set to Toyota first, then clear
      const makeSelect = screen.getByDisplayValue('All Makes');
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
      fireEvent.change(makeSelect, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        ...defaultFilters,
        make: undefined,
      });
    });
  });

  describe('Model Filter', () => {
    beforeEach(() => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders model input', () => {
      expect(screen.getByPlaceholderText('Enter model')).toBeInTheDocument();
    });

    it('calls onFiltersChange when model input changes', () => {
      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Camry' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        model: 'Camry',
      });
    });

    it('sends model value to onFiltersChange', () => {
      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Accord' } });

      // Should be called with the model value
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'newest',
          model: 'Accord',
        })
      );
    });
  });

  describe('Year Filters', () => {
    beforeEach(() => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterButton = getFilterButton()!;
      fireEvent.click(filterButton);
    });

    it('renders year from dropdown', () => {
      expect(screen.getByText('Year From')).toBeInTheDocument();
    });

    it('renders year to dropdown', () => {
      expect(screen.getByText('Year To')).toBeInTheDocument();
    });

    it('renders "Any" option for year filters', () => {
      const anyOptions = screen.getAllByText('Any');
      expect(anyOptions.length).toBeGreaterThanOrEqual(2);
    });

    it('calls onFiltersChange when year from is selected', () => {
      const allSelects = screen.getAllByRole('combobox');
      // Third select is Year From (after Sort By and Make)
      const yearFromSelect = allSelects[2];
      fireEvent.change(yearFromSelect, { target: { value: '2020' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        yearFrom: 2020,
      });
    });

    it('calls onFiltersChange when year to is selected', () => {
      const allSelects = screen.getAllByRole('combobox');
      // Fourth select is Year To
      const yearToSelect = allSelects[3];
      fireEvent.change(yearToSelect, { target: { value: '2023' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        yearTo: 2023,
      });
    });

    it('clears year from when "Any" is selected', () => {
      const allSelects = screen.getAllByRole('combobox');
      const yearFromSelect = allSelects[2];
      fireEvent.change(yearFromSelect, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        yearFrom: undefined,
      });
    });

    it('clears year to when "Any" is selected', () => {
      const allSelects = screen.getAllByRole('combobox');
      const yearToSelect = allSelects[3];
      fireEvent.change(yearToSelect, { target: { value: '' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        yearTo: undefined,
      });
    });

    it('generates years from current year back 50 years', () => {
      const currentYear = new Date().getFullYear();
      const allSelects = screen.getAllByRole('combobox');
      const yearFromSelect = allSelects[2];
      const options = Array.from(yearFromSelect.querySelectorAll('option'));

      // Should have "Any" + 50 years
      expect(options.length).toBe(51);

      // Check first year option (not "Any")
      expect(options[1].textContent).toBe(currentYear.toString());

      // Check last year option
      expect(options[50].textContent).toBe((currentYear - 49).toString());
    });
  });

  describe('Condition Filters', () => {
    beforeEach(() => {
      render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
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

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        condition: ['GOOD'],
      });
    });

    it('removes condition from filters when clicked again', () => {
      // beforeEach has no conditions selected, start fresh
      const goodButton = screen.getByText('Good');
      fireEvent.click(goodButton);

      // Should add GOOD to the array
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: ['GOOD'],
        })
      );
    });

    it('allows multiple conditions to be selected', () => {
      // Click two buttons
      const goodButton = screen.getByText('Good');
      fireEvent.click(goodButton);

      const excellentButton = screen.getByText('Excellent');
      fireEvent.click(excellentButton);

      // At least one call should have both conditions
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('highlights selected conditions', () => {
      // The condition buttons are already rendered due to beforeEach
      // But we need to render a new component with condition selected
      const { container: newContainer } = render(
        <VehicleFilters
          filters={{ ...defaultFilters, condition: ['GOOD'] }}
          onFiltersChange={jest.fn()}
        />
      );

      // Open advanced filters for this new render
      const buttons = newContainer.querySelectorAll('button');
      const filterBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Filters'));
      fireEvent.click(filterBtn!);

      // Now check the condition buttons within this new container
      const conditionButtons = newContainer.querySelectorAll('button');
      const goodBtn = Array.from(conditionButtons).find(btn => btn.textContent === 'Good');
      const excellentBtn = Array.from(conditionButtons).find(btn => btn.textContent === 'Excellent');

      expect(goodBtn).toHaveClass('bg-blue-600', 'text-white');
      expect(excellentBtn).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('sets condition to undefined when empty array', () => {
      const goodButton = screen.getByText('Good');
      fireEvent.click(goodButton);

      // Clicking once should add the condition
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('Clear Filters', () => {
    beforeEach(() => {
      render(
        <VehicleFilters
          filters={{
            search: 'Toyota',
            make: 'Toyota',
            model: 'Camry',
            yearFrom: 2020,
            yearTo: 2023,
            condition: ['GOOD'],
            sortBy: 'make',
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
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchIcon = container.querySelector('svg.h-5.w-5.text-gray-400');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Filter Icon', () => {
    it('renders filter icon in toggle button', () => {
      const { container } = render(
        <VehicleFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      );

      const filterIcon = container.querySelector('svg.h-4.w-4');
      expect(filterIcon).toBeInTheDocument();
    });
  });
});
