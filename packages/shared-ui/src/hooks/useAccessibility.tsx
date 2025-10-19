import React from 'react';

// Hook for managing focus
export function useFocusManagement() {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
    'details > summary',
  ].join(', ');

  const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
    if (!container) return [];
    return Array.from(container.querySelectorAll(focusableElementsSelector));
  };

  const trapFocus = React.useCallback((container: HTMLElement | null) => {
    if (!container) return () => {};

    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = React.useCallback((previousActiveElement: HTMLElement | null) => {
    if (previousActiveElement && document.contains(previousActiveElement)) {
      previousActiveElement.focus();
    }
  }, []);

  return {
    trapFocus,
    restoreFocus,
    getFocusableElements,
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation(options: {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) {
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    const { key, target } = event;

    // Don't interfere with input elements
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (key) {
      case 'Escape':
        options.onEscape?.();
        break;
      case 'Enter':
        event.preventDefault();
        options.onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        options.onSpace?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        options.onArrowRight?.();
        break;
      case 'Home':
        event.preventDefault();
        options.onHome?.();
        break;
      case 'End':
        event.preventDefault();
        options.onEnd?.();
        break;
    }
  }, [options]);

  return { handleKeyDown };
}

// Hook for screen reader announcements
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => {
      setAnnouncement(message);

      // Clear after announcement to prevent repeated readings
      setTimeout(() => setAnnouncement(''), 1000);
    }, 100);
  }, []);

  const AnnouncementRegion = React.useCallback(({ priority = 'polite' }: { priority?: 'polite' | 'assertive' }) => (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  ), [announcement]);

  return { announce, AnnouncementRegion };
}

// Hook for reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast mode
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Hook for roving tabindex (for complex widgets like tabs, menus)
export function useRovingTabIndex(
  items: React.RefObject<HTMLElement>[],
  activeIndex: number,
  setActiveIndex: (index: number) => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const { handleKeyDown } = useKeyboardNavigation({
    onArrowDown: orientation === 'vertical' ? () => {
      const nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      setActiveIndex(nextIndex);
      items[nextIndex].current?.focus();
    } : undefined,
    onArrowUp: orientation === 'vertical' ? () => {
      const prevIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
      setActiveIndex(prevIndex);
      items[prevIndex].current?.focus();
    } : undefined,
    onArrowRight: orientation === 'horizontal' ? () => {
      const nextIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      setActiveIndex(nextIndex);
      items[nextIndex].current?.focus();
    } : undefined,
    onArrowLeft: orientation === 'horizontal' ? () => {
      const prevIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
      setActiveIndex(prevIndex);
      items[prevIndex].current?.focus();
    } : undefined,
    onHome: () => {
      setActiveIndex(0);
      items[0].current?.focus();
    },
    onEnd: () => {
      const lastIndex = items.length - 1;
      setActiveIndex(lastIndex);
      items[lastIndex].current?.focus();
    },
  });

  return { handleKeyDown };
}

// Hook for accessible disclosure (collapsible content)
export function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const triggerId = React.useId();
  const contentId = React.useId();

  const toggle = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const getTriggerProps = React.useCallback(() => ({
    'aria-expanded': isOpen,
    'aria-controls': contentId,
    id: triggerId,
  }), [isOpen, contentId, triggerId]);

  const getContentProps = React.useCallback(() => ({
    'aria-labelledby': triggerId,
    id: contentId,
    hidden: !isOpen,
  }), [triggerId, contentId, isOpen]);

  return {
    isOpen,
    toggle,
    open,
    close,
    getTriggerProps,
    getContentProps,
  };
}

// Hook for skip links
export function useSkipLinks(links: Array<{ href: string; label: string }>) {
  const skipLinksRef = React.useRef<HTMLDivElement>(null);

  const SkipLinks = React.useCallback(() => (
    <div
      ref={skipLinksRef}
      className="fixed top-0 left-0 z-[9999] p-2 bg-primary-600 text-white transform -translate-y-full focus-within:translate-y-0 transition-transform"
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="block px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
        >
          {link.label}
        </a>
      ))}
    </div>
  ), [links]);

  return { SkipLinks };
}

// Utility for generating unique IDs for accessibility
export function useId(prefix?: string): string {
  const id = React.useId();
  return prefix ? `${prefix}-${id}` : id;
}