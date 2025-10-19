import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { ChevronDown, Search, Check, X } from 'lucide-react';

const selectTriggerVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch:min-h-[48px]',
  {
    variants: {
      variant: {
        default: 'border-secondary-300 text-secondary-900 hover:border-secondary-400',
        error: 'border-error-300 text-error-900 focus:ring-error-500',
        success: 'border-success-300 text-success-900 focus:ring-success-500',
      },
      size: {
        sm: 'h-8 text-xs min-h-[36px] touch:min-h-[44px]',
        md: 'h-10 text-sm min-h-[44px] touch:min-h-[48px]',
        lg: 'h-12 text-base min-h-[48px] touch:min-h-[52px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  group?: string;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  label?: string;
  helper?: string;
  multiple?: boolean;
  maxSelections?: number;
  onChange?: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
  noOptionsMessage?: string;
  groupBy?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({
    className,
    variant,
    size,
    options,
    value,
    defaultValue,
    placeholder = 'Select option...',
    searchable = false,
    clearable = false,
    disabled = false,
    loading = false,
    error,
    label,
    helper,
    multiple = false,
    maxSelections,
    onChange,
    onSearch,
    noOptionsMessage = 'No options found',
    groupBy = false,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      multiple
        ? (Array.isArray(value) ? value : value ? [value] : [])
        : value ? [value] : defaultValue ? [defaultValue] : []
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      return options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }, [options, searchQuery]);

    // Group options if needed
    const groupedOptions = React.useMemo(() => {
      if (!groupBy) return { '': filteredOptions };

      return filteredOptions.reduce((groups, option) => {
        const group = option.group || 'Other';
        if (!groups[group]) groups[group] = [];
        groups[group].push(option);
        return groups;
      }, {} as Record<string, SelectOption[]>);
    }, [filteredOptions, groupBy]);

    // Handle option selection
    const handleOptionSelect = (optionValue: string) => {
      let newValues: string[];

      if (multiple) {
        if (selectedValues.includes(optionValue)) {
          newValues = selectedValues.filter(v => v !== optionValue);
        } else {
          if (maxSelections && selectedValues.length >= maxSelections) return;
          newValues = [...selectedValues, optionValue];
        }
      } else {
        newValues = [optionValue];
        setIsOpen(false);
      }

      setSelectedValues(newValues);
      onChange?.(multiple ? newValues : newValues[0] || '');
    };

    // Handle clear selection
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedValues([]);
      onChange?.(multiple ? [] : '');
    };

    // Handle search
    const handleSearch = (query: string) => {
      setSearchQuery(query);
      onSearch?.(query);
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Get display value
    const getDisplayValue = () => {
      if (selectedValues.length === 0) return placeholder;

      if (multiple) {
        if (selectedValues.length === 1) {
          const option = options.find(opt => opt.value === selectedValues[0]);
          return option?.label || selectedValues[0];
        }
        return `${selectedValues.length} selected`;
      }

      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    };

    const id = React.useId();
    const inputId = props.id || id;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative" ref={containerRef}>
          <div
            ref={ref}
            className={cn(
              selectTriggerVariants({
                variant: error ? 'error' : variant,
                size,
                className
              }),
              disabled && 'cursor-not-allowed',
              'cursor-pointer'
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            id={inputId}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            {...props}
          >
            <span className={cn(
              'truncate',
              selectedValues.length === 0 && 'text-secondary-500'
            )}>
              {getDisplayValue()}
            </span>

            <div className="flex items-center space-x-1">
              {clearable && selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-secondary-100 rounded transition-colors"
                  aria-label="Clear selection"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-secondary-500 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-medium max-h-64 overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-secondary-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search options..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto">
                {Object.keys(groupedOptions).length === 0 ? (
                  <div className="p-3 text-sm text-secondary-500 text-center">
                    {noOptionsMessage}
                  </div>
                ) : (
                  Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                    <div key={groupName}>
                      {groupBy && groupName && (
                        <div className="px-3 py-2 text-xs font-medium text-secondary-500 bg-secondary-50 border-b border-secondary-200">
                          {groupName}
                        </div>
                      )}
                      {groupOptions.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-secondary-50',
                            option.disabled && 'opacity-50 cursor-not-allowed',
                            selectedValues.includes(option.value) && 'bg-primary-50 text-primary-700'
                          )}
                          onClick={() => !option.disabled && handleOptionSelect(option.value)}
                          role="option"
                          aria-selected={selectedValues.includes(option.value)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-secondary-500">{option.description}</div>
                            )}
                          </div>
                          {selectedValues.includes(option.value) && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="mt-2 text-sm text-secondary-500">
            {helper}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectTriggerVariants };