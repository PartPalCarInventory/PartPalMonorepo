import React from 'react';
import { cn } from '../../utils/cn';
import { useReducedMotion, useHighContrast, useAnnouncement } from '../../hooks/useAccessibility';

interface AccessibilityContextValue {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focusVisible: boolean;
  setFocusVisible: (visible: boolean) => void;
}

const AccessibilityContext = React.createContext<AccessibilityContextValue | null>(null);

export function useAccessibilityContext() {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
  skipLinks?: Array<{ href: string; label: string }>;
  announcements?: boolean;
}

export function AccessibilityProvider({
  children,
  skipLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
  ],
  announcements = true,
}: AccessibilityProviderProps) {
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();
  const { announce, AnnouncementRegion } = useAnnouncement();
  const [focusVisible, setFocusVisible] = React.useState(false);

  // Track focus-visible state globally
  React.useEffect(() => {
    let hadKeyboardEvent = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
        hadKeyboardEvent = true;
      }
    };

    const onFocus = () => {
      if (hadKeyboardEvent) {
        setFocusVisible(true);
      }
    };

    const onBlur = () => {
      setFocusVisible(false);
      hadKeyboardEvent = false;
    };

    const onMouseDown = () => {
      hadKeyboardEvent = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focus', onFocus, true);
      document.removeEventListener('blur', onBlur, true);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const contextValue: AccessibilityContextValue = {
    prefersReducedMotion,
    prefersHighContrast,
    announce,
    focusVisible,
    setFocusVisible,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip Links */}
      <SkipLinks links={skipLinks} />

      {/* Main Content */}
      <div
        className={cn(
          'min-h-screen',
          prefersReducedMotion && 'motion-reduce',
          prefersHighContrast && 'high-contrast'
        )}
      >
        {children}
      </div>

      {/* Screen Reader Announcements */}
      {announcements && <AnnouncementRegion />}
    </AccessibilityContext.Provider>
  );
}

// Skip Links Component
interface SkipLinksProps {
  links: Array<{ href: string; label: string }>;
}

function SkipLinks({ links }: SkipLinksProps) {
  return (
    <div className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

// Screen Reader Only Component
export function ScreenReaderOnly({ children, asChild = false }: { children: React.ReactNode; asChild?: boolean }) {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn((children as React.ReactElement).props.className, 'sr-only'),
    });
  }

  return <span className="sr-only">{children}</span>;
}

// Visually Hidden but accessible to screen readers
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  );
}

// Focus outline component for consistent focus styling
export function FocusRing({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  const { focusVisible } = useAccessibilityContext();

  return (
    <div
      className={cn(
        'focus-within:outline-none',
        focusVisible && 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Landmark component for page structure
interface LandmarkProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'main' | 'nav' | 'aside' | 'section' | 'header' | 'footer';
  label?: string;
  children: React.ReactNode;
}

export function Landmark({
  as: Component = 'section',
  label,
  children,
  className,
  ...props
}: LandmarkProps) {
  return (
    <Component
      className={className}
      aria-label={label}
      {...props}
    >
      {children}
    </Component>
  );
}

// Roving Tab Index container for complex widgets
interface RovingTabIndexProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  className?: string;
}

export function RovingTabIndex({
  children,
  orientation = 'horizontal',
  defaultActiveIndex = 0,
  onActiveIndexChange,
  className,
}: RovingTabIndexProps) {
  const [activeIndex, setActiveIndex] = React.useState(defaultActiveIndex);
  const itemRefs = React.useRef<(HTMLElement | null)[]>([]);

  const updateActiveIndex = React.useCallback((index: number) => {
    setActiveIndex(index);
    onActiveIndexChange?.(index);
  }, [onActiveIndexChange]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    const items = itemRefs.current.filter(Boolean);

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
        updateActiveIndex(nextIndex);
        items[nextIndex]?.focus();
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
        updateActiveIndex(prevIndex);
        items[prevIndex]?.focus();
        break;

      case 'Home':
        event.preventDefault();
        updateActiveIndex(0);
        items[0]?.focus();
        break;

      case 'End':
        event.preventDefault();
        const lastIndex = items.length - 1;
        updateActiveIndex(lastIndex);
        items[lastIndex]?.focus();
        break;
    }
  };

  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ref: (el: HTMLElement | null) => {
          itemRefs.current[index] = el;
        },
        tabIndex: index === activeIndex ? 0 : -1,
        onFocus: () => updateActiveIndex(index),
        'data-active': index === activeIndex,
      });
    }
    return child;
  });

  return (
    <div
      className={className}
      role="group"
      onKeyDown={handleKeyDown}
      data-orientation={orientation}
    >
      {childrenWithProps}
    </div>
  );
}

// Accessible description component
export function Description({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div id={id} className="text-sm text-secondary-600">
      {children}
    </div>
  );
}

// Error message component with proper semantics
export function ErrorMessage({
  children,
  id,
}: {
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="text-sm text-error-600 flex items-center mt-1"
    >
      <svg
        className="h-4 w-4 mr-1 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </div>
  );
}