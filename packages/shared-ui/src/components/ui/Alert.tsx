import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon
} from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-secondary-50 text-secondary-900 border-secondary-200',
        success: 'bg-success-50 text-success-900 border-success-200',
        error: 'bg-error-50 text-error-900 border-error-200',
        warning: 'bg-warning-50 text-warning-900 border-warning-200',
        info: 'bg-primary-50 text-primary-900 border-primary-200',
      },
      style: {
        default: '',
        filled: '',
        outline: 'bg-white',
      },
    },
    compoundVariants: [
      {
        variant: 'success',
        style: 'filled',
        className: 'bg-success-500 text-white border-success-500',
      },
      {
        variant: 'error',
        style: 'filled',
        className: 'bg-error-500 text-white border-error-500',
      },
      {
        variant: 'warning',
        style: 'filled',
        className: 'bg-warning-500 text-white border-warning-500',
      },
      {
        variant: 'info',
        style: 'filled',
        className: 'bg-primary-500 text-white border-primary-500',
      },
    ],
    defaultVariants: {
      variant: 'default',
      style: 'default',
    },
  }
);

const iconMap: Record<string, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

type AlertVariantProps = VariantProps<typeof alertVariants>;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  variant?: AlertVariantProps['variant'];
  style?: AlertVariantProps['style'] | React.CSSProperties;
  title?: string;
  description?: string;
  icon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = 'default',
    style,
    title,
    description,
    icon = true,
    dismissible = false,
    onDismiss,
    children,
    ...props
  }, ref) => {
    const IconComponent = iconMap[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, style: style as any, className }))}
        {...props}
      >
        <div className="flex">
          {icon && IconComponent && (
            <IconComponent className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            {title && (
              <h5 className="mb-1 font-medium leading-none tracking-tight">
                {title}
              </h5>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
            {children && (
              <div className="mt-2">
                {children}
              </div>
            )}
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

// Toast notification component
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white border-secondary-200 text-secondary-900',
        success: 'bg-success-50 border-success-200 text-success-900',
        error: 'bg-error-50 border-error-200 text-error-900',
        warning: 'bg-warning-50 border-warning-200 text-warning-900',
        info: 'bg-primary-50 border-primary-200 text-primary-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    className,
    variant = 'default',
    title,
    description,
    action,
    onClose,
    duration = 5000,
    ...props
  }, ref) => {
    const IconComponent = iconMap[variant || 'default'];

    React.useEffect(() => {
      if (duration > 0 && onClose) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant, className }))}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {IconComponent && (
            <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          <div className="grid gap-1 flex-1">
            {title && (
              <div className="text-sm font-semibold">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {action}
          {onClose && (
            <button
              onClick={onClose}
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close toast"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Alert, Toast, alertVariants, toastVariants };