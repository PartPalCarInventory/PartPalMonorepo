import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// Form validation types
export type ValidationRule = {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: any) => boolean | string;
};

export type FieldError = {
  type: string;
  message: string;
};

// Form Field Container
const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      variant: {
        default: '',
        inline: 'flex items-center space-y-0 space-x-4',
        stacked: 'space-y-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  description?: string;
  error?: FieldError | string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    className,
    variant,
    label,
    description,
    error,
    required,
    children,
    ...props
  }, ref) => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    const fieldId = React.useId();

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ variant, className }))}
        {...props}
      >
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-secondary-700',
              variant === 'inline' && 'min-w-[120px]'
            )}
          >
            {label}
            {required && <span className="ml-1 text-error-500">*</span>}
          </label>
        )}

        <div className={cn(variant === 'inline' && 'flex-1')}>
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-invalid': !!error,
            'aria-describedby': `${fieldId}-description ${fieldId}-error`,
          })}

          {description && (
            <p
              id={`${fieldId}-description`}
              className="text-sm text-secondary-500"
            >
              {description}
            </p>
          )}

          {errorMessage && (
            <p
              id={`${fieldId}-error`}
              className="flex items-center text-sm text-error-600"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }
);
FormField.displayName = 'FormField';

// Enhanced Input with validation
const inputVariants = cva(
  'flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch:min-h-[48px]',
  {
    variants: {
      variant: {
        default: 'border-secondary-300 focus:border-primary-500',
        error: 'border-error-300 focus:border-error-500 focus-visible:ring-error-500',
        success: 'border-success-300 focus:border-success-500 focus-visible:ring-success-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs min-h-[36px] touch:min-h-[44px]',
        md: 'h-10 px-3 text-sm min-h-[44px] touch:min-h-[48px]',
        lg: 'h-12 px-4 text-base min-h-[48px] touch:min-h-[52px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: FieldError | string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  validationRules?: ValidationRule;
  showValidation?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    variant,
    size,
    error,
    icon,
    suffix,
    validationRules,
    showValidation = false,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [validationState, setValidationState] = React.useState<'valid' | 'invalid' | null>(null);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const validateValue = React.useCallback((value: string) => {
      if (!validationRules || !showValidation) return null;

      if (validationRules.required && !value.trim()) {
        return 'invalid';
      }

      if (validationRules.minLength) {
        const min = typeof validationRules.minLength === 'number'
          ? validationRules.minLength
          : validationRules.minLength.value;
        if (value.length < min) return 'invalid';
      }

      if (validationRules.pattern) {
        const pattern = validationRules.pattern instanceof RegExp
          ? validationRules.pattern
          : validationRules.pattern.value;
        if (!pattern.test(value)) return 'invalid';
      }

      return 'valid';
    }, [validationRules, showValidation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (showValidation) {
        const validation = validateValue(value);
        setValidationState(validation);
      }

      props.onChange?.(e);
    };

    const effectiveVariant = error
      ? 'error'
      : validationState === 'valid'
        ? 'success'
        : validationState === 'invalid'
          ? 'error'
          : variant;

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
            {icon}
          </div>
        )}

        <input
          type={inputType}
          className={cn(
            inputVariants({ variant: effectiveVariant, size }),
            icon && 'pl-10',
            (suffix || isPassword) && 'pr-10',
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />

        {(suffix || isPassword || showValidation) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {showValidation && validationState && (
              validationState === 'valid' ? (
                <CheckCircle2 className="h-4 w-4 text-success-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-error-500" />
              )
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {suffix}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: FieldError | string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, resize = 'vertical', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-error-300 focus:border-error-500 focus-visible:ring-error-500' : 'border-secondary-300 focus:border-primary-500',
          resize === 'none' && 'resize-none',
          resize === 'horizontal' && 'resize-x',
          resize === 'vertical' && 'resize-y',
          resize === 'both' && 'resize',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// Checkbox component
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: FieldError | string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, indeterminate, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const id = React.useId();

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    React.useImperativeHandle(ref, () => checkboxRef.current!);

    return (
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          ref={checkboxRef}
          id={id}
          className={cn(
            'mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            error && 'border-error-300',
            className
          )}
          {...props}
        />

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label htmlFor={id} className="text-sm font-medium text-secondary-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-secondary-500">{description}</p>
            )}
            {error && (
              <p className="text-sm text-error-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {typeof error === 'string' ? error : error.message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// Radio Group component
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: FieldError | string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({
    name,
    options,
    value,
    defaultValue,
    onChange,
    error,
    direction = 'vertical',
    className,
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const currentValue = value ?? internalValue;

    const handleChange = (optionValue: string) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-3',
          direction === 'horizontal' && 'flex space-y-0 space-x-6',
          className
        )}
        role="radiogroup"
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-start space-x-3">
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={currentValue === option.value}
                onChange={() => handleChange(option.value)}
                disabled={option.disabled}
                className={cn(
                  'mt-1 h-4 w-4 text-primary-600 border-secondary-300 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  error && 'border-error-300'
                )}
              />
              <div className="flex-1">
                <label htmlFor={id} className="text-sm font-medium text-secondary-700 cursor-pointer">
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-sm text-secondary-500">{option.description}</p>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <p className="text-sm text-error-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {typeof error === 'string' ? error : error.message}
          </p>
        )}
      </div>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

// Form Layout Components
const FormSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
  }
>(({ className, title, description, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-6', className)}
    {...props}
  >
    {(title || description) && (
      <div className="border-b border-secondary-200 pb-4">
        {title && (
          <h3 className="text-lg font-medium text-secondary-900">{title}</h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-secondary-600">{description}</p>
        )}
      </div>
    )}
    <div className="space-y-6">
      {children}
    </div>
  </div>
));
FormSection.displayName = 'FormSection';

const FormGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
  }
>(({ className, cols = 2, gap = 'md', children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid',
      cols === 1 && 'grid-cols-1',
      cols === 2 && 'grid-cols-1 md:grid-cols-2',
      cols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      gap === 'sm' && 'gap-4',
      gap === 'md' && 'gap-6',
      gap === 'lg' && 'gap-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
FormGrid.displayName = 'FormGrid';

export {
  FormField,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  FormSection,
  FormGrid,
  inputVariants,
  formFieldVariants,
};