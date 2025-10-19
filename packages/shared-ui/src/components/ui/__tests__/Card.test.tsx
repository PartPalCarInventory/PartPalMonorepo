import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '../Card';

expect.extend(toHaveNoViolations);

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl', 'bg-white', 'border');
    });

    it('applies variant classes correctly', () => {
      const { rerender } = render(<Card variant="elevated">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('shadow-medium');

      rerender(<Card variant="outline">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('border-secondary-300');

      rerender(<Card variant="ghost">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('border-transparent');
    });

    it('applies padding variants correctly', () => {
      const { rerender } = render(<Card padding="none">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-0');

      rerender(<Card padding="sm">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-4');

      rerender(<Card padding="lg">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('p-8');
    });

    it('handles interactive mode correctly', () => {
      render(<Card interactive>Interactive content</Card>);
      const card = screen.getByText('Interactive content');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('handles click events when interactive', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Card interactive onClick={handleClick}>
          Click me
        </Card>
      );

      await user.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Content</Card>);
      expect(screen.getByText('Content')).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader>Header content</CardHeader>);
      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-4');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 with correct styling', () => {
      render(<CardTitle>Test Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        'text-lg',
        'font-semibold',
        'leading-none',
        'tracking-tight',
        'text-secondary-900'
      );
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders as paragraph with correct styling', () => {
      render(<CardDescription>Test description</CardDescription>);
      const description = screen.getByText('Test description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-secondary-600');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('renders with correct styling', () => {
      render(<CardContent>Content here</CardContent>);
      const content = screen.getByText('Content here');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('pb-4');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders with correct styling', () => {
      render(<CardFooter>Footer content</CardFooter>);
      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass(
        'flex',
        'items-center',
        'pt-4',
        'border-t',
        'border-secondary-200'
      );
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card structure correctly', () => {
      render(
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>Information about this vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <p>2018 Toyota Corolla - R 150,000</p>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Vehicle Details' })).toBeInTheDocument();
      expect(screen.getByText('Information about this vehicle')).toBeInTheDocument();
      expect(screen.getByText('2018 Toyota Corolla - R 150,000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription>This card follows accessibility guidelines</CardDescription>
          </CardHeader>
          <CardContent>Card content here</CardContent>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports ARIA attributes', () => {
      render(
        <Card role="article" aria-label="Part listing">
          <CardTitle>Alternator</CardTitle>
        </Card>
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Part listing');
    });
  });

  describe('PartPal-specific use cases', () => {
    it('renders part listing card correctly', () => {
      render(
        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle>Alternator - Toyota Corolla</CardTitle>
            <CardDescription>2018 model, excellent condition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>Price: R 1,500</span>
              <span>Location: Cape Town</span>
            </div>
          </CardContent>
          <CardFooter>
            <button className="btn-primary">Contact Seller</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Alternator - Toyota Corolla')).toBeInTheDocument();
      expect(screen.getByText('Price: R 1,500')).toBeInTheDocument();
      expect(screen.getByText('Location: Cape Town')).toBeInTheDocument();
    });

    it('handles mobile viewport correctly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <Card padding="sm">
          <CardContent>Mobile optimized content</CardContent>
        </Card>
      );

      const card = screen.getByText('Mobile optimized content').parentElement;
      expect(card).toHaveClass('p-4'); // sm padding for mobile
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestCard = (props: any) => {
        renderSpy();
        return <Card {...props}>Test</Card>;
      };

      const { rerender } = render(<TestCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestCard />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});