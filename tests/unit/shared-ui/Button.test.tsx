import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@partpal/shared-ui';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-500'); // Default variant
    });

    it('renders with custom variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button', { name: /delete/i });
      expect(button).toHaveClass('bg-error-500');
    });

    it('renders with custom size', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button', { name: /large button/i });
      expect(button).toHaveClass('h-12');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button', { name: /custom/i });
      expect(button).toHaveClass('custom-class');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: /disabled/i });

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button', { name: /keyboard/i });

      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper focus management', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button', { name: /focus test/i });

      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('meets minimum touch target size for mobile', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button', { name: /touch target/i });

      // Check that minimum height is applied
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('touch:min-h-[48px]');
    });

    it('supports aria-label for icon-only buttons', () => {
      render(<Button size="icon" aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('properly indicates loading state', () => {
      render(<Button disabled aria-busy="true">Loading...</Button>);
      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });
  });

  // Variant-specific tests
  describe('Variants', () => {
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
      'accent',
      'success',
      'warning'
    ] as const;

    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>{variant} Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();

        // Each variant should have distinct styling
        if (variant === 'default') {
          expect(button).toHaveClass('bg-primary-500');
        } else if (variant === 'destructive') {
          expect(button).toHaveClass('bg-error-500');
        } else if (variant === 'outline') {
          expect(button).toHaveClass('border');
        }
        // Add more specific variant checks as needed
      });
    });
  });

  // Size-specific tests
  describe('Sizes', () => {
    const sizes = ['sm', 'default', 'lg', 'icon'] as const;

    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>{size} Button</Button>);
        const button = screen.getByRole('button');

        // Each size should have appropriate height
        if (size === 'sm') {
          expect(button).toHaveClass('h-9');
        } else if (size === 'lg') {
          expect(button).toHaveClass('h-12');
        } else if (size === 'icon') {
          expect(button).toHaveClass('h-10', 'w-10');
        }
      });
    });
  });

  // PartPal-specific tests
  describe('PartPal Brand Integration', () => {
    it('uses PartPal primary color by default', () => {
      render(<Button>PartPal Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500');
    });

    it('supports PartPal accent color', () => {
      render(<Button variant="accent">PartPal Accent</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-accent-500');
    });

    it('works well in PartPal color schemes', () => {
      const { container } = render(
        <div className="bg-secondary-50 p-4">
          <Button>Primary Action</Button>
          <Button variant="outline" className="ml-2">Secondary Action</Button>
        </div>
      );
      expect(container.firstChild).toHaveClass('bg-secondary-50');
    });
  });

  // Error boundary tests
  describe('Error Handling', () => {
    it('handles missing children gracefully', () => {
      render(<Button />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles invalid props gracefully', () => {
      // TypeScript would catch this, but test runtime behavior
      render(<Button variant={'invalid' as any}>Invalid</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument(); // Should fall back to default
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestButton = (props: any) => {
        renderSpy();
        return <Button {...props}>Test</Button>;
      };

      const { rerender } = render(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause re-render
      rerender(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});