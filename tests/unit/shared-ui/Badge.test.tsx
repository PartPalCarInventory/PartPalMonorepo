import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from '@partpal/shared-ui';

expect.extend(toHaveNoViolations);

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
    });

    it('renders with custom text', () => {
      render(<Badge>Custom Text</Badge>);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Badge className="custom-class">Custom Badge</Badge>);
      const badge = screen.getByText('Custom Badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Variant Styling', () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'success',
      'warning',
      'accent',
      'outline',
      'solid',
      'solid-secondary',
      'solid-destructive',
      'solid-success',
      'solid-warning',
      'solid-accent'
    ] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Badge variant={variant}>{variant} Badge</Badge>);
        const badge = screen.getByText(`${variant} Badge`);
        expect(badge).toBeInTheDocument();

        // Test specific variant classes
        if (variant === 'default') {
          expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
        } else if (variant === 'destructive') {
          expect(badge).toHaveClass('bg-error-100', 'text-error-800');
        } else if (variant === 'success') {
          expect(badge).toHaveClass('bg-success-100', 'text-success-800');
        } else if (variant === 'outline') {
          expect(badge).toHaveClass('border', 'border-secondary-300');
        } else if (variant === 'solid') {
          expect(badge).toHaveClass('bg-primary-500', 'text-white');
        }
      });
    });
  });

  describe('Size Variations', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Badge size={size}>{size} Badge</Badge>);
        const badge = screen.getByText(`${size} Badge`);

        if (size === 'sm') {
          expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
        } else if (size === 'md') {
          expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
        } else if (size === 'lg') {
          expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
        }
      });
    });
  });

  describe('Status Variants', () => {
    const statuses = [
      'active',
      'inactive',
      'pending',
      'error',
      'verified',
      'sold',
      'available',
      'reserved'
    ] as const;

    statuses.forEach(status => {
      it(`renders ${status} status correctly`, () => {
        render(<Badge status={status}>{status} Status</Badge>);
        const badge = screen.getByText(`${status} Status`);
        expect(badge).toBeInTheDocument();

        // Test specific status classes
        if (status === 'active' || status === 'available') {
          expect(badge).toHaveClass('bg-success-100', 'text-success-800');
        } else if (status === 'inactive' || status === 'sold') {
          expect(badge).toHaveClass('bg-secondary-100');
        } else if (status === 'pending') {
          expect(badge).toHaveClass('bg-warning-100', 'text-warning-800');
        } else if (status === 'error') {
          expect(badge).toHaveClass('bg-error-100', 'text-error-800');
        } else if (status === 'verified') {
          expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
        } else if (status === 'reserved') {
          expect(badge).toHaveClass('bg-accent-100', 'text-accent-800');
        }
      });
    });

    it('prioritizes status over variant', () => {
      render(<Badge variant="destructive" status="success">Status Priority</Badge>);
      const badge = screen.getByText('Status Priority');
      expect(badge).toHaveClass('bg-success-100', 'text-success-800');
    });
  });

  describe('Dot Indicator', () => {
    it('renders without dot by default', () => {
      render(<Badge>No Dot</Badge>);
      const badge = screen.getByText('No Dot');
      expect(badge.querySelector('.w-1\\.5')).not.toBeInTheDocument();
    });

    it('renders with dot when enabled', () => {
      render(<Badge dot>With Dot</Badge>);
      const badge = screen.getByText('With Dot');
      const dot = badge.querySelector('.w-1\\.5');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('h-1.5', 'rounded-full', 'bg-current');
    });

    it('positions dot correctly with margin', () => {
      render(<Badge dot>Dot Badge</Badge>);
      const badge = screen.getByText('Dot Badge');
      const dot = badge.querySelector('.w-1\\.5');
      expect(dot).toHaveClass('mr-1.5');
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Badge>Accessible Badge</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with dot indicator', async () => {
      const { container } = render(<Badge dot>Badge with dot</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper focus management when interactive', () => {
      render(<Badge tabIndex={0}>Focusable Badge</Badge>);
      const badge = screen.getByText('Focusable Badge');

      badge.focus();
      expect(badge).toHaveFocus();
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('PartPal Business Context', () => {
    it('displays part status correctly', () => {
      const { rerender } = render(<Badge status="available">Available</Badge>);
      expect(screen.getByText('Available')).toHaveClass('bg-success-100');

      rerender(<Badge status="sold">Sold</Badge>);
      expect(screen.getByText('Sold')).toHaveClass('bg-secondary-100');

      rerender(<Badge status="reserved">Reserved</Badge>);
      expect(screen.getByText('Reserved')).toHaveClass('bg-accent-100');
    });

    it('displays seller verification status', () => {
      render(<Badge status="verified" dot>Verified Seller</Badge>);
      const badge = screen.getByText('Verified Seller');
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
      expect(badge.querySelector('.w-1\\.5')).toBeInTheDocument();
    });

    it('displays part condition badges', () => {
      const conditions = [
        { status: 'active', text: 'Excellent' },
        { status: 'available', text: 'Good' },
        { status: 'pending', text: 'Fair' },
        { status: 'error', text: 'Poor' }
      ] as const;

      conditions.forEach(({ status, text }) => {
        const { container } = render(<Badge status={status} size="sm">{text}</Badge>);
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });

    it('works well in PartPal marketplace context', () => {
      render(
        <div className="space-x-2">
          <Badge status="verified" dot size="sm">Verified</Badge>
          <Badge variant="accent" size="sm">Fast Shipping</Badge>
          <Badge status="available">In Stock</Badge>
          <Badge variant="outline" size="lg">Free Returns</Badge>
        </div>
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Fast Shipping')).toBeInTheDocument();
      expect(screen.getByText('In Stock')).toBeInTheDocument();
      expect(screen.getByText('Free Returns')).toBeInTheDocument();
    });

    it('displays pricing and discount badges', () => {
      render(
        <div>
          <Badge variant="solid-success" size="lg">25% OFF</Badge>
          <Badge variant="warning" className="ml-2">Limited Time</Badge>
        </div>
      );

      expect(screen.getByText('25% OFF')).toHaveClass('bg-success-500', 'text-white');
      expect(screen.getByText('Limited Time')).toHaveClass('bg-warning-100');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards HTML div attributes correctly', () => {
      render(
        <Badge
          data-testid="test-badge"
          aria-label="Test badge"
          role="status"
        >
          Forwarded Props
        </Badge>
      );

      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('aria-label', 'Test badge');
      expect(badge).toHaveAttribute('role', 'status');
    });

    it('handles event handlers correctly', () => {
      const handleClick = jest.fn();
      const handleMouseOver = jest.fn();

      render(
        <Badge
          onClick={handleClick}
          onMouseOver={handleMouseOver}
        >
          Interactive Badge
        </Badge>
      );

      const badge = screen.getByText('Interactive Badge');
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Simulate mouseover
      badge.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      expect(handleMouseOver).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestBadge = (props: any) => {
        renderSpy();
        return <Badge {...props}>Test Badge</Badge>;
      };

      const { rerender } = render(<TestBadge />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestBadge />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});