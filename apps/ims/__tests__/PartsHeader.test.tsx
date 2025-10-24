import { render, screen, fireEvent } from '../test-utils';
import { PartsHeader } from './PartsHeader';

// Mock UserMenu component
jest.mock('./UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

describe('PartsHeader', () => {
  const mockOnAddPart = jest.fn();
  const mockOnBulkAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.print = jest.fn();
  });

  describe('Header Content', () => {
    it('renders the main title', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText('Parts Inventory')).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText(/Manage your parts inventory/i)).toBeInTheDocument();
    });

    it('renders user menu', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  describe('Parts Count Display', () => {
    it('displays total parts count', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText(/250 parts in inventory/i)).toBeInTheDocument();
    });

    it('formats large numbers with commas', () => {
      render(
        <PartsHeader
          totalParts={5000}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText(/5,000 parts in inventory/i)).toBeInTheDocument();
    });

    it('handles zero parts', () => {
      render(
        <PartsHeader
          totalParts={0}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText(/0 parts in inventory/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders Bulk Actions button', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByRole('button', { name: /Bulk Actions/i })).toBeInTheDocument();
    });

    it('renders Export button', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    it('renders Add Part button', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByRole('button', { name: /Add Part/i })).toBeInTheDocument();
    });

    it('calls window.print when Export button is clicked', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);

      expect(global.print).toHaveBeenCalledTimes(1);
    });

    it('calls onAddPart when Add Part button is clicked', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const addButton = screen.getByRole('button', { name: /Add Part/i });
      fireEvent.click(addButton);

      expect(mockOnAddPart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bulk Actions Bar', () => {
    it('does not show bulk actions bar by default', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.queryByText('Select parts to perform bulk actions')).not.toBeInTheDocument();
    });

    it('shows bulk actions bar when Bulk Actions button is clicked', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      expect(screen.getByText('Select parts to perform bulk actions')).toBeInTheDocument();
    });

    it('hides bulk actions bar when clicked again', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });

      // Show
      fireEvent.click(bulkActionsButton);
      expect(screen.getByText('Select parts to perform bulk actions')).toBeInTheDocument();

      // Hide
      fireEvent.click(bulkActionsButton);
      expect(screen.queryByText('Select parts to perform bulk actions')).not.toBeInTheDocument();
    });

    it('renders all bulk action buttons', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      expect(screen.getByRole('button', { name: /Reserve Selected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Publish to Marketplace/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Prices/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Selected/i })).toBeInTheDocument();
    });

    it('calls onBulkAction with reserve action', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      const reserveButton = screen.getByRole('button', { name: /Reserve Selected/i });
      fireEvent.click(reserveButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('reserve', []);
    });

    it('calls onBulkAction with publish action', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      const publishButton = screen.getByRole('button', { name: /Publish to Marketplace/i });
      fireEvent.click(publishButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('publish', []);
    });

    it('calls onBulkAction with updatePrice action', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      const updatePricesButton = screen.getByRole('button', { name: /Update Prices/i });
      fireEvent.click(updatePricesButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('updatePrice', []);
    });

    it('calls onBulkAction with delete action', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });
      fireEvent.click(bulkActionsButton);

      const deleteButton = screen.getByRole('button', { name: /Delete Selected/i });
      fireEvent.click(deleteButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('delete', []);
    });
  });

  describe('Quick Stats Section', () => {
    it('renders all stat labels', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText('Total Parts')).toBeInTheDocument();
      expect(screen.getByText('Ready to Sell')).toBeInTheDocument();
      expect(screen.getByText('Customer Hold')).toBeInTheDocument();
      expect(screen.getByText('On Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Completed Sales')).toBeInTheDocument();
    });

    it('renders status indicators', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Reserved')).toBeInTheDocument();
      expect(screen.getByText('Listed')).toBeInTheDocument();
      expect(screen.getByText('Sold')).toBeInTheDocument();
    });

    it('displays total parts in quick stats', () => {
      render(
        <PartsHeader
          totalParts={350}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const totalPartsElements = screen.getAllByText('350');
      expect(totalPartsElements.length).toBeGreaterThan(0);
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct color classes to status indicators', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      expect(screen.getByText('Available')).toHaveClass('text-green-600');
      expect(screen.getByText('Reserved')).toHaveClass('text-yellow-600');
      expect(screen.getByText('Listed')).toHaveClass('text-blue-600');
      expect(screen.getByText('Sold')).toHaveClass('text-red-600');
    });

    it('highlights bulk actions button when active', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const bulkActionsButton = screen.getByRole('button', { name: /Bulk Actions/i });

      // Before click
      expect(bulkActionsButton).not.toHaveClass('bg-blue-50');

      // After click
      fireEvent.click(bulkActionsButton);
      expect(bulkActionsButton).toHaveClass('bg-blue-50');
    });

    it('renders badge with correct styling', () => {
      render(
        <PartsHeader
          totalParts={250}
          onAddPart={mockOnAddPart}
          onBulkAction={mockOnBulkAction}
        />
      );

      const badge = screen.getByText(/250 parts in inventory/i);
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });
});
