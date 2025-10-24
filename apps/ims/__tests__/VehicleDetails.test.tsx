import { render, screen } from '../test-utils';
import { VehicleDetails } from './VehicleDetails';
import { mockVehicle } from '../test-utils';

describe('VehicleDetails', () => {
  describe('Vehicle Information Display', () => {
    it('renders vehicle VIN', () => {
      const vehicle = mockVehicle({ vin: '1HGCM82633A123456' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('VIN')).toBeInTheDocument();
      expect(screen.getByText('1HGCM82633A123456')).toBeInTheDocument();
    });

    it('renders vehicle year', () => {
      const vehicle = mockVehicle({ year: 2020 });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Year')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
    });

    it('renders vehicle make and model', () => {
      const vehicle = mockVehicle({ make: 'Toyota', model: 'Camry' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Make')).toBeInTheDocument();
      expect(screen.getByText('Toyota')).toBeInTheDocument();
      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Camry')).toBeInTheDocument();
    });

    it('renders variant when provided', () => {
      const vehicle = mockVehicle({ variant: 'XLE' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Variant')).toBeInTheDocument();
      expect(screen.getByText('XLE')).toBeInTheDocument();
    });

    it('shows N/A for missing variant', () => {
      const vehicle = mockVehicle({ variant: undefined });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Variant')).toBeInTheDocument();
      const elements = screen.getAllByText('N/A');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('renders engine size when provided', () => {
      const vehicle = mockVehicle({ engineSize: '2.5L' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Engine Size')).toBeInTheDocument();
      expect(screen.getByText('2.5L')).toBeInTheDocument();
    });

    it('renders fuel type when provided', () => {
      const vehicle = mockVehicle({ fuelType: 'Petrol' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Fuel Type')).toBeInTheDocument();
      expect(screen.getByText('Petrol')).toBeInTheDocument();
    });

    it('renders transmission when provided', () => {
      const vehicle = mockVehicle({ transmission: 'Automatic' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Transmission')).toBeInTheDocument();
      expect(screen.getByText('Automatic')).toBeInTheDocument();
    });

    it('renders color when provided', () => {
      const vehicle = mockVehicle({ color: 'Blue' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });

    it('renders mileage with formatting', () => {
      const vehicle = mockVehicle({ mileage: 50000 });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Mileage')).toBeInTheDocument();
      expect(screen.getByText('50,000 km')).toBeInTheDocument();
    });

    it('shows N/A for missing mileage', () => {
      const vehicle = mockVehicle({ mileage: undefined });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Mileage')).toBeInTheDocument();
    });

    it('renders yard location when provided', () => {
      const vehicle = mockVehicle({ location: 'Section A, Row 3' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Yard Location')).toBeInTheDocument();
      expect(screen.getByText('Section A, Row 3')).toBeInTheDocument();
    });

    it('shows "Not specified" for missing location', () => {
      const vehicle = mockVehicle({ location: undefined });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Yard Location')).toBeInTheDocument();
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });
  });

  describe('Condition Badge', () => {
    it('displays condition with proper formatting', () => {
      const vehicle = mockVehicle({ condition: 'EXCELLENT' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('applies green color for NEW condition', () => {
      const vehicle = mockVehicle({ condition: 'NEW' });
      render(<VehicleDetails vehicle={vehicle} />);

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies blue color for EXCELLENT condition', () => {
      const vehicle = mockVehicle({ condition: 'EXCELLENT' });
      render(<VehicleDetails vehicle={vehicle} />);

      const badge = screen.getByText('Excellent');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('applies yellow color for GOOD condition', () => {
      const vehicle = mockVehicle({ condition: 'GOOD' });
      render(<VehicleDetails vehicle={vehicle} />);

      const badge = screen.getByText('Good');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('applies orange color for FAIR condition', () => {
      const vehicle = mockVehicle({ condition: 'FAIR' });
      render(<VehicleDetails vehicle={vehicle} />);

      const badge = screen.getByText('Fair');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('applies red color for POOR condition', () => {
      const vehicle = mockVehicle({ condition: 'POOR' });
      render(<VehicleDetails vehicle={vehicle} />);

      const badge = screen.getByText('Poor');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Vehicle Images', () => {
    it('renders images section when images are present', () => {
      const vehicle = mockVehicle({
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Vehicle Images')).toBeInTheDocument();
    });

    it('does not render images section when no images', () => {
      const vehicle = mockVehicle({ images: [] });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.queryByText('Vehicle Images')).not.toBeInTheDocument();
    });

    it('renders all vehicle images', () => {
      const vehicle = mockVehicle({
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByAltText('2020 Toyota Camry - Image 1')).toBeInTheDocument();
      expect(screen.getByAltText('2020 Toyota Camry - Image 2')).toBeInTheDocument();
      expect(screen.getByAltText('2020 Toyota Camry - Image 3')).toBeInTheDocument();
    });
  });

  describe('Description Section', () => {
    it('renders description when provided', () => {
      const vehicle = mockVehicle({
        description: 'This is a test vehicle with minor damage to the front bumper.',
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText(/minor damage to the front bumper/)).toBeInTheDocument();
    });

    it('does not render description section when empty', () => {
      const vehicle = mockVehicle({ description: '' });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('preserves whitespace in description', () => {
      const vehicle = mockVehicle({
        description: 'Line 1\nLine 2\nLine 3',
      });
      const { container } = render(<VehicleDetails vehicle={vehicle} />);

      const descriptionElement = container.querySelector('.whitespace-pre-wrap');
      expect(descriptionElement).toBeInTheDocument();
    });
  });

  describe('Parts Summary', () => {
    it('renders parts summary section', () => {
      const vehicle = mockVehicle();
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Parts Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Parts')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Sold/Reserved')).toBeInTheDocument();
    });

    it('displays total parts count', () => {
      const vehicle = mockVehicle({ totalParts: 175, availableParts: 100 });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('175')).toBeInTheDocument();
    });

    it('displays available parts count', () => {
      const vehicle = mockVehicle({ availableParts: 120 });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('calculates sold/reserved parts correctly', () => {
      const vehicle = mockVehicle({ totalParts: 150, availableParts: 120 });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('handles zero parts', () => {
      const vehicle = mockVehicle({ totalParts: 0, availableParts: 0 });
      render(<VehicleDetails vehicle={vehicle} />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });

    it('handles undefined parts counts', () => {
      const vehicle = mockVehicle({ totalParts: undefined, availableParts: undefined });
      render(<VehicleDetails vehicle={vehicle} />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Timeline Section', () => {
    it('renders timeline section', () => {
      const vehicle = mockVehicle();
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('displays acquisition date', () => {
      const acquisitionDate = new Date('2024-01-15');
      const vehicle = mockVehicle({ acquisitionDate: acquisitionDate.toISOString() });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText(/Vehicle acquired on/)).toBeInTheDocument();
    });

    it('displays created date', () => {
      const createdAt = new Date('2024-01-16');
      const vehicle = mockVehicle({ createdAt: createdAt.toISOString() });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText(/Added to inventory on/)).toBeInTheDocument();
    });

    it('displays updated date when different from created date', () => {
      const createdAt = new Date('2024-01-16');
      const updatedAt = new Date('2024-02-20');
      const vehicle = mockVehicle({
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText(/Last updated on/)).toBeInTheDocument();
    });

    it('does not display updated date when same as created date', () => {
      const date = new Date('2024-01-16');
      const vehicle = mockVehicle({
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
    });

    it('displays relative time for dates', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const vehicle = mockVehicle({
        acquisitionDate: recentDate.toISOString(),
        createdAt: recentDate.toISOString(),
      });
      render(<VehicleDetails vehicle={vehicle} />);

      const relativeTimes = screen.getAllByText(/ago/);
      expect(relativeTimes.length).toBeGreaterThan(0);
    });
  });

  describe('Section Headers', () => {
    it('renders all section headers', () => {
      const vehicle = mockVehicle({
        images: ['https://example.com/image1.jpg'],
        description: 'Test description',
      });
      render(<VehicleDetails vehicle={vehicle} />);

      expect(screen.getByText('Vehicle Images')).toBeInTheDocument();
      expect(screen.getByText('Vehicle Information')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Parts Summary')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct color classes to timeline indicators', () => {
      const vehicle = mockVehicle({
        createdAt: new Date('2024-01-16').toISOString(),
        updatedAt: new Date('2024-02-20').toISOString(),
      });
      const { container } = render(<VehicleDetails vehicle={vehicle} />);

      const blueDot = container.querySelector('.bg-blue-600.rounded-full');
      const greenDot = container.querySelector('.bg-green-600.rounded-full');
      const yellowDot = container.querySelector('.bg-yellow-600.rounded-full');

      expect(blueDot).toBeInTheDocument();
      expect(greenDot).toBeInTheDocument();
      expect(yellowDot).toBeInTheDocument();
    });

    it('applies correct color to available parts count', () => {
      const vehicle = mockVehicle({ availableParts: 50 });
      render(<VehicleDetails vehicle={vehicle} />);

      const availableCount = screen.getByText('50');
      expect(availableCount).toHaveClass('text-green-600');
    });

    it('applies correct color to sold/reserved count', () => {
      const vehicle = mockVehicle({ totalParts: 100, availableParts: 70 });
      render(<VehicleDetails vehicle={vehicle} />);

      const soldCount = screen.getByText('30');
      expect(soldCount).toHaveClass('text-red-600');
    });
  });
});
