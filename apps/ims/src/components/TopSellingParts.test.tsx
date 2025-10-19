import { render, screen } from '../test-utils';
import { TopSellingParts } from './TopSellingParts';
import { mockPart } from '../test-utils';

describe('TopSellingParts', () => {
  const mockPartsData = [
    {
      part: mockPart({
        id: '1',
        name: 'Engine Block',
        partNumber: 'ENG-001',
        price: 5000,
        condition: 'EXCELLENT',
        images: ['https://example.com/engine.jpg'],
      }),
      salesCount: 25,
    },
    {
      part: mockPart({
        id: '2',
        name: 'Brake Pads',
        partNumber: 'BRK-002',
        price: 500,
        condition: 'GOOD',
        images: [],
      }),
      salesCount: 15,
    },
    {
      part: mockPart({
        id: '3',
        name: 'Air Filter',
        partNumber: 'AIR-003',
        price: 200,
        condition: 'NEW',
        images: ['https://example.com/filter.jpg'],
      }),
      salesCount: 10,
    },
  ];

  describe('Empty State', () => {
    it('renders empty state when no parts provided', () => {
      render(<TopSellingParts parts={[]} />);

      expect(screen.getByText('No sales data')).toBeInTheDocument();
      expect(screen.getByText(/Get started by listing some parts for sale/i)).toBeInTheDocument();
    });

    it('renders empty state when parts is undefined', () => {
      render(<TopSellingParts parts={null as any} />);

      expect(screen.getByText('No sales data')).toBeInTheDocument();
    });
  });

  describe('Rendering Parts', () => {
    it('renders all parts with correct information', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      // Component renders both mobile and desktop layouts
      expect(screen.getAllByText('Engine Block').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Brake Pads').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Air Filter').length).toBeGreaterThan(0);
    });

    it('displays part numbers', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      // Component renders both mobile and desktop layouts
      expect(screen.getAllByText('#ENG-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#BRK-002').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#AIR-003').length).toBeGreaterThan(0);
    });

    it('displays sales count for each part', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      const soldLabels = screen.getAllByText('Sold');
      expect(soldLabels.length).toBeGreaterThan(0);

      // Component renders both mobile and desktop layouts
      expect(screen.getAllByText('25').length).toBeGreaterThan(0);
      expect(screen.getAllByText('15').length).toBeGreaterThan(0);
      expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    });

    it('displays prices in ZAR currency format', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      expect(screen.getAllByText(/R\s*5\s*000/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/R\s*500/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/R\s*200/).length).toBeGreaterThan(0);
    });

    it('calculates and displays revenue correctly', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      // R5000 * 25 = R125,000
      expect(screen.getAllByText(/R\s*125\s*000/).length).toBeGreaterThan(0);
      // R500 * 15 = R7,500
      expect(screen.getAllByText(/R\s*7\s*500/).length).toBeGreaterThan(0);
      // R200 * 10 = R2,000
      expect(screen.getAllByText(/R\s*2\s*000/).length).toBeGreaterThan(0);
    });
  });

  describe('Condition Display', () => {
    it('displays condition badges with correct formatting', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Good').length).toBeGreaterThan(0);
      expect(screen.getAllByText('New').length).toBeGreaterThan(0);
    });

    it('applies correct condition colors', () => {
      const { container } = render(<TopSellingParts parts={mockPartsData} />);

      const newBadges = container.querySelectorAll('.bg-green-100.text-green-800');
      const excellentBadges = container.querySelectorAll('.bg-blue-100.text-blue-800');
      const goodBadges = container.querySelectorAll('.bg-yellow-100.text-yellow-800');

      expect(newBadges.length).toBeGreaterThan(0);
      expect(excellentBadges.length).toBeGreaterThan(0);
      expect(goodBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Ranking Display', () => {
    it('displays rank badges for all parts', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });

    it('applies gold color to first place', () => {
      const { container } = render(<TopSellingParts parts={mockPartsData} />);

      const goldBadges = container.querySelectorAll('.bg-yellow-400.text-yellow-900');
      expect(goldBadges.length).toBeGreaterThan(0);
    });

    it('applies silver color to second place', () => {
      const { container } = render(<TopSellingParts parts={mockPartsData} />);

      const silverBadges = container.querySelectorAll('.bg-gray-300.text-gray-800');
      expect(silverBadges.length).toBeGreaterThan(0);
    });

    it('applies bronze color to third place', () => {
      const { container } = render(<TopSellingParts parts={mockPartsData} />);

      const bronzeBadges = container.querySelectorAll('.bg-orange-400.text-orange-900');
      expect(bronzeBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Image Display', () => {
    it('renders part image when available', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      const images = screen.getAllByRole('img');
      const engineImage = images.find(img => img.getAttribute('alt') === 'Engine Block');
      const filterImage = images.find(img => img.getAttribute('alt') === 'Air Filter');

      expect(engineImage).toBeInTheDocument();
      expect(filterImage).toBeInTheDocument();
    });

    it('renders placeholder icon when no image available', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      const placeholders = screen.getAllByRole('img', { hidden: true });
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('View All Link', () => {
    it('renders "View All Sales Reports" link', () => {
      render(<TopSellingParts parts={mockPartsData} />);

      const link = screen.getByText('View All Sales Reports');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/reports');
    });
  });

  describe('Responsive Layout', () => {
    it('renders both mobile and desktop layouts', () => {
      const { container } = render(<TopSellingParts parts={mockPartsData} />);

      // Mobile layout (flex lg:hidden)
      const mobileLayouts = container.querySelectorAll('.flex.lg\\:hidden');
      expect(mobileLayouts.length).toBeGreaterThan(0);

      // Desktop layout (hidden lg:flex)
      const desktopLayouts = container.querySelectorAll('.hidden.lg\\:flex');
      expect(desktopLayouts.length).toBeGreaterThan(0);
    });
  });
});
