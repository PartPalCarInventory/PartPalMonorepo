import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Table, type TableColumn } from './Table';
import { Button } from './Button';
import { Badge } from './Badge';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import React from 'react';

/**
 * Tables display structured data in PartPal applications.
 * Perfect for inventory management, part listings, and seller directories.
 */
const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Table component provides powerful data display capabilities for PartPal applications.
It includes sorting, pagination, search, and accessibility features.

## Features
- **Sortable columns**: Click headers to sort data
- **Pagination**: Built-in pagination controls
- **Responsive design**: Horizontal scroll on mobile
- **Accessibility**: Full keyboard navigation and screen reader support
- **Loading states**: Built-in loading indicators
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'striped', 'simple'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the table',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    onSort: { action: 'sorted' },
    onRowClick: { action: 'row clicked' },
  },
  args: {
    onSort: fn(),
    onRowClick: fn(),
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for parts inventory
const partsData = [
  {
    id: '1',
    partName: 'BMW Engine Block',
    partNumber: 'BM-ENG-2018-001',
    vehicle: '2018 BMW X3',
    condition: 'Excellent',
    price: 15000,
    location: 'Johannesburg',
    status: 'available',
    dateAdded: '2024-01-15',
    seller: 'Auto Parts Pro',
  },
  {
    id: '2',
    partName: 'Mercedes Transmission',
    partNumber: 'MB-TRN-2019-445',
    vehicle: '2019 Mercedes C-Class',
    condition: 'Good',
    price: 25000,
    location: 'Cape Town',
    status: 'reserved',
    dateAdded: '2024-01-12',
    seller: 'Premium Motors',
  },
  {
    id: '3',
    partName: 'Ford Tailgate',
    partNumber: 'FD-TG-2020-987',
    vehicle: '2020 Ford F-150',
    condition: 'Fair',
    price: 4500,
    location: 'Durban',
    status: 'sold',
    dateAdded: '2024-01-10',
    seller: 'Truck Parts SA',
  },
  {
    id: '4',
    partName: 'Toyota Headlight',
    partNumber: 'TY-HL-2021-456',
    vehicle: '2021 Toyota Hilux',
    condition: 'Excellent',
    price: 1200,
    location: 'Pretoria',
    status: 'available',
    dateAdded: '2024-01-08',
    seller: 'Toyota Specialists',
  },
  {
    id: '5',
    partName: 'VW Door Panel',
    partNumber: 'VW-DP-2017-234',
    vehicle: '2017 VW Golf',
    condition: 'Good',
    price: 800,
    location: 'Port Elizabeth',
    status: 'available',
    dateAdded: '2024-01-05',
    seller: 'Euro Parts Hub',
  },
];

// Table columns configuration
const partColumns: TableColumn[] = [
  {
    key: 'partName',
    title: 'Part Name',
    sortable: true,
    render: (value, record) => (
      <div>
        <div className="font-medium text-secondary-900">{value}</div>
        <div className="text-sm text-secondary-500">{record.partNumber}</div>
      </div>
    ),
  },
  {
    key: 'vehicle',
    title: 'Vehicle',
    sortable: true,
  },
  {
    key: 'condition',
    title: 'Condition',
    sortable: true,
    render: (value) => (
      <Badge variant={
        value === 'Excellent' ? 'success' :
        value === 'Good' ? 'default' :
        'warning'
      }>
        {value}
      </Badge>
    ),
  },
  {
    key: 'price',
    title: 'Price',
    sortable: true,
    align: 'right',
    render: (value) => `R ${value.toLocaleString()}`,
  },
  {
    key: 'location',
    title: 'Location',
    sortable: true,
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value) => (
      <Badge status={value as any}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    ),
  },
  {
    key: 'seller',
    title: 'Seller',
    sortable: true,
  },
  {
    key: 'actions',
    title: 'Actions',
    width: 120,
    render: (_, record) => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost">
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

/**
 * Basic table with parts inventory data.
 */
export const Default: Story = {
  args: {
    columns: partColumns,
    data: partsData,
    rowKey: 'id',
  },
};

/**
 * Table with sorting functionality.
 */
export const WithSorting: Story = {
  render: () => {
    const [sortConfig, setSortConfig] = React.useState({
      key: 'partName',
      direction: 'asc' as const,
    });

    return (
      <Table
        columns={partColumns}
        data={partsData}
        rowKey="id"
        sortConfig={sortConfig}
        onSort={setSortConfig}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with clickable column headers for sorting. Click any sortable header to change the sort order.',
      },
    },
  },
};

/**
 * Table with pagination for large datasets.
 */
export const WithPagination: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 3;

    const handlePaginationChange = (page: number, size: number) => {
      setCurrentPage(page);
    };

    return (
      <Table
        columns={partColumns}
        data={partsData}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize,
          total: partsData.length,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Showing ${range[0]}-${range[1]} of ${total} parts`,
        }}
        onPaginationChange={handlePaginationChange}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with pagination controls for managing large datasets.',
      },
    },
  },
};

/**
 * Different table variants and styling options.
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Default</h3>
        <Table
          variant="default"
          columns={partColumns.slice(0, 4)}
          data={partsData.slice(0, 2)}
          rowKey="id"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Bordered</h3>
        <Table
          variant="bordered"
          columns={partColumns.slice(0, 4)}
          data={partsData.slice(0, 2)}
          rowKey="id"
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Striped</h3>
        <Table
          variant="striped"
          columns={partColumns.slice(0, 4)}
          data={partsData.slice(0, 3)}
          rowKey="id"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual styles for various use cases and design preferences.',
      },
    },
  },
};

/**
 * Table showing loading state.
 */
export const Loading: Story = {
  args: {
    columns: partColumns,
    data: partsData,
    rowKey: 'id',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table in loading state with skeleton rows and loading indicator.',
      },
    },
  },
};

/**
 * Empty table state.
 */
export const Empty: Story = {
  args: {
    columns: partColumns,
    data: [],
    rowKey: 'id',
    emptyText: (
      <div className="text-center py-8">
        <div className="text-secondary-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0l3-3m0 0l3 3" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-secondary-900">No parts found</h3>
        <p className="text-sm text-secondary-500 mt-1">
          Get started by adding your first part to the inventory.
        </p>
        <Button className="mt-4">Add Part</Button>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty table state with helpful messaging and call-to-action.',
      },
    },
  },
};

/**
 * Responsive table with horizontal scroll.
 */
export const Responsive: Story = {
  render: () => (
    <div className="w-80 border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Mobile View (scroll horizontally)</h3>
      <Table
        columns={partColumns}
        data={partsData.slice(0, 3)}
        rowKey="id"
        scroll={{ x: 800 }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive table that scrolls horizontally on smaller screens.',
      },
    },
  },
};

/**
 * PartPal inventory management table example.
 */
export const InventoryManagement: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
    const [sortConfig, setSortConfig] = React.useState({
      key: 'dateAdded',
      direction: 'desc' as const,
    });

    const inventoryColumns: TableColumn[] = [
      {
        key: 'select',
        title: '',
        width: 50,
        render: (_, record) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(record.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows([...selectedRows, record.id]);
              } else {
                setSelectedRows(selectedRows.filter(id => id !== record.id));
              }
            }}
            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
        ),
      },
      ...partColumns.slice(0, -1),
      {
        key: 'dateAdded',
        title: 'Date Added',
        sortable: true,
        render: (value) => new Date(value).toLocaleDateString(),
      },
    ];

    return (
      <div className="space-y-4">
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-sm font-medium text-primary-800">
              {selectedRows.length} part{selectedRows.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Bulk Edit</Button>
              <Button size="sm" variant="outline">Export</Button>
              <Button size="sm" variant="destructive">Delete</Button>
            </div>
          </div>
        )}

        <Table
          columns={inventoryColumns}
          data={partsData}
          rowKey="id"
          sortConfig={sortConfig}
          onSort={setSortConfig}
          pagination={{
            current: 1,
            pageSize: 10,
            total: partsData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} parts`,
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete inventory management table with selection, sorting, and bulk actions.',
      },
    },
  },
};