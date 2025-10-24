import { render, screen, fireEvent } from '../test-utils';
import { VehicleHeader } from './VehicleHeader';

// Mock UserMenu component
jest.mock('./UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

describe('VehicleHeader', () => {
  const mockOnAddVehicle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.print
    global.print = jest.fn();
  });

  describe('Header Content', () => {
    it('renders the main title', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText('Vehicle Inventory')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText(/Manage your vehicle inventory/i)).toBeInTheDocument();
    });

    it('renders user menu', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  describe('Vehicle Count Display', () => {
    it('displays total vehicles count', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText(/50 vehicles in inventory/i)).toBeInTheDocument();
    });

    it('formats large numbers with commas', () => {
      render(<VehicleHeader totalVehicles={1500} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText(/1,500 vehicles in inventory/i)).toBeInTheDocument();
    });

    it('handles zero vehicles', () => {
      render(<VehicleHeader totalVehicles={0} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText(/0 vehicles in inventory/i)).toBeInTheDocument();
    });

    it('handles single vehicle', () => {
      render(<VehicleHeader totalVehicles={1} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText(/1 vehicles in inventory/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Export button', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    it('renders Add Vehicle button', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByRole('button', { name: /Add Vehicle/i })).toBeInTheDocument();
    });

    it('calls window.print when Export button is clicked', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      expect(global.print).toHaveBeenCalledTimes(1);
    });

    it('calls onAddVehicle when Add Vehicle button is clicked', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      const addButton = screen.getByRole('button', { name: /Add Vehicle/i });
      fireEvent.click(addButton);

      expect(mockOnAddVehicle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Stats Section', () => {
    it('renders all stat labels', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText('Total Vehicles')).toBeInTheDocument();
      expect(screen.getByText('Being Processed')).toBeInTheDocument();
      expect(screen.getByText('Being Extracted')).toBeInTheDocument();
      expect(screen.getByText('Fully Processed')).toBeInTheDocument();
    });

    it('renders status indicators', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('displays total vehicles in quick stats', () => {
      render(<VehicleHeader totalVehicles={125} onAddVehicle={mockOnAddVehicle} />);

      const totalVehiclesElements = screen.getAllByText('125');
      expect(totalVehiclesElements.length).toBeGreaterThan(0);
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct color classes to status badges', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      const activeStatus = screen.getByText('Active');
      expect(activeStatus).toHaveClass('text-green-600');

      const partsStatus = screen.getByText('Parts');
      expect(partsStatus).toHaveClass('text-blue-600');

      const completeStatus = screen.getByText('Complete');
      expect(completeStatus).toHaveClass('text-orange-600');
    });

    it('renders badge with correct styling', () => {
      render(<VehicleHeader totalVehicles={50} onAddVehicle={mockOnAddVehicle} />);

      const badge = screen.getByText(/50 vehicles in inventory/i);
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });
});
