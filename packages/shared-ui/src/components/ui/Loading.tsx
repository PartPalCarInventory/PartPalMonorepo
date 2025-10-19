import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
      color: {
        primary: 'text-primary-500',
        secondary: 'text-secondary-400',
        accent: 'text-accent-500',
        white: 'text-white',
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  size?: SpinnerVariantProps['size'];
  color?: SpinnerVariantProps['color'];
}

function Spinner({ className, size, color, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, color: color as any, className }))}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

const loadingContainerVariants = cva(
  'flex items-center justify-center',
  {
    variants: {
      direction: {
        row: 'flex-row space-x-2',
        column: 'flex-col space-y-2',
      },
      size: {
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-8',
        xl: 'p-12',
      },
    },
    defaultVariants: {
      direction: 'column',
      size: 'md',
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingContainerVariants> {
  text?: string;
  spinner?: {
    size?: SpinnerVariantProps['size'];
    color?: SpinnerVariantProps['color'];
  };
  overlay?: boolean;
}

function Loading({
  className,
  direction,
  size,
  text = 'Loading...',
  spinner = {},
  overlay = false,
  ...props
}: LoadingProps) {
  const content = (
    <div
      className={cn(
        loadingContainerVariants({ direction, size, className }),
        overlay && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50'
      )}
      {...props}
    >
      <Spinner
        size={spinner.size || (size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md')}
        color={spinner.color}
      />
      {text && (
        <p className="text-sm text-secondary-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

// Skeleton components for loading placeholders
const skeletonVariants = cva(
  'animate-pulse bg-secondary-200 rounded',
  {
    variants: {
      variant: {
        text: 'h-4',
        title: 'h-6',
        button: 'h-10',
        avatar: 'rounded-full w-10 h-10',
        card: 'h-32',
        image: 'aspect-video',
      },
      width: {
        full: 'w-full',
        '3/4': 'w-3/4',
        '1/2': 'w-1/2',
        '1/4': 'w-1/4',
        '1/3': 'w-1/3',
        '2/3': 'w-2/3',
      },
    },
    defaultVariants: {
      variant: 'text',
      width: 'full',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, width, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, width, className }))}
      {...props}
    />
  );
}

// Dots loading animation (alternative to spinner)
export interface DotsProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

function Dots({ className, color = 'primary', size = 'md', ...props }: DotsProps) {
  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-400',
    accent: 'bg-accent-500',
    white: 'bg-white',
  };

  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  return (
    <div className={cn('flex space-x-1', className)} {...props}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            colorClasses[color],
            sizeClasses[size]
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export { Spinner, Loading, Skeleton, Dots, spinnerVariants, loadingContainerVariants, skeletonVariants };