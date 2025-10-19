import { render, screen, fireEvent } from '../test-utils';
import { PartsList } from './PartsList';
import { mockPart } from '../test-utils';

describe('PartsList', () => {
  const mockOnPartSelect = jest.fn();
  const mockOnBulkAction = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      const { container } = render(
        <PartsList
          parts={[]}
          isLoading={true}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
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
    it('renders empty state when no parts', () => {
      render(
        <PartsList
          parts={[]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('No parts found')).toBeInTheDocument();
      expect(screen.getByText(/Get started by adding parts/i)).toBeInTheDocument();
    });
  });

  describe('Parts Display - Grid View', () => {
    const mockParts = [
      mockPart({
        id: 'part-1',
        name: 'Front Bumper',
        partNumber: 'FB-001',
        price: 500,
        condition: 'GOOD',
        status: 'AVAILABLE',
        location: 'A1-B2',
        images: ['https://example.com/part1.jpg'],
        isListedOnMarketplace: true,
      }),
      mockPart({
        id: 'part-2',
        name: 'Alternator',
        partNumber: 'ALT-002',
        price: 350,
        condition: 'EXCELLENT',
        status: 'RESERVED',
        location: 'C3-D4',
        images: [],
        isListedOnMarketplace: false,
      }),
    ];

    it('renders all parts in grid view by default', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Front Bumper')).toBeInTheDocument();
      expect(screen.getByText('Alternator')).toBeInTheDocument();
    });

    it('displays part numbers', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('#FB-001')).toBeInTheDocument();
      expect(screen.getByText('#ALT-002')).toBeInTheDocument();
    });

    it('displays prices in ZAR format', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      // Check for price values (may have space or other formatting)
      expect(screen.getByText(/R\s?500/)).toBeInTheDocument();
      expect(screen.getByText(/R\s?350/)).toBeInTheDocument();
    });

    it('displays status badges', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Reserved')).toBeInTheDocument();
    });

    it('displays condition badges', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('displays location', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('A1-B2')).toBeInTheDocument();
      expect(screen.getByText('C3-D4')).toBeInTheDocument();
    });

    it('shows marketplace indicator for listed parts', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Listed on marketplace')).toBeInTheDocument();
    });

    it('renders part image when provided', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const image = screen.getByAltText('Front Bumper');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/part1.jpg');
    });

    it('renders placeholder when no image provided', () => {
      const { container } = render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const placeholders = container.querySelectorAll('svg');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Status Color Coding', () => {
    it('applies green color for AVAILABLE status', () => {
      const part = mockPart({ status: 'AVAILABLE' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Available');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies yellow color for RESERVED status', () => {
      const part = mockPart({ status: 'RESERVED' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Reserved');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('applies red color for SOLD status', () => {
      const part = mockPart({ status: 'SOLD' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Sold');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Condition Color Coding', () => {
    it('applies green color for NEW condition', () => {
      const part = mockPart({ condition: 'NEW' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('applies blue color for EXCELLENT condition', () => {
      const part = mockPart({ condition: 'EXCELLENT' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Excellent');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('applies red color for POOR condition', () => {
      const part = mockPart({ condition: 'POOR' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const badge = screen.getByText('Poor');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Selection Functionality', () => {
    const mockParts = [
      mockPart({ id: 'part-1', name: 'Part 1' }),
      mockPart({ id: 'part-2', name: 'Part 2' }),
      mockPart({ id: 'part-3', name: 'Part 3' }),
    ];

    it('renders checkboxes for each part', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3);
    });

    it('selects part when checkbox is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('shows selection count when parts are selected', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('shows bulk action buttons when parts are selected', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(screen.getByText('Reserve')).toBeInTheDocument();
      expect(screen.getByText('Publish')).toBeInTheDocument();
    });

    it('calls onBulkAction when Reserve is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      const reserveButton = screen.getByText('Reserve');
      fireEvent.click(reserveButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('reserve', ['part-1']);
    });

    it('calls onBulkAction when Publish is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      const publishButton = screen.getByText('Publish');
      fireEvent.click(publishButton);

      expect(mockOnBulkAction).toHaveBeenCalledWith('publish', ['part-1', 'part-2']);
    });
  });

  describe('Select All Functionality', () => {
    const mockParts = [
      mockPart({ id: 'part-1', name: 'Part 1' }),
      mockPart({ id: 'part-2', name: 'Part 2' }),
    ];

    it('shows Select All button', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('selects all parts when Select All is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    it('changes to Deselect All when all parts are selected', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('deselects all parts when Deselect All is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      const deselectAllButton = screen.getByText('Deselect All');
      fireEvent.click(deselectAllButton);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('View Mode Toggle', () => {
    const mockParts = [
      mockPart({ id: 'part-1', name: 'Part 1' }),
    ];

    it('shows grid view by default', () => {
      const { container } = render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('switches to list view when list button is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      const listViewButton = buttons.find(btn =>
        btn.className.includes('rounded-r-md')
      );

      if (listViewButton) {
        fireEvent.click(listViewButton);
        expect(screen.getByRole('table')).toBeInTheDocument();
      }
    });
  });

  describe('User Interactions', () => {
    it('calls onPartSelect when part card is clicked', () => {
      const part = mockPart({ name: 'Test Part' });

      render(
        <PartsList
          parts={[part]}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      const partCard = screen.getByText('Test Part');
      fireEvent.click(partCard);

      expect(mockOnPartSelect).toHaveBeenCalledWith(part);
    });
  });

  describe('Pagination', () => {
    const mockParts = [mockPart()];

    it('does not render pagination when totalPages is 1', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
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
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getAllByText('Previous').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Next').length).toBeGreaterThan(0);
    });

    it('disables Previous button on first page', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
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
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
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

    it('calls onPageChange when Next is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={1}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getAllByText('Next')[0];
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when Previous is clicked', () => {
      render(
        <PartsList
          parts={mockParts}
          isLoading={false}
          onPartSelect={mockOnPartSelect}
          onBulkAction={mockOnBulkAction}
          page={2}
          totalPages={3}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getAllByText('Previous')[0];
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });
  });
});
