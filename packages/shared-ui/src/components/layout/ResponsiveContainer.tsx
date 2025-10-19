import React from 'react';
import { cn } from '../../utils/cn';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  '3xl': 'max-w-screen-3xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 sm:px-6',
  md: 'px-4 sm:px-6 lg:px-8',
  lg: 'px-6 sm:px-8 lg:px-12',
};

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  centerContent = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        centerContent && 'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-optimized grid container
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: ResponsiveGridProps) {
  const gridCols = cn(
    'grid',
    cols.mobile === 1 && 'grid-cols-1',
    cols.mobile === 2 && 'grid-cols-2',
    cols.tablet && cols.tablet === 2 && 'tablet:grid-cols-2',
    cols.tablet && cols.tablet === 3 && 'tablet:grid-cols-3',
    cols.tablet && cols.tablet === 4 && 'tablet:grid-cols-4',
    cols.desktop && cols.desktop === 2 && 'lg:grid-cols-2',
    cols.desktop && cols.desktop === 3 && 'lg:grid-cols-3',
    cols.desktop && cols.desktop === 4 && 'lg:grid-cols-4',
    cols.desktop && cols.desktop === 6 && 'lg:grid-cols-6',
    gapClasses[gap]
  );

  return <div className={cn(gridCols, className)}>{children}</div>;
}

// Touch-friendly component wrapper
interface TouchFriendlyProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number; // in pixels
}

export function TouchFriendly({
  children,
  className,
  minHeight = 44,
}: TouchFriendlyProps) {
  return (
    <div
      className={cn('touch-target', className)}
      style={{ minHeight: `${minHeight}px` }}
    >
      {children}
    </div>
  );
}