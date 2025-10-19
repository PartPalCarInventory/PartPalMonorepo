import { render, screen, fireEvent, waitFor } from '../test-utils';
import { PartDetailsModal } from './PartDetailsModal';
import { mockPart } from '../test-utils';

// Mock analytics
jest.mock('../utils/analytics', () => ({
  analytics: {
    trackUserEngagement: jest.fn(),
  },
}));

describe('PartDetailsModal', () => {
  const mockPart = {
    id: 'part-1',
    vehicleId: 'vehicle-1',
    name: 'Engine Block',
    partNumber: 'ENG-001',
    description: 'V6 engine block in excellent condition',
    condition: 'EXCELLENT' as const,
    price: 5000,
    location: 'Bay A3',
    categoryId: 'engine',
    status: 'AVAILABLE' as const,
    isListedOnMarketplace: false,
    images: ['https://example.com/engine.jpg'],
    weight: 150,
    warranty: 6,
    dimensions: { length: 80, width: 60, height: 70 },
    installationNotes: 'Requires professional installation',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10'),
    sellerId: 'seller-1',
  };

  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleMarketplace = jest.fn();
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnToggleMarketplace.mockResolvedValue(undefined);
    mockOnStatusChange.mockResolvedValue(undefined);
  });

  describe('Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={false}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.queryByText('Engine Block')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Engine Block')).toBeInTheDocument();
    });
  });

  describe('Part Information', () => {
    beforeEach(() => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );
    });

    it('displays part name', () => {
      expect(screen.getByText('Engine Block')).toBeInTheDocument();
    });

    it('displays part number', () => {
      expect(screen.getByText(/Part Number: ENG-001/i)).toBeInTheDocument();
    });

    it('displays price', () => {
      expect(screen.getByText(/R 5 000/)).toBeInTheDocument();
    });

    it('displays description', () => {
      expect(screen.getByText('V6 engine block in excellent condition')).toBeInTheDocument();
    });

    it('displays condition', () => {
      expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
    });

    it('displays location', () => {
      expect(screen.getByText('Bay A3')).toBeInTheDocument();
    });
  });

  describe('Specifications', () => {
    it('displays weight when provided', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('150 kg')).toBeInTheDocument();
    });

    it('displays warranty when provided', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('6 months')).toBeInTheDocument();
    });

    it('displays dimensions when provided', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('80 × 60 × 70 cm')).toBeInTheDocument();
    });

    it('displays installation notes when provided', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Requires professional installation')).toBeInTheDocument();
    });
  });

  describe('Images', () => {
    it('displays images when available', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const image = screen.getByAltText('Engine Block - 1');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/engine.jpg');
    });

    it('displays placeholder when no images available', () => {
      const partWithoutImages = { ...mockPart, images: [] };
      const { container } = render(
        <PartDetailsModal
          part={partWithoutImages}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const placeholder = container.querySelector('.bg-gray-100');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );
    });

    it('renders Edit button', () => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('calls onEdit when Edit button is clicked', () => {
      fireEvent.click(screen.getByText('Edit'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('renders Delete button', () => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('renders marketplace toggle button with correct text when not listed', () => {
      expect(screen.getByText('Publish to Marketplace')).toBeInTheDocument();
    });

    it('renders marketplace toggle button with correct text when listed', () => {
      const listedPart = { ...mockPart, isListedOnMarketplace: true };
      render(
        <PartDetailsModal
          part={listedPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Remove from Marketplace')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const closeButtons = screen.getAllByRole('button');
      const headerCloseButton = closeButtons.find(btn =>
        btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]')
      );

      if (headerCloseButton) {
        fireEvent.click(headerCloseButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Close footer button is clicked', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByText('Close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when background overlay is clicked', () => {
      const { container } = render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const overlay = container.querySelector('.bg-gray-500.bg-opacity-75');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Delete Confirmation', () => {
    beforeEach(() => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );
    });

    it('does not show delete confirmation by default', () => {
      expect(screen.queryByText('Are you sure you want to delete this part?')).not.toBeInTheDocument();
    });

    it('shows delete confirmation when Delete button is clicked', () => {
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText(/Are you sure you want to delete this part/i)).toBeInTheDocument();
    });

    it('calls onDelete when confirmed', () => {
      fireEvent.click(screen.getByText('Delete'));
      fireEvent.click(screen.getByText('Yes, Delete'));
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('hides confirmation when Cancel is clicked', () => {
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText(/Are you sure you want to delete this part/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText(/Are you sure you want to delete this part/i)).not.toBeInTheDocument();
    });
  });

  describe('Status Change', () => {
    it('renders status dropdown with current status', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const statusSelect = screen.getByDisplayValue('Available');
      expect(statusSelect).toBeInTheDocument();
    });

    it('calls onStatusChange when status is changed', async () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const statusSelect = screen.getByDisplayValue('Available');
      fireEvent.change(statusSelect, { target: { value: 'SOLD' } });

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith('SOLD');
      });
    });
  });

  describe('Marketplace Toggle', () => {
    it('calls onToggleMarketplace when button is clicked', async () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      fireEvent.click(screen.getByText('Publish to Marketplace'));

      await waitFor(() => {
        expect(mockOnToggleMarketplace).toHaveBeenCalledTimes(1);
      });
    });

    it('disables marketplace button while updating', async () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      const button = screen.getByText('Publish to Marketplace');
      fireEvent.click(button);

      // Button should be disabled while updating
      expect(button).toBeDisabled();
    });
  });

  describe('Marketplace Status', () => {
    it('shows correct marketplace status when not listed', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('This part is not listed on the marketplace')).toBeInTheDocument();
    });

    it('shows correct marketplace status when listed', () => {
      const listedPart = { ...mockPart, isListedOnMarketplace: true };
      render(
        <PartDetailsModal
          part={listedPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('This part is currently listed on the marketplace')).toBeInTheDocument();
    });
  });

  describe('Metadata', () => {
    beforeEach(() => {
      render(
        <PartDetailsModal
          part={mockPart}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onToggleMarketplace={mockOnToggleMarketplace}
          onStatusChange={mockOnStatusChange}
        />
      );
    });

    it('displays part ID', () => {
      expect(screen.getByText('part-1')).toBeInTheDocument();
    });

    it('displays category ID', () => {
      expect(screen.getByText('engine')).toBeInTheDocument();
    });

    it('displays created date', () => {
      expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
    });

    it('displays updated date', () => {
      expect(screen.getByText(/1\/10\/2025/)).toBeInTheDocument();
    });
  });
});
