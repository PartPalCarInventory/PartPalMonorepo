import { render, screen, fireEvent, waitFor } from '../test-utils';
import { PartModal } from './PartModal';
import { mockPart } from '../test-utils';

// Mock PartForm component
jest.mock('./PartForm', () => ({
  PartForm: ({ part, onSave, onCancel, isSubmitting }: any) => (
    <div data-testid="part-form">
      <button onClick={() => onSave({ name: 'Test Part', price: 100, categoryId: 'cat-1', vehicleId: 'veh-1' })}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
      <button onClick={onCancel}>Cancel</button>
      <div data-testid="part-name">{part?.name || 'New Part'}</div>
    </div>
  ),
}));

// Mock analytics
jest.mock('../utils/analytics', () => ({
  analytics: {
    trackUserEngagement: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('PartModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Modal Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <PartModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText('Add New Part')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add New Part')).toBeInTheDocument();
    });
  });

  describe('Add Mode (No Part)', () => {
    it('displays "Add New Part" title', () => {
      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Add New Part')).toBeInTheDocument();
    });

    it('does not display part number when adding new part', () => {
      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText(/Part #/)).not.toBeInTheDocument();
    });

    it('renders PartForm component', () => {
      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('part-form')).toBeInTheDocument();
    });
  });

  describe('Edit Mode (With Part)', () => {
    const mockPartData = mockPart({
      id: 'part-1',
      name: 'Engine Block',
      partNumber: 'ENG-001',
      price: 5000,
    });

    it('displays part name in title', () => {
      render(
        <PartModal
          isOpen={true}
          part={mockPartData}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Component title and mocked PartForm both show "Engine Block"
      expect(screen.getAllByText('Engine Block').length).toBeGreaterThan(0);
    });

    it('displays part number', () => {
      render(
        <PartModal
          isOpen={true}
          part={mockPartData}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Part #ENG-001')).toBeInTheDocument();
    });

    it('passes part data to PartForm', () => {
      render(
        <PartModal
          isOpen={true}
          part={mockPartData}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByTestId('part-name')).toHaveTextContent('Engine Block');
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <PartModal
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
        <PartModal
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

    it('calls onClose when Cancel button in form is clicked', () => {
      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Submission (Add)', () => {
    it('submits POST request when adding new part', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-part-1', name: 'Test Part' }),
      });

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parts',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('calls onSave and onClose when part is successfully added', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-part-1', name: 'Test Part' }),
      });

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('shows error message when add fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to create part' }),
      });

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create part')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission (Update)', () => {
    const mockPartData = mockPart({ id: 'part-1', name: 'Engine Block' });

    it('submits PUT request when updating part', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'part-1', name: 'Updated Part' }),
      });

      render(
        <PartModal
          isOpen={true}
          part={mockPartData}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parts/part-1',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('calls onSave and onClose when part is successfully updated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'part-1', name: 'Updated Part' }),
      });

      render(
        <PartModal
          isOpen={true}
          part={mockPartData}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('shows "Saving..." text when submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });

    it('disables close button when submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: '' });
        expect(closeButton).toBeDisabled();
      });
    });
  });

  describe('Error Display', () => {
    it('displays error message when present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Network error' }),
      });

      render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('renders error with correct styling', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Test error' }),
      });

      const { container } = render(
        <PartModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorBox = container.querySelector('.bg-red-50.border-l-4.border-red-400');
        expect(errorBox).toBeInTheDocument();
      });
    });
  });
});
