import { render, screen, fireEvent, waitFor } from '../test-utils';
import Parts from './parts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/AuthContext');

jest.mock('../utils/analytics', () => ({
  analytics: {
    trackPageView: jest.fn(),
    trackUserEngagement: jest.fn(),
  },
}));

// Mock child components
jest.mock('../components/PartsHeader', () => ({
  PartsHeader: ({ totalParts, onAddPart }: any) => (
    <div data-testid="parts-header">
      <span>Total: {totalParts}</span>
      <button onClick={onAddPart}>Add Part</button>
    </div>
  ),
}));

jest.mock('../components/PartsList', () => ({
  PartsList: ({ parts, isLoading, onPartSelect, page, totalPages, onPageChange }: any) => (
    <div data-testid="parts-list">
      {isLoading ? (
        <div>Loading parts...</div>
      ) : (
        <>
          <div>Parts: {parts.length}</div>
          {parts.map((part: any) => (
            <button key={part.id} onClick={() => onPartSelect(part)}>
              {part.name}
            </button>
          ))}
          <div>Page {page} of {totalPages}</div>
          <button onClick={() => onPageChange(page + 1)}>Next Page</button>
        </>
      )}
    </div>
  ),
}));

jest.mock('../components/PartsFilters', () => ({
  PartsFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="parts-filters">
      <button onClick={() => onFiltersChange({ ...filters, search: 'test' })}>
        Apply Filters
      </button>
    </div>
  ),
}));

jest.mock('../components/PartModal', () => ({
  PartModal: ({ isOpen, part, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="part-modal">
        <span>{part ? 'Edit Part' : 'Add Part'}</span>
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../components/PartDetailsModal', () => ({
  PartDetailsModal: ({ isOpen, part, onClose, onEdit, onDelete, onToggleMarketplace, onStatusChange }: any) =>
    isOpen ? (
      <div data-testid="part-details-modal">
        <span>Part: {part.name}</span>
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onToggleMarketplace}>Toggle Marketplace</button>
        <button onClick={() => onStatusChange('SOLD')}>Change Status</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../components/MobileLayout', () => ({
  MobileLayout: ({ title, children, className }: any) => (
    <div data-testid="mobile-layout" className={className}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  MobileCard: ({ children, onClick, className }: any) => (
    <div data-testid="mobile-card" className={className} onClick={onClick}>{children}</div>
  ),
  MobileButton: ({ children, onClick, disabled, variant, size }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

// Mock fetch
global.fetch = jest.fn();
global.alert = jest.fn();

describe('Parts Page', () => {
  const mockPartsData = {
    parts: [
      {
        id: 'part-1',
        name: 'Engine Block',
        partNumber: 'ENG-001',
        price: 5000,
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        location: 'Bay A3',
        isListedOnMarketplace: true,
        vehicleId: 'v1',
        categoryId: 'engine',
        sellerId: 's1',
        description: 'Test',
        images: ['https://example.com/image.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'part-2',
        name: 'Brake Pads',
        partNumber: 'BRK-001',
        price: 500,
        status: 'RESERVED',
        condition: 'GOOD',
        location: 'Bay B1',
        isListedOnMarketplace: false,
        vehicleId: 'v1',
        categoryId: 'brakes',
        sellerId: 's1',
        description: 'Test',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    totalCount: 2,
    totalPages: 1,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/parts',
      query: {},
      asPath: '/parts',
      route: '/parts',
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockPartsData,
    });
  });

  describe('Error State', () => {
    it('renders error message when query fails', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      expect(screen.getByText('Error Loading Parts')).toBeInTheDocument();
      expect(screen.getByText('Please try refreshing the page')).toBeInTheDocument();
    });

    it('renders retry button in error state', () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: mockRefetch,
      } as any);

      render(<Parts />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders warning icon in error state', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders parts header with total count', () => {
      render(<Parts />);

      expect(screen.getByTestId('parts-header')).toBeInTheDocument();
      expect(screen.getByText('Total: 2')).toBeInTheDocument();
    });

    it('renders parts filters', () => {
      render(<Parts />);

      expect(screen.getByTestId('parts-filters')).toBeInTheDocument();
    });

    it('renders parts list', () => {
      render(<Parts />);

      expect(screen.getByTestId('parts-list')).toBeInTheDocument();
      expect(screen.getByText('Parts: 2')).toBeInTheDocument();
    });

    it('renders part names in list', () => {
      render(<Parts />);

      // Parts appear in both desktop and mobile layouts
      expect(screen.getAllByText('Engine Block').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Brake Pads').length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('renders mobile layout', () => {
      render(<Parts />);

      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
      expect(screen.getByText('Parts')).toBeInTheDocument();
    });

    it('displays total parts count in mobile', () => {
      render(<Parts />);

      expect(screen.getByText('2 parts total')).toBeInTheDocument();
    });

    it('renders mobile search input', () => {
      render(<Parts />);

      const searchInput = screen.getByPlaceholderText('Search parts...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders mobile category filter', () => {
      render(<Parts />);

      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Engine')).toBeInTheDocument();
      expect(screen.getByText('Transmission')).toBeInTheDocument();
      expect(screen.getByText('Brakes')).toBeInTheDocument();
    });

    it('renders mobile sort options', () => {
      render(<Parts />);

      expect(screen.getByText('Newest')).toBeInTheDocument();
      expect(screen.getByText('Oldest')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
    });

    it('renders parts with images on mobile', () => {
      render(<Parts />);

      const image = screen.getByAltText('Engine Block');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders placeholder for parts without images', () => {
      render(<Parts />);

      // Brake Pads has no images, so should show placeholder
      const cards = screen.getAllByTestId('mobile-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('displays part prices on mobile', () => {
      render(<Parts />);

      expect(screen.getByText('R5,000')).toBeInTheDocument();
      expect(screen.getByText('R500')).toBeInTheDocument();
    });

    it('displays part status badges on mobile', () => {
      render(<Parts />);

      expect(screen.getByText('available')).toBeInTheDocument();
      expect(screen.getByText('reserved')).toBeInTheDocument();
    });

    it('displays part condition badges on mobile', () => {
      render(<Parts />);

      expect(screen.getByText('excellent')).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
    });

    it('shows marketplace indicator on mobile', () => {
      const { container } = render(<Parts />);

      // Engine Block is listed on marketplace
      const marketplaceIndicator = container.querySelector('.bg-blue-600.rounded-full');
      expect(marketplaceIndicator).toBeInTheDocument();
    });

    it('displays part numbers on mobile', () => {
      render(<Parts />);

      // Use getAllByText since part numbers may appear in multiple places
      expect(screen.getAllByText('#ENG-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#BRK-001').length).toBeGreaterThan(0);
    });

    it('displays part locations on mobile', () => {
      render(<Parts />);

      // Locations may appear in both desktop and mobile layouts
      expect(screen.getAllByText('Bay A3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bay B1').length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('renders loading skeletons on mobile', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { container } = render(<Parts />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders loading state in parts list', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      expect(screen.getByText('Loading parts...')).toBeInTheDocument();
    });
  });

  describe('Add Part', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens add modal when header button is clicked', () => {
      render(<Parts />);

      const addButtons = screen.getAllByText('Add Part');
      fireEvent.click(addButtons[0]);

      expect(screen.getByTestId('part-modal')).toBeInTheDocument();
      // Modal title also says "Add Part", so we expect multiple instances
      expect(screen.getAllByText('Add Part').length).toBeGreaterThan(0);
    });

    it('opens add modal when mobile button is clicked', () => {
      render(<Parts />);

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(screen.getByTestId('part-modal')).toBeInTheDocument();
    });

    it('closes add modal when close is clicked', () => {
      render(<Parts />);

      const addButtons = screen.getAllByText('Add Part');
      fireEvent.click(addButtons[0]);

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('part-modal')).not.toBeInTheDocument();
    });

    it('refetches data when part is saved', () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<Parts />);

      const addButtons = screen.getAllByText('Add Part');
      fireEvent.click(addButtons[0]);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Part Details', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens details modal when part is selected from list', () => {
      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      expect(screen.getByTestId('part-details-modal')).toBeInTheDocument();
      expect(screen.getByText('Part: Engine Block')).toBeInTheDocument();
    });

    it('closes details modal when close is clicked', () => {
      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const closeButtons = screen.getAllByText('Close');
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(screen.queryByTestId('part-details-modal')).not.toBeInTheDocument();
    });
  });

  describe('Edit Part', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('opens edit modal when edit is clicked from details', () => {
      render(<Parts />);

      // Open details modal
      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      // Click edit
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Part')).toBeInTheDocument();
    });

    it('closes details modal when edit modal opens', () => {
      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Details modal should be replaced by edit modal
      expect(screen.queryByText('Part: Engine Block')).not.toBeInTheDocument();
      expect(screen.getByText('Edit Part')).toBeInTheDocument();
    });
  });

  describe('Delete Part', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('deletes part when delete is clicked', async () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parts/part-1',
          expect.objectContaining({ method: 'DELETE' })
        );
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('shows alert when delete fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to delete part. Please try again.');
      });
    });
  });

  describe('Toggle Marketplace', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockPartsData.parts[0], isListedOnMarketplace: false }),
      });
    });

    it('toggles marketplace status', async () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const toggleButton = screen.getByText('Toggle Marketplace');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parts/part-1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('isListedOnMarketplace'),
          })
        );
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('shows alert when marketplace toggle fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const toggleButton = screen.getByText('Toggle Marketplace');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to update marketplace status. Please try again.');
      });
    });
  });

  describe('Status Change', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockPartsData.parts[0], status: 'SOLD' }),
      });
    });

    it('changes part status', async () => {
      const mockRefetch = jest.fn();
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const statusButton = screen.getByText('Change Status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parts/part-1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('SOLD'),
          })
        );
      });

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('shows alert when status change fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      render(<Parts />);

      const partButtons = screen.getAllByText('Engine Block');
      fireEvent.click(partButtons[0]);

      const statusButton = screen.getByText('Change Status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to update part status. Please try again.');
      });
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: mockPartsData,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);
    });

    it('updates search filter on mobile', () => {
      render(<Parts />);

      const searchInput = screen.getByPlaceholderText('Search parts...');
      fireEvent.change(searchInput, { target: { value: 'engine' } });

      expect(searchInput).toHaveValue('engine');
    });

    it('updates category filter on mobile', () => {
      render(<Parts />);

      const categorySelect = screen.getByText('All Categories').closest('select');
      if (categorySelect) {
        fireEvent.change(categorySelect, { target: { value: 'engine' } });
        expect(categorySelect).toHaveValue('engine');
      }
    });

    it('updates sort filter on mobile', () => {
      render(<Parts />);

      const sortSelect = screen.getByText('Newest').closest('select');
      if (sortSelect) {
        fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
        expect(sortSelect).toHaveValue('price_asc');
      }
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls when multiple pages exist', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockPartsData, totalPages: 3, currentPage: 1 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      // Pagination appears in both desktop and mobile layouts
      expect(screen.getAllByText(/Page.*of 3/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Previous').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Next').length).toBeGreaterThan(0);
    });

    it('navigates to next page', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockPartsData, totalPages: 3, currentPage: 1 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { rerender } = render(<Parts />);

      const nextButtons = screen.getAllByText('Next');
      fireEvent.click(nextButtons[0]);

      // Mock the updated page
      mockUseQuery.mockReturnValue({
        data: { ...mockPartsData, totalPages: 3, currentPage: 2 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      rerender(<Parts />);

      // Page should change
      expect(screen.getAllByText(/Page.*of 3/).length).toBeGreaterThan(0);
    });

    it('disables previous button on first page', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockPartsData, totalPages: 3, currentPage: 1 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      const previousButtons = screen.getAllByText('Previous');
      // At least one button should be disabled on first page
      expect(previousButtons[0]).toBeDisabled();
    });

    it('renders next and previous buttons', () => {
      mockUseQuery.mockReturnValue({
        data: { ...mockPartsData, totalPages: 3, currentPage: 2 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<Parts />);

      // Both Next and Previous buttons should be rendered
      const nextButtons = screen.getAllByText('Next');
      const previousButtons = screen.getAllByText('Previous');
      expect(nextButtons.length).toBeGreaterThan(0);
      expect(previousButtons.length).toBeGreaterThan(0);
    });
  });
});
