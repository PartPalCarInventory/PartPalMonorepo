import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'flex w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      variant: {
        default: 'border-secondary-300',
        error: 'border-error-300 focus-visible:ring-error-500',
        success: 'border-success-300 focus-visible:ring-success-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputVariantProps['size'] | number;
  variant?: InputVariantProps['variant'];
  label?: string;
  error?: string;
  helper?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', size, variant, label, error, helper, ...props }, ref) => {
    const id = React.useId();
    const inputId = props.id || id;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(inputVariants({ size: typeof size === 'number' ? undefined : size, variant: error ? 'error' : variant, className }))}
          ref={ref}
          id={inputId}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="mt-2 text-sm text-secondary-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };