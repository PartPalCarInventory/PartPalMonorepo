import { render, screen, fireEvent, waitFor } from '../test-utils';
import { VehicleModal } from './VehicleModal';
import { mockVehicle } from '../test-utils';

// Mock the child components
jest.mock('./VehicleDetails', () => ({
  VehicleDetails: ({ vehicle }: any) => (
    <div data-testid="vehicle-details">Vehicle Details for {vehicle.id}</div>
  ),
}));

jest.mock('./VehiclePartsList', () => ({
  VehiclePartsList: ({ vehicleId }: any) => (
    <div data-testid="vehicle-parts-list">Parts for {vehicleId}</div>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('VehicleModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <VehicleModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Add New Vehicle')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add New Vehicle')).toBeInTheDocument();
    });
  });

  describe('Add Mode (No Vehicle)', () => {
    it('displays "Add New Vehicle" title', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add New Vehicle')).toBeInTheDocument();
    });

    it('does not display tabs in add mode', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Vehicle Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Vehicle')).not.toBeInTheDocument();
      expect(screen.queryByText(/Parts \(/)).not.toBeInTheDocument();
    });

    it('shows edit form by default in add mode', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByPlaceholderText('Enter 17-character VIN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Vehicle/i })).toBeInTheDocument();
    });
  });

  describe('Edit Mode (With Vehicle)', () => {
    const vehicle = mockVehicle({
      id: 'vehicle-1',
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      vin: '1HGCM82633A123456',
      totalParts: 50,
    });

    it('displays vehicle title', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('2020 Toyota Camry')).toBeInTheDocument();
    });

    it('displays VIN in subtitle', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/VIN: 1HGCM82633A123456/)).toBeInTheDocument();
    });

    it('renders all tabs', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
      const editVehicleElements = screen.getAllByText('Edit Vehicle');
      expect(editVehicleElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Parts \(50\)/)).toBeInTheDocument();
    });

    it('shows details tab by default in edit mode', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const detailsTab = screen.getByText('Vehicle Details');
      expect(detailsTab).toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('switches to edit tab when clicked', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Get the tab (first element) not the button (second element)
      const editTabs = screen.getAllByText('Edit Vehicle');
      const editTab = editTabs[0]; // The tab is the first occurrence
      fireEvent.click(editTab);

      expect(editTab).toHaveClass('border-blue-500', 'text-blue-600');
      expect(screen.getByPlaceholderText('Enter 17-character VIN')).toBeInTheDocument();
    });

    it('switches to parts tab when clicked', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const partsTab = screen.getByText(/Parts \(/);
      fireEvent.click(partsTab);

      expect(partsTab).toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('displays parts count in parts tab', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/Parts \(50\)/)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when background overlay is clicked', () => {
      const { container } = render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const overlay = container.querySelector('.bg-gray-500.bg-opacity-75');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Close button is clicked in details view', () => {
      const vehicle = mockVehicle();

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Submission (Add)', () => {
    it('submits POST request when adding new vehicle', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const vinInput = screen.getByPlaceholderText('Enter 17-character VIN');
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A123456' } });

      const makeSelect = screen.getByDisplayValue('Select Make');
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });

      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Corolla' } });

      const submitButton = screen.getByRole('button', { name: /Add Vehicle/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('calls onSave when vehicle is successfully added', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const vinInput = screen.getByPlaceholderText('Enter 17-character VIN');
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A123456' } });

      const makeSelect = screen.getByDisplayValue('Select Make');
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });

      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Corolla' } });

      const submitButton = screen.getByRole('button', { name: /Add Vehicle/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error alert when add fails', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create vehicle' }),
      });

      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const vinInput = screen.getByPlaceholderText('Enter 17-character VIN');
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A123456' } });

      const makeSelect = screen.getByDisplayValue('Select Make');
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });

      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Corolla' } });

      const submitButton = screen.getByRole('button', { name: /Add Vehicle/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          'Failed to create vehicle. Please try again.'
        );
      });

      alertMock.mockRestore();
    });
  });

  describe('Form Submission (Update)', () => {
    const vehicle = mockVehicle({ id: 'vehicle-1' });

    it('submits PUT request when updating vehicle', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const editTabs = screen.getAllByText('Edit Vehicle');
      const editTab = editTabs[0]; // Tab is first, button is second
      fireEvent.click(editTab);

      const modelInput = screen.getByPlaceholderText('Enter model');
      fireEvent.change(modelInput, { target: { value: 'Camry' } });

      const submitButton = screen.getByRole('button', { name: /Update Vehicle/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles/vehicle-1',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('calls onSave when vehicle is successfully updated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const editTabs = screen.getAllByText('Edit Vehicle');
      const editTab = editTabs[0]; // Tab is first, button is second
      fireEvent.click(editTab);

      const submitButton = screen.getByRole('button', { name: /Update Vehicle/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Delete Functionality', () => {
    const vehicle = mockVehicle({ id: 'vehicle-1' });

    it('shows Delete button in details view', () => {
      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('shows confirmation dialog before deleting', () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(confirmMock).toHaveBeenCalledWith(
        'Are you sure you want to delete this vehicle? This action cannot be undone.'
      );

      confirmMock.mockRestore();
    });

    it('does not delete if user cancels confirmation', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();

      confirmMock.mockRestore();
    });

    it('sends DELETE request when confirmed', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles/vehicle-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      confirmMock.mockRestore();
    });

    it('calls onSave when vehicle is successfully deleted', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      confirmMock.mockRestore();
    });

    it('shows error alert when delete fails', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete' }),
      });

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to delete vehicle. Please try again.');
      });

      confirmMock.mockRestore();
      alertMock.mockRestore();
    });

    it('shows "Deleting..." text when delete is in progress', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
      });

      confirmMock.mockRestore();
    });

    it('disables Delete button when isSubmitting', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const deletingButton = screen.getByRole('button', { name: /Deleting.../i });
        expect(deletingButton).toBeDisabled();
      });

      confirmMock.mockRestore();
    });
  });

  describe('Tab Reset on Modal Open', () => {
    it('resets to details tab when modal reopens with vehicle', () => {
      const vehicle = mockVehicle();
      const { rerender } = render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const editTabs = screen.getAllByText('Edit Vehicle');
      const editTab = editTabs[0]; // Tab is first, button is second
      fireEvent.click(editTab);

      expect(editTab).toHaveClass('border-blue-500', 'text-blue-600');

      rerender(
        <VehicleModal
          isOpen={false}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      rerender(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const detailsTab = screen.getByText('Vehicle Details');
      expect(detailsTab).toHaveClass('border-blue-500', 'text-blue-600');
    });

    it('shows edit tab when modal opens without vehicle', () => {
      render(
        <VehicleModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByPlaceholderText('Enter 17-character VIN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Vehicle/i })).toBeInTheDocument();
    });
  });

  describe('Edit Vehicle Button', () => {
    it('shows Edit Vehicle button in details view', () => {
      const vehicle = mockVehicle();

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /Edit Vehicle/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it('switches to edit tab when Edit Vehicle button is clicked', () => {
      const vehicle = mockVehicle();

      render(
        <VehicleModal
          isOpen={true}
          vehicle={vehicle}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: /Edit Vehicle/i });
      const bottomEditButton = editButtons[editButtons.length - 1];
      fireEvent.click(bottomEditButton);

      const editTab = screen.getByText('Edit Vehicle');
      expect(editTab).toHaveClass('border-blue-500', 'text-blue-600');
    });
  });
});
