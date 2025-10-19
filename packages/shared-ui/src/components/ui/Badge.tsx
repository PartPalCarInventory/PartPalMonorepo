import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-800 border-transparent',
        secondary: 'bg-secondary-100 text-secondary-800 border-transparent',
        destructive: 'bg-error-100 text-error-800 border-transparent',
        success: 'bg-success-100 text-success-800 border-transparent',
        warning: 'bg-warning-100 text-warning-800 border-transparent',
        accent: 'bg-accent-100 text-accent-800 border-transparent',
        outline: 'text-secondary-700 border border-secondary-300 bg-transparent',
        solid: 'bg-primary-500 text-white border-transparent',
        'solid-secondary': 'bg-secondary-700 text-white border-transparent',
        'solid-destructive': 'bg-error-500 text-white border-transparent',
        'solid-success': 'bg-success-500 text-white border-transparent',
        'solid-warning': 'bg-warning-500 text-white border-transparent',
        'solid-accent': 'bg-accent-500 text-white border-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      status: {
        active: 'bg-success-100 text-success-800',
        inactive: 'bg-secondary-100 text-secondary-600',
        pending: 'bg-warning-100 text-warning-800',
        error: 'bg-error-100 text-error-800',
        verified: 'bg-primary-100 text-primary-800',
        sold: 'bg-secondary-100 text-secondary-600',
        available: 'bg-success-100 text-success-800',
        reserved: 'bg-accent-100 text-accent-800',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  dot?: boolean;
}

function Badge({ className, variant, size, status, dot, children, ...props }: BadgeProps) {
  // Use status variant if provided, otherwise use variant
  const effectiveVariant = status || variant;

  return (
    <div
      className={cn(badgeVariants({ variant: effectiveVariant as any, size, className }))}
      {...props}
    >
      {dot && (
        <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };