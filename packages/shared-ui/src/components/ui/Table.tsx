import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

const tableVariants = cva(
  'w-full caption-bottom text-sm border-separate border-spacing-0',
  {
    variants: {
      variant: {
        default: 'border border-secondary-200 rounded-lg overflow-hidden',
        bordered: 'border border-secondary-300',
        striped: '',
        simple: '',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  pageSizeOptions?: number[];
}

export interface TableProps<T = any>
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (config: SortConfig) => void;
  pagination?: PaginationConfig;
  onPaginationChange?: (page: number, pageSize: number) => void;
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  emptyText?: React.ReactNode;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  sticky?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({
    className,
    variant,
    size,
    columns,
    data,
    loading = false,
    sortConfig,
    onSort,
    pagination,
    onPaginationChange,
    rowKey = 'id',
    onRowClick,
    emptyText = 'No data available',
    scroll,
    sticky = false,
    ...props
  }, ref) => {
    const getRowKey = (record: any, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return record[rowKey] || index.toString();
    };

    const handleSort = (columnKey: string) => {
      if (!onSort) return;

      let newDirection: SortDirection = 'asc';

      if (sortConfig?.key === columnKey) {
        if (sortConfig.direction === 'asc') {
          newDirection = 'desc';
        } else if (sortConfig.direction === 'desc') {
          newDirection = null;
        }
      }

      onSort({ key: columnKey, direction: newDirection });
    };

    const getSortIcon = (columnKey: string) => {
      if (!sortConfig || sortConfig.key !== columnKey) {
        return <ChevronsUpDown className="h-4 w-4 text-secondary-400" />;
      }

      if (sortConfig.direction === 'asc') {
        return <ChevronUp className="h-4 w-4 text-primary-600" />;
      }

      if (sortConfig.direction === 'desc') {
        return <ChevronDown className="h-4 w-4 text-primary-600" />;
      }

      return <ChevronsUpDown className="h-4 w-4 text-secondary-400" />;
    };

    const tableContent = (
      <table
        ref={ref}
        className={cn(tableVariants({ variant, size, className }))}
        {...props}
      >
        {/* Header */}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'h-12 px-4 text-left align-middle font-medium text-secondary-500 bg-secondary-50 border-b border-secondary-200',
                  sticky && 'sticky top-0 z-10',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer hover:bg-secondary-100 transition-colors',
                  variant === 'default' && 'first:rounded-tl-lg last:rounded-tr-lg',
                  column.headerClassName
                )}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.title}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-32 px-4 text-center text-secondary-500 border-b border-secondary-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  emptyText
                )}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={cn(
                  'border-b border-secondary-200 transition-colors hover:bg-secondary-50',
                  variant === 'striped' && index % 2 === 1 && 'bg-secondary-25',
                  onRowClick && 'cursor-pointer',
                  loading && 'opacity-50'
                )}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => {
                  const value = record[column.key];
                  const cellContent = column.render
                    ? column.render(value, record, index)
                    : value?.toString() || '';

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-secondary-900',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

    const content = scroll ? (
      <div
        className="overflow-auto"
        style={{
          maxWidth: scroll.x,
          maxHeight: scroll.y,
        }}
      >
        {tableContent}
      </div>
    ) : (
      tableContent
    );

    return (
      <div className="w-full">
        {content}
        {pagination && <TablePagination {...pagination} onChange={onPaginationChange} />}
      </div>
    );
  }
);
Table.displayName = 'Table';

// Pagination Component
interface TablePaginationProps extends PaginationConfig {
  onChange?: (page: number, pageSize: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  current,
  pageSize,
  total,
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = (current - 1) * pageSize + 1;
  const endRecord = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onChange?.(page, pageSize);
  };

  const handlePageSizeChange = (newPageSize: string | string[]) => {
    const sizeValue = Array.isArray(newPageSize) ? newPageSize[0] : newPageSize;
    const newSize = parseInt(sizeValue);
    const newPage = Math.min(current, Math.ceil(total / newSize));
    onChange?.(newPage, newSize);
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-secondary-200">
      <div className="flex items-center gap-4">
        {showTotal && (
          <div className="text-sm text-secondary-700">
            {showTotal(total, [startRecord, endRecord])}
          </div>
        )}

        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-700">Show</span>
            <Select
              value={pageSize.toString()}
              onChange={handlePageSizeChange}
              options={pageSizeOptions.map(size => ({
                value: size.toString(),
                label: `${size} / page`,
              }))}
              className="w-auto min-w-[100px]"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={current === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <Button variant="ghost" size="sm" disabled>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={current === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={current === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {showQuickJumper && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-secondary-700">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-16 px-2 py-1 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value);
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Additional Table Components for flexibility
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-secondary-50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-secondary-50 data-[state=selected]:bg-secondary-100',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-secondary-500 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-secondary-500', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants,
};