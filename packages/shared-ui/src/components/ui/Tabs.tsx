import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-lg p-1 text-secondary-500',
  {
    variants: {
      variant: {
        default: 'bg-secondary-100',
        underline: 'bg-transparent border-b border-secondary-200',
        pills: 'bg-secondary-100 space-x-1',
        buttons: 'bg-transparent space-x-2',
      },
      size: {
        sm: 'h-8 text-xs',
        md: 'h-9 text-sm',
        lg: 'h-10 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] touch:min-h-[48px]',
  {
    variants: {
      variant: {
        default: 'data-[state=active]:bg-white data-[state=active]:text-secondary-900 data-[state=active]:shadow-sm hover:bg-white/60',
        underline: 'rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 hover:text-secondary-700 pb-2',
        pills: 'data-[state=active]:bg-primary-500 data-[state=active]:text-white hover:bg-secondary-200',
        buttons: 'border border-secondary-300 data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:border-primary-500 hover:bg-secondary-50',
      },
      size: {
        sm: 'px-2 py-1 text-xs min-h-[36px] touch:min-h-[44px]',
        md: 'px-3 py-1.5 text-sm min-h-[44px] touch:min-h-[48px]',
        lg: 'px-4 py-2 text-base min-h-[48px] touch:min-h-[52px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const tabsContentVariants = cva(
  'mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: '',
        card: 'rounded-lg border border-secondary-200 bg-white p-6 shadow-soft',
        padded: 'p-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: VariantProps<typeof tabsListVariants>['variant'];
  size?: VariantProps<typeof tabsListVariants>['size'];
}

const TabsContext = React.createContext<TabsContextValue>({});

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({
    className,
    value: controlledValue,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    variant,
    size,
    children,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const value = controlledValue ?? internalValue;

    const handleValueChange = (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider
        value={{
          value,
          onValueChange: handleValueChange,
          orientation,
          variant,
          size,
        }}
      >
        <div
          ref={ref}
          className={cn(
            'w-full',
            orientation === 'vertical' && 'flex gap-6',
            className
          )}
          data-orientation={orientation}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, size, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const effectiveVariant = variant ?? context.variant;
    const effectiveSize = size ?? context.size;

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={context.orientation}
        className={cn(
          tabsListVariants({ variant: effectiveVariant, size: effectiveSize }),
          context.orientation === 'vertical' && 'flex-col h-fit w-fit',
          className
        )}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`content-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          tabsTriggerVariants({
            variant: context.variant,
            size: context.size,
          }),
          className
        )}
        onClick={() => context.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContentVariants> {
  value: string;
  children: React.ReactNode;
  forceMount?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, variant, children, forceMount = false, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`content-${value}`}
        aria-labelledby={`trigger-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          tabsContentVariants({ variant }),
          !isActive && forceMount && 'hidden',
          context.orientation === 'vertical' && 'flex-1',
          className
        )}
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

// Utility component for creating tabs with icons
export interface TabWithIconProps extends TabsTriggerProps {
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

const TabWithIcon = React.forwardRef<HTMLButtonElement, TabWithIconProps>(
  ({ icon, badge, children, className, disabled, ...props }, ref) => {
    return (
      <TabsTrigger
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="h-4 w-4">{icon}</span>}
        <span>{children}</span>
        {badge && (
          <span className="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
            {badge}
          </span>
        )}
      </TabsTrigger>
    );
  }
);
TabWithIcon.displayName = 'TabWithIcon';

// Scroll Tabs - for when there are many tabs
export interface ScrollTabsProps extends TabsProps {
  scrollButtons?: boolean;
}

const ScrollTabs = React.forwardRef<HTMLDivElement, ScrollTabsProps>(
  ({ scrollButtons = true, children, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    const checkScrollability = React.useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }, []);

    React.useEffect(() => {
      checkScrollability();
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollability);
        return () => container.removeEventListener('scroll', checkScrollability);
      }
    }, [checkScrollability]);

    const scroll = (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    };

    return (
      <Tabs ref={ref} className={cn('relative', className)} {...props}>
        <div className="relative">
          {scrollButtons && canScrollLeft && (
            <button
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-1 border border-secondary-200"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {children}
          </div>

          {scrollButtons && canScrollRight && (
            <button
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md rounded-full p-1 border border-secondary-200"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </Tabs>
    );
  }
);
ScrollTabs.displayName = 'ScrollTabs';

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabWithIcon,
  ScrollTabs,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
};