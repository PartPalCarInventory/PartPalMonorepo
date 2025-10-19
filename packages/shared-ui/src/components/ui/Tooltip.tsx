import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  {
    variants: {
      variant: {
        default: 'bg-secondary-900 text-white',
        primary: 'bg-primary-600 text-white',
        success: 'bg-success-600 text-white',
        warning: 'bg-warning-600 text-white',
        error: 'bg-error-600 text-white',
        light: 'bg-white text-secondary-900 border border-secondary-200 shadow-md',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'>,
    VariantProps<typeof tooltipContentVariants> {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  arrow?: boolean;
  offset?: number;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({
    className,
    variant,
    size,
    content,
    children,
    side = 'top',
    align = 'center',
    delayDuration = 700,
    skipDelayDuration = 300,
    disableHoverableContent = false,
    disabled = false,
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    arrow = true,
    offset = 8,
    ...props
  }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [mounted, setMounted] = React.useState(false);
    const open = controlledOpen ?? internalOpen;

    const triggerRef = React.useRef<HTMLElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const skipTimeoutRef = React.useRef<NodeJS.Timeout>();

    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    const handleOpenChange = (newOpen: boolean) => {
      if (disabled) return;

      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    };

    const showTooltip = () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = undefined;
        handleOpenChange(true);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        handleOpenChange(true);
      }, delayDuration);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      handleOpenChange(false);

      skipTimeoutRef.current = setTimeout(() => {
        skipTimeoutRef.current = undefined;
      }, skipDelayDuration);
    };

    const calculatePosition = React.useCallback(() => {
      if (!triggerRef.current || !contentRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = 0;
      let y = 0;

      // Calculate base position based on side
      switch (side) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          y = triggerRect.top - contentRect.height - offset;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
          y = triggerRect.bottom + offset;
          break;
        case 'left':
          x = triggerRect.left - contentRect.width - offset;
          y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + offset;
          y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
          break;
      }

      // Adjust for alignment
      if (side === 'top' || side === 'bottom') {
        if (align === 'start') {
          x = triggerRect.left;
        } else if (align === 'end') {
          x = triggerRect.right - contentRect.width;
        }
      } else {
        if (align === 'start') {
          y = triggerRect.top;
        } else if (align === 'end') {
          y = triggerRect.bottom - contentRect.height;
        }
      }

      // Keep within viewport bounds
      x = Math.max(8, Math.min(x, viewportWidth - contentRect.width - 8));
      y = Math.max(8, Math.min(y, viewportHeight - contentRect.height - 8));

      setPosition({ x, y });
    }, [side, align, offset]);

    React.useEffect(() => {
      if (open) {
        setMounted(true);
        calculatePosition();

        const handleResize = () => calculatePosition();
        const handleScroll = () => calculatePosition();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
          window.removeEventListener('resize', handleResize);
          window.removeEventListener('scroll', handleScroll, true);
        };
      } else {
        const timer = setTimeout(() => setMounted(false), 150);
        return () => clearTimeout(timer);
      }
    }, [open, calculatePosition]);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (skipTimeoutRef.current) {
          clearTimeout(skipTimeoutRef.current);
        }
      };
    }, []);

    const handleMouseEnter = () => {
      if (!disableHoverableContent) showTooltip();
    };

    const handleMouseLeave = () => {
      if (!disableHoverableContent) hideTooltip();
    };

    const handleFocus = () => showTooltip();
    const handleBlur = () => hideTooltip();

    // Clone children to add event handlers
    const trigger = React.cloneElement(
      children as React.ReactElement,
      {
        ref: (node: HTMLElement) => {
          triggerRef.current = node;
          // Handle existing ref - only support function refs for type safety
          const originalRef = (children as any).ref;
          if (typeof originalRef === 'function') {
            originalRef(node);
          }
        },
        onMouseEnter: (e: React.MouseEvent) => {
          handleMouseEnter();
          (children as any).props?.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          handleMouseLeave();
          (children as any).props?.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          handleFocus();
          (children as any).props?.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          handleBlur();
          (children as any).props?.onBlur?.(e);
        },
        'aria-describedby': open ? 'tooltip-content' : undefined,
      }
    );

    return (
      <>
        {trigger}
        {mounted && (
          <div
            ref={contentRef}
            className={cn(
              tooltipContentVariants({ variant, size }),
              !open && 'opacity-0 pointer-events-none',
              className
            )}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 9999,
            }}
            role="tooltip"
            id="tooltip-content"
            onMouseEnter={disableHoverableContent ? undefined : handleMouseEnter}
            onMouseLeave={disableHoverableContent ? undefined : handleMouseLeave}
            {...props}
          >
            {content}
            {arrow && (
              <div
                className={cn(
                  'absolute w-2 h-2 rotate-45',
                  variant === 'light' ? 'bg-white border-l border-t border-secondary-200' : 'bg-current',
                  side === 'top' && 'bottom-[-4px] left-1/2 transform -translate-x-1/2',
                  side === 'bottom' && 'top-[-4px] left-1/2 transform -translate-x-1/2',
                  side === 'left' && 'right-[-4px] top-1/2 transform -translate-y-1/2',
                  side === 'right' && 'left-[-4px] top-1/2 transform -translate-y-1/2'
                )}
              />
            )}
          </div>
        )}
      </>
    );
  }
);
Tooltip.displayName = 'Tooltip';

// Simple tooltip for common use cases
export interface SimpleTooltipProps {
  content: string;
  children: React.ReactElement;
  side?: TooltipSide;
  variant?: VariantProps<typeof tooltipContentVariants>['variant'];
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  content,
  children,
  side = 'top',
  variant = 'default',
}) => {
  return (
    <Tooltip content={content} side={side} variant={variant}>
      {children}
    </Tooltip>
  );
};

// Tooltip with rich content
export interface RichTooltipProps extends TooltipProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const RichTooltip = React.forwardRef<HTMLDivElement, RichTooltipProps>(
  ({ title, description, actions, content, className, ...props }, ref) => {
    const richContent = content || (
      <div className="space-y-2">
        {title && (
          <div className="font-semibold text-sm">{title}</div>
        )}
        {description && (
          <div className="text-xs opacity-90">{description}</div>
        )}
        {actions && (
          <div className="flex items-center gap-2 pt-1">
            {actions}
          </div>
        )}
      </div>
    );

    return (
      <Tooltip
        ref={ref}
        content={richContent}
        variant="light"
        size="lg"
        className={cn('max-w-xs', className)}
        delayDuration={300}
        {...props}
      />
    );
  }
);
RichTooltip.displayName = 'RichTooltip';

export {
  Tooltip,
  SimpleTooltip,
  RichTooltip,
  tooltipContentVariants,
};