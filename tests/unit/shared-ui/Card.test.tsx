import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@partpal/shared-ui';

expect.extend(toHaveNoViolations);

describe('Card Component', () => {
  describe('Card Base Component', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl', 'bg-white', 'border');
    });

    it('renders with different variants', () => {
      const variants = ['default', 'elevated', 'outline', 'ghost'] as const;

      variants.forEach(variant => {
        const { container } = render(<Card variant={variant}>Variant {variant}</Card>);
        const card = container.firstChild as HTMLElement;

        if (variant === 'elevated') {
          expect(card).toHaveClass('shadow-medium');
        } else if (variant === 'outline') {
          expect(card).toHaveClass('border-secondary-300');
        } else if (variant === 'ghost') {
          expect(card).toHaveClass('border-transparent');
        }
      });
    });

    it('renders with different padding sizes', () => {
      const paddings = ['none', 'sm', 'md', 'lg'] as const;

      paddings.forEach(padding => {
        const { container } = render(<Card padding={padding}>Padding {padding}</Card>);
        const card = container.firstChild as HTMLElement;

        if (padding === 'none') {
          expect(card).toHaveClass('p-0');
        } else if (padding === 'sm') {
          expect(card).toHaveClass('p-4');
        } else if (padding === 'md') {
          expect(card).toHaveClass('p-6');
        } else if (padding === 'lg') {
          expect(card).toHaveClass('p-8');
        }
      });
    });

    it('handles interactive cards correctly', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Card interactive onClick={handleClick}>
          Interactive card
        </Card>
      );

      const card = screen.getByText('Interactive card');
      expect(card).toHaveClass('cursor-pointer');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Custom card</Card>);
      const card = screen.getByText('Custom card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('CardHeader Component', () => {
    it('renders correctly', () => {
      render(<CardHeader>Header content</CardHeader>);
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-4');
    });
  });

  describe('CardTitle Component', () => {
    it('renders as h3 with correct styling', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Card Title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-secondary-900');
    });
  });

  describe('CardDescription Component', () => {
    it('renders as paragraph with correct styling', () => {
      render(<CardDescription>Card description</CardDescription>);
      const description = screen.getByText('Card description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-secondary-600');
    });
  });

  describe('CardContent Component', () => {
    it('renders with correct styling', () => {
      render(<CardContent>Card content</CardContent>);
      const content = screen.getByText('Card content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('pb-4');
    });
  });

  describe('CardFooter Component', () => {
    it('renders with correct styling', () => {
      render(<CardFooter>Footer content</CardFooter>);
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'pt-4', 'border-t');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card structure correctly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>PartPal Inventory Item</CardTitle>
            <CardDescription>Engine part for Toyota Camry 2015</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Part details and specifications...</p>
          </CardContent>
          <CardFooter>
            <button>Add to Cart</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'PartPal Inventory Item' })).toBeInTheDocument();
      expect(screen.getByText('Engine part for Toyota Camry 2015')).toBeInTheDocument();
      expect(screen.getByText('Part details and specifications...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card is accessible</CardDescription>
          </CardHeader>
          <CardContent>Accessible content</CardContent>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation for interactive cards', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Card interactive onClick={handleClick} tabIndex={0}>
          Interactive accessible card
        </Card>
      );

      const card = screen.getByText('Interactive accessible card');
      card.focus();
      expect(card).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('PartPal Business Context', () => {
    it('works well for inventory item cards', () => {
      render(
        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle>Engine Block - Used</CardTitle>
            <CardDescription>2015 Toyota Camry 2.5L 4-Cylinder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">Condition: Good</p>
              <p className="text-sm">Mileage: 85,000 km</p>
              <p className="text-lg font-semibold text-primary-600">R 12,500</p>
            </div>
          </CardContent>
          <CardFooter>
            <button className="btn-primary">Contact Seller</button>
            <button className="btn-secondary ml-2">Save to Wishlist</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Engine Block - Used')).toBeInTheDocument();
      expect(screen.getByText('2015 Toyota Camry 2.5L 4-Cylinder')).toBeInTheDocument();
      expect(screen.getByText('R 12,500')).toBeInTheDocument();
    });

    it('works well for seller profile cards', () => {
      render(
        <Card variant="outline">
          <CardHeader>
            <CardTitle>AutoParts Johannesburg</CardTitle>
            <CardDescription>Verified Seller since 2019</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-lg font-semibold">4.8</p>
                <p className="text-xs text-secondary-600">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">1,247</p>
                <p className="text-xs text-secondary-600">Parts Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('AutoParts Johannesburg')).toBeInTheDocument();
      expect(screen.getByText('Verified Seller since 2019')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestCard = (props: any) => {
        renderSpy();
        return <Card {...props}>Test card</Card>;
      };

      const { rerender } = render(<TestCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});