import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../Input';

expect.extend(toHaveNoViolations);

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input with default props', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('h-10', 'text-sm'); // md size default
    });

    it('renders with label', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);
      const label = screen.getByText('Email Address');
      const input = screen.getByPlaceholderText('Enter email');

      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('generates unique id when not provided', () => {
      render(
        <div>
          <Input placeholder="Input 1" />
          <Input placeholder="Input 2" />
        </div>
      );

      const input1 = screen.getByPlaceholderText('Input 1');
      const input2 = screen.getByPlaceholderText('Input 2');

      expect(input1.id).toBeTruthy();
      expect(input2.id).toBeTruthy();
      expect(input1.id).not.toBe(input2.id);
    });

    it('uses provided id', () => {
      render(<Input id="custom-id" placeholder="Custom input" />);
      const input = screen.getByPlaceholderText('Custom input');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Variants and Sizes', () => {
    it('applies size variants correctly', () => {
      const { rerender } = render(<Input size="sm" placeholder="Small" />);
      expect(screen.getByPlaceholderText('Small')).toHaveClass('h-8', 'text-xs');

      rerender(<Input size="lg" placeholder="Large" />);
      expect(screen.getByPlaceholderText('Large')).toHaveClass('h-12', 'text-base');
    });

    it('applies variant styles correctly', () => {
      const { rerender } = render(<Input variant="error" placeholder="Error input" />);
      expect(screen.getByPlaceholderText('Error input')).toHaveClass('border-error-300');

      rerender(<Input variant="success" placeholder="Success input" />);
      expect(screen.getByPlaceholderText('Success input')).toHaveClass('border-success-300');
    });

    it('prioritizes error state over variant', () => {
      render(<Input variant="success" error="This field is required" placeholder="Test" />);
      expect(screen.getByPlaceholderText('Test')).toHaveClass('border-error-300');
    });
  });

  describe('Error and Helper Text', () => {
    it('displays error message with proper ARIA', () => {
      render(<Input error="Email is required" placeholder="Email" />);

      const errorMessage = screen.getByText('Email is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveClass('text-error-600');
    });

    it('displays helper text when no error', () => {
      render(<Input helper="Enter a valid email address" placeholder="Email" />);

      const helperText = screen.getByText('Enter a valid email address');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-secondary-500');
    });

    it('hides helper text when error is present', () => {
      render(
        <Input
          error="Email is required"
          helper="Enter a valid email address"
          placeholder="Email"
        />
      );

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" placeholder="Email" />);
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" placeholder="Password" />);
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

      rerender(<Input type="number" placeholder="Age" />);
      expect(screen.getByPlaceholderText('Age')).toHaveAttribute('type', 'number');
    });

    it('defaults to text type', () => {
      render(<Input placeholder="Default type" />);
      expect(screen.getByPlaceholderText('Default type')).toHaveAttribute('type', 'text');
    });
  });

  describe('User Interactions', () => {
    it('handles value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');

      await user.type(input, 'Hello World');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello World');
    });

    it('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(
        <Input
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Focus test"
        />
      );
      const input = screen.getByPlaceholderText('Focus test');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles disabled state correctly', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input disabled onChange={handleChange} placeholder="Disabled" />);
      const input = screen.getByPlaceholderText('Disabled');

      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');

      await user.type(input, 'Should not work');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          helper="First and last name"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input correctly', () => {
      render(<Input label="Username" placeholder="Enter username" />);

      const input = screen.getByPlaceholderText('Enter username');
      const label = screen.getByText('Username');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('supports ARIA attributes', () => {
      render(
        <Input
          placeholder="Search"
          aria-label="Search parts"
          aria-describedby="search-help"
        />
      );

      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveAttribute('aria-label', 'Search parts');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
    });

    it('has proper keyboard navigation', () => {
      render(<Input placeholder="Keyboard test" />);
      const input = screen.getByPlaceholderText('Keyboard test');

      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('PartPal-specific Use Cases', () => {
    it('handles South African phone number input', async () => {
      const user = userEvent.setup();

      render(
        <Input
          type="tel"
          label="Phone Number"
          placeholder="0XX XXX XXXX"
          helper="Enter your South African mobile number"
        />
      );

      const input = screen.getByPlaceholderText('0XX XXX XXXX');
      await user.type(input, '0821234567');

      expect(input).toHaveValue('0821234567');
      expect(input).toBeValidSAPhoneNumber?.();
    });

    it('handles VIN input with validation', async () => {
      const user = userEvent.setup();

      render(
        <Input
          label="Vehicle VIN"
          placeholder="Enter 17-character VIN"
          maxLength={17}
          style={{ textTransform: 'uppercase' }}
        />
      );

      const input = screen.getByPlaceholderText('Enter 17-character VIN');
      await user.type(input, '1HGCM82633A123456');

      expect(input).toHaveValue('1HGCM82633A123456');
      expect(input).toHaveAttribute('maxlength', '17');
    });

    it('handles price input with ZAR currency', async () => {
      const user = userEvent.setup();

      render(
        <Input
          type="number"
          label="Price (ZAR)"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      );

      const input = screen.getByPlaceholderText('0.00');
      await user.type(input, '1500.50');

      expect(input).toHaveValue(1500.5);
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('step', '0.01');
    });

    it('handles search input with real-time filtering', async () => {
      const handleSearch = jest.fn();
      const user = userEvent.setup();

      render(
        <Input
          type="search"
          placeholder="Search parts..."
          onChange={handleSearch}
          helper="Search by part name, number, or vehicle"
        />
      );

      const input = screen.getByPlaceholderText('Search parts...');
      await user.type(input, 'alternator');

      expect(handleSearch).toHaveBeenCalled();
      expect(input).toHaveValue('alternator');
    });
  });

  describe('Form Integration', () => {
    it('works with controlled components', () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled input"
          />
        );
      };

      render(<TestForm />);
      const input = screen.getByPlaceholderText('Controlled input');

      fireEvent.change(input, { target: { value: 'New value' } });
      expect(input).toHaveValue('New value');
    });

    it('supports form validation attributes', () => {
      render(
        <Input
          required
          minLength={3}
          maxLength={50}
          pattern="[A-Za-z]+"
          placeholder="Validated input"
        />
      );

      const input = screen.getByPlaceholderText('Validated input');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '50');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestInput = (props: any) => {
        renderSpy();
        return <Input {...props} />;
      };

      const { rerender } = render(<TestInput placeholder="Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestInput placeholder="Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});