import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { Button } from './Button';

const overlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center p-4',
  {
    variants: {
      blur: {
        none: 'bg-black/50',
        light: 'bg-black/40 backdrop-blur-sm',
        medium: 'bg-black/60 backdrop-blur-md',
        heavy: 'bg-black/70 backdrop-blur-lg',
      },
    },
    defaultVariants: {
      blur: 'medium',
    },
  }
);

const modalVariants = cva(
  'relative bg-white rounded-xl shadow-hard border border-secondary-200 w-full max-h-[90vh] overflow-hidden animate-fade-in',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
      position: {
        center: 'mx-auto',
        top: 'mx-auto mt-8',
        bottom: 'mx-auto mb-8 mt-auto',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'center',
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants>,
    VariantProps<typeof overlayVariants> {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventBodyScroll?: boolean;
  children: React.ReactNode;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    className,
    size,
    position,
    blur,
    isOpen,
    onClose,
    title,
    description,
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    preventBodyScroll = true,
    children,
    ...props
  }, ref) => {
    const [mounted, setMounted] = React.useState(false);

    // Handle body scroll prevention
    React.useEffect(() => {
      if (!preventBodyScroll) return;

      if (isOpen) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [isOpen, preventBodyScroll]);

    // Handle escape key
    React.useEffect(() => {
      if (!closeOnEscape || !onClose) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, closeOnEscape, onClose]);

    // Handle mount state for animation
    React.useEffect(() => {
      if (isOpen) {
        setMounted(true);
      } else {
        const timer = setTimeout(() => setMounted(false), 150);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && onClose && event.target === event.currentTarget) {
        onClose();
      }
    };

    if (!mounted && !isOpen) return null;

    return (
      <div
        className={cn(
          overlayVariants({ blur }),
          !isOpen && 'animate-fade-out'
        )}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div
          ref={ref}
          className={cn(
            modalVariants({ size, position }),
            !isOpen && 'animate-slide-out',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div className="flex-1">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-secondary-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-secondary-600"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="ml-4 h-8 w-8"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';

// Modal Content Components
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 border-b border-secondary-200', className)}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold text-secondary-900', className)}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-secondary-600', className)}
    {...props}
  />
));
ModalDescription.displayName = 'ModalDescription';

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6', className)}
    {...props}
  />
));
ModalContent.displayName = 'ModalContent';

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end space-x-2 p-6 border-t border-secondary-200 bg-secondary-50',
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

// Confirmation Modal Component
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'success' | 'warning';
  loading?: boolean;
}

const ConfirmModal = React.forwardRef<HTMLDivElement, ConfirmModalProps>(
  ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Are you sure you want to continue?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'default',
    loading = false,
  }, ref) => {
    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        title={title}
        description={description}
        showCloseButton={false}
      >
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
);
ConfirmModal.displayName = 'ConfirmModal';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ConfirmModal,
  modalVariants,
  overlayVariants,
};