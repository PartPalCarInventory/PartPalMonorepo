import { render, screen, fireEvent, waitFor } from '../test-utils';
import { VehiclePartsList } from './VehiclePartsList';
import { mockPart } from '../test-utils';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('VehiclePartsList', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner while fetching parts', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      expect(screen.getByText('Loading parts...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('Error loading parts')).toBeInTheDocument();
        expect(screen.getByText('Please try again later.')).toBeInTheDocument();
      });
    });

    it('renders error icon', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { container } = render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const errorIcon = container.querySelector('svg.text-red-400');
        expect(errorIcon).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no parts found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: [] }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('No parts found')).toBeInTheDocument();
        expect(screen.getByText('This vehicle has no parts in the inventory yet.')).toBeInTheDocument();
      });
    });

    it('shows "Add Parts" link in empty state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: [] }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const addPartsLink = screen.getByText('Add Parts');
        expect(addPartsLink).toBeInTheDocument();
        expect(addPartsLink.closest('a')).toHaveAttribute('href', '/parts');
      });
    });
  });

  describe('Parts Display', () => {
    const mockParts = [
      mockPart({
        id: 'part-1',
        name: 'Brake Pad Set',
        partNumber: 'BP-001',
        price: 500,
        status: 'AVAILABLE',
        condition: 'GOOD',
        images: ['https://example.com/brake-pad.jpg'],
        location: 'Shelf A1',
        isListedOnMarketplace: true,
      }),
      mockPart({
        id: 'part-2',
        name: 'Oil Filter',
        partNumber: 'OF-002',
        price: 150,
        status: 'RESERVED',
        condition: 'NEW',
        images: [],
        location: 'Shelf B2',
        isListedOnMarketplace: false,
      }),
      mockPart({
        id: 'part-3',
        name: 'Air Filter',
        price: 200,
        status: 'SOLD',
        condition: 'EXCELLENT',
      }),
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: mockParts }),
      } as Response);
    });

    it('displays parts count', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('parts found')).toBeInTheDocument();
      });
    });

    it('displays singular "part" for single item', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: [mockParts[0]] }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('part found')).toBeInTheDocument();
      });
    });

    it('renders all parts in the list', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('Brake Pad Set')).toBeInTheDocument();
        expect(screen.getByText('Oil Filter')).toBeInTheDocument();
        expect(screen.getByText('Air Filter')).toBeInTheDocument();
      });
    });

    it('displays part numbers', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('Part #BP-001')).toBeInTheDocument();
        expect(screen.getByText('Part #OF-002')).toBeInTheDocument();
      });
    });

    it('displays part prices in ZAR format', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText(/R\s?500/)).toBeInTheDocument();
        expect(screen.getByText(/R\s?150/)).toBeInTheDocument();
        expect(screen.getByText(/R\s?200/)).toBeInTheDocument();
      });
    });

    it('displays part images when available', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const image = screen.getByAltText('Brake Pad Set');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/brake-pad.jpg');
      });
    });

    it('shows placeholder icon when no images', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const placeholders = document.querySelectorAll('.bg-gray-100.flex.items-center');
        expect(placeholders.length).toBeGreaterThan(0);
      });
    });

    it('displays status badges with correct colors', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('available')).toHaveClass('bg-green-100', 'text-green-800');
        expect(screen.getByText('reserved')).toHaveClass('bg-yellow-100', 'text-yellow-800');
        expect(screen.getByText('sold')).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('displays condition badges with correct colors', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const badges = screen.getAllByText('good');
        expect(badges[0]).toHaveClass('bg-yellow-100', 'text-yellow-800');

        expect(screen.getByText('new')).toHaveClass('bg-green-100', 'text-green-800');
        expect(screen.getByText('excellent')).toHaveClass('bg-blue-100', 'text-blue-800');
      });
    });

    it('shows marketplace badge for listed parts', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const marketplaceBadges = screen.getAllByText('On Marketplace');
        expect(marketplaceBadges.length).toBeGreaterThan(0);
        expect(marketplaceBadges[0]).toHaveClass('bg-blue-100', 'text-blue-800');
      });
    });

    it('displays location when available', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('Location: Shelf A1')).toBeInTheDocument();
        expect(screen.getByText('Location: Shelf B2')).toBeInTheDocument();
      });
    });

    it('renders View Details links for each part', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const viewDetailsLinks = screen.getAllByText('View Details');
        expect(viewDetailsLinks).toHaveLength(3);

        expect(viewDetailsLinks[0].closest('a')).toHaveAttribute('href', '/parts?id=part-1');
        expect(viewDetailsLinks[1].closest('a')).toHaveAttribute('href', '/parts?id=part-2');
        expect(viewDetailsLinks[2].closest('a')).toHaveAttribute('href', '/parts?id=part-3');
      });
    });
  });

  describe('Sorting', () => {
    const mockParts = [
      mockPart({ id: 'part-1', name: 'Brake Pad', price: 500 }),
      mockPart({ id: 'part-2', name: 'Air Filter', price: 200 }),
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: mockParts }),
      } as Response);
    });

    it('renders sort dropdown', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
      });
    });

    it('shows all sort options', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('Newest First')).toBeInTheDocument();
        expect(screen.getByText('Name A-Z')).toBeInTheDocument();
        expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
      });
    });

    it('refetches data when sort option changes', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('Newest First');
      fireEvent.change(sortSelect, { target: { value: 'name' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortBy=name')
        );
      });
    });

    it('includes vehicleId in fetch request', async () => {
      render(<VehiclePartsList vehicleId="test-vehicle-123" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('vehicleId=test-vehicle-123')
        );
      });
    });
  });

  describe('Footer', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: [mockPart()] }),
      } as Response);
    });

    it('renders "View All Parts" link', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const viewAllLink = screen.getByText('View All Parts');
        expect(viewAllLink).toBeInTheDocument();
        expect(viewAllLink.closest('a')).toHaveAttribute('href', '/parts');
      });
    });
  });

  describe('Currency Formatting', () => {
    it('formats prices without decimals', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          parts: [mockPart({ price: 1234.56 })],
        }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        // Should format as R 1,235 (rounded, no decimals)
        expect(screen.getByText(/R\s?1\s?235/)).toBeInTheDocument();
      });
    });
  });

  describe('Badge Color Functions', () => {
    it('handles all status types correctly', async () => {
      const parts = [
        mockPart({ id: '1', status: 'AVAILABLE' }),
        mockPart({ id: '2', status: 'RESERVED' }),
        mockPart({ id: '3', status: 'SOLD' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('available')).toBeInTheDocument();
        expect(screen.getByText('reserved')).toBeInTheDocument();
        expect(screen.getByText('sold')).toBeInTheDocument();
      });
    });

    it('handles all condition types correctly', async () => {
      const parts = [
        mockPart({ id: '1', condition: 'NEW' }),
        mockPart({ id: '2', condition: 'EXCELLENT' }),
        mockPart({ id: '3', condition: 'GOOD' }),
        mockPart({ id: '4', condition: 'FAIR' }),
        mockPart({ id: '5', condition: 'POOR' }),
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts }),
      } as Response);

      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        expect(screen.getByText('new')).toBeInTheDocument();
        expect(screen.getByText('excellent')).toBeInTheDocument();
        const goodBadges = screen.getAllByText('good');
        expect(goodBadges.length).toBeGreaterThan(0);
        expect(screen.getByText('fair')).toBeInTheDocument();
        expect(screen.getByText('poor')).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parts: [mockPart()] }),
      } as Response);
    });

    it('applies hover styles to part cards', async () => {
      render(<VehiclePartsList vehicleId="vehicle-1" />);

      await waitFor(() => {
        const partCard = document.querySelector('.hover\\:border-blue-300');
        expect(partCard).toBeInTheDocument();
      });
    });
  });
});
