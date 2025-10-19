import React from 'react';

// Mock Button component
export const Button = React.forwardRef<HTMLButtonElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('button', { ref, className, ...props }, children)
  )
);
Button.displayName = 'Button';

// Mock Card components
export const Card = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('div', { ref, className, ...props }, children)
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('div', { ref, className, ...props }, children)
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('h3', { ref, className, ...props }, children)
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('p', { ref, className, ...props }, children)
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('div', { ref, className, ...props }, children)
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => (
    React.createElement('div', { ref, className, ...props }, children)
  )
);
CardFooter.displayName = 'CardFooter';

// Mock Badge component
export function Badge({ children, className, dot, ...props }: any) {
  return React.createElement(
    'div',
    { className, ...props },
    dot && React.createElement('div', { className: 'w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75' }),
    children
  );
}