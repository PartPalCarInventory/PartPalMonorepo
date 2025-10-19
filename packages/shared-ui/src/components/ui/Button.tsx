import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white min-h-[44px] touch:min-h-[48px]',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-medium',
        destructive: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm hover:shadow-medium',
        outline: 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 active:bg-secondary-100',
        secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300',
        ghost: 'text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200',
        link: 'text-primary-500 underline-offset-4 hover:underline hover:text-primary-600',
        accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm hover:shadow-medium',
        success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm hover:shadow-medium',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 shadow-sm hover:shadow-medium',
      },
      size: {
        sm: 'h-9 px-3 text-xs min-h-[36px] touch:min-h-[44px]',
        default: 'h-10 px-4 min-h-[44px] touch:min-h-[48px]',
        lg: 'h-12 px-6 text-base min-h-[48px] touch:min-h-[52px]',
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px] touch:min-h-[48px] touch:min-w-[48px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };