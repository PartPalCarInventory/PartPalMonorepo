import { render, screen, fireEvent } from '../test-utils';
import { VehicleList } from './VehicleList';
import { mockVehicle } from '../test-utils';

describe('VehicleList', () => {
  const mockOnVehicleSelect = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(
        <VehicleList
          vehicles={[]}
          isLoading={true}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const loadingSkeleton = container.querySelector('.animate-pulse');
      expect(loadingSkeleton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no vehicles', () => {
      render(
        <VehicleList
          vehicles={[]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('No vehicles found')).toBeInTheDocument();
      expect(screen.getByText(/Get started by adding your first vehicle/i)).toBeInTheDocument();
    });

    it('does not render pagination in empty state', () => {
      render(
        <VehicleList
          vehicles={[]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Vehicle Display', () => {
    const mockVehicles = [
      mockVehicle({
        id: '1',
        year: 2020,
        make: 'Toyota',
        model: 'Corolla',
        variant: 'XLE',
        condition: 'EXCELLENT',
        vin: '1HGCM82633A000001',
        mileage: 50000,
        location: 'Yard A',
        images: ['https://example.com/image1.jpg'],
        totalParts: 100,
        availableParts: 75,
      }),
      mockVehicle({
        id: '2',
        year: 2018,
        make: 'Honda',
        model: 'Civic',
        condition: 'GOOD',
        vin: '1HGCM82633A000002',
        mileage: 80000,
        images: [],
        totalParts: 50,
        availableParts: 30,
      }),
    ];

    it('renders all vehicles in grid', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('2020 Toyota Corolla')).toBeInTheDocument();
      expect(screen.getByText('2018 Honda Civic')).toBeInTheDocument();
    });

    it('displays vehicle variant when provided', () => {
      const vehiclesWithVariant = [
        mockVehicle({
          id: '1',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
          variant: 'XLE',
        }),
      ];

      render(
        <VehicleList
          vehicles={vehiclesWithVariant}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('XLE')).toBeInTheDocument();
    });

    it('displays VIN numbers', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText(/1HGCM82633A000001/)).toBeInTheDocument();
      expect(screen.getByText(/1HGCM82633A000002/)).toBeInTheDocument();
    });

    it('displays mileage when provided', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('50,000 km')).toBeInTheDocument();
      expect(screen.getByText('80,000 km')).toBeInTheDocument();
    });

    it('displays location when provided', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Yard A')).toBeInTheDocument();
    });

    it('displays parts availability', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('75 / 100')).toBeInTheDocument();
      expect(screen.getByText('30 / 50')).toBeInTheDocument();
    });

    it('renders vehicle image when provided', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const image = screen.getByAltText('2020 Toyota Corolla');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('renders placeholder when no image provided', () => {
      render(
        <VehicleList
          vehicles={mockVehicles}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const placeholders = screen.getAllByRole('img', { hidden: true });
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Condition Badges', () => {
    it('displays condition with proper formatting', () => {
      const vehicle = mockVehicle({ condition: 'EXCELLENT' });

      render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('applies correct color classes for NEW condition', () => {
      const vehicle = mockVehicle({ condition: 'NEW' });

      const { container } = render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies correct color classes for EXCELLENT condition', () => {
      const vehicle = mockVehicle({ condition: 'EXCELLENT' });

      render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Excellent');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('applies correct color classes for POOR condition', () => {
      const vehicle = mockVehicle({ condition: 'POOR' });

      render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Poor');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('User Interactions', () => {
    it('calls onVehicleSelect when vehicle card is clicked', () => {
      const vehicle = mockVehicle();

      render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const vehicleCard = screen.getByText('2015 Toyota Corolla').closest('div');
      fireEvent.click(vehicleCard as HTMLElement);

      expect(mockOnVehicleSelect).toHaveBeenCalledWith(vehicle);
      expect(mockOnVehicleSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    it('does not render pagination when totalPages is 1', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('renders pagination when totalPages is greater than 1', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getAllByText('Previous').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Next').length).toBeGreaterThan(0);
    });

    it('displays current page and total pages', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText(/Showing page/i)).toBeInTheDocument();
      const pageNumbers = screen.getAllByText('2');
      expect(pageNumbers.length).toBeGreaterThan(0);
      const totalPageNumbers = screen.getAllByText('5');
      expect(totalPageNumbers.length).toBeGreaterThan(0);
    });

    it('disables Previous button on first page', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButtons = screen.getAllByText('Previous');
      prevButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('disables Next button on last page', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={3}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButtons = screen.getAllByText('Next');
      nextButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('calls onPageChange with correct page when Previous is clicked', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={2}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getAllByText('Previous')[0];
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with correct page when Next is clicked', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getAllByText('Next')[0];
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when page number is clicked', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const pageButton = screen.getAllByRole('button').find(
        btn => btn.textContent === '3'
      );

      if (pageButton) {
        fireEvent.click(pageButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(3);
      }
    });

    it('highlights current page button', () => {
      render(
        <VehicleList
          vehicles={[mockVehicle()]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const pageButton = screen.getAllByRole('button').find(
        btn => btn.textContent === '2' && btn.className.includes('bg-blue-50')
      );

      expect(pageButton).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('displays relative time for acquisition date', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2);

      const vehicle = mockVehicle({
        acquisitionDate: recentDate.toISOString(),
      });

      render(
        <VehicleList
          vehicles={[vehicle]}
          isLoading={false}
          onVehicleSelect={mockOnVehicleSelect}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText(/Added.*ago/)).toBeInTheDocument();
    });
  });
});
