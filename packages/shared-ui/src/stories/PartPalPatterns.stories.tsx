import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import React from 'react';

// Import all components for the patterns
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { Select, type SelectOption } from '../components/ui/Select';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '../components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { FormField, Input, Textarea, RadioGroup, type RadioOption } from '../components/forms/Form';
import { Loading, Skeleton } from '../components/ui/Loading';
import { Alert } from '../components/ui/Alert';

import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Phone,
  Mail,
  Clock,
  Package,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react';

/**
 * Complete PartPal application patterns and workflows.
 * Real-world examples showing how components work together.
 */
const meta = {
  title: 'PartPal/Patterns',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Complete application patterns for PartPal's auto parts management system.
These examples show how to combine components for real-world use cases.

## Patterns Included
- **Inventory Management**: Full CRUD operations for parts
- **Marketplace Search**: Advanced filtering and browsing
- **Seller Dashboard**: Business management interface
- **Part Details**: Comprehensive part information display
- **User Workflows**: Complete user journeys
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data
const partsData = [
  {
    id: '1',
    name: 'BMW X3 Engine Block',
    partNumber: 'BMW-ENG-2018-001',
    vehicle: '2018 BMW X3 xDrive30i',
    condition: 'Excellent',
    price: 15000,
    location: 'Johannesburg, GP',
    status: 'available',
    seller: 'Auto Parts Pro',
    dateAdded: '2024-01-15',
    images: 3,
    views: 124,
    inquiries: 8,
  },
  {
    id: '2',
    name: 'Mercedes C-Class Transmission',
    partNumber: 'MB-TRN-2019-445',
    vehicle: '2019 Mercedes C-Class',
    condition: 'Good',
    price: 25000,
    location: 'Cape Town, WC',
    status: 'reserved',
    seller: 'Premium Motors',
    dateAdded: '2024-01-12',
    images: 5,
    views: 89,
    inquiries: 12,
  },
  // Add more sample data...
];

const vehicleMakes: SelectOption[] = [
  { value: 'bmw', label: 'BMW', group: 'German' },
  { value: 'mercedes', label: 'Mercedes-Benz', group: 'German' },
  { value: 'audi', label: 'Audi', group: 'German' },
  { value: 'toyota', label: 'Toyota', group: 'Japanese' },
  { value: 'honda', label: 'Honda', group: 'Japanese' },
  { value: 'ford', label: 'Ford', group: 'American' },
];

/**
 * Complete inventory management dashboard for PartPal IMS.
 */
export const InventoryManagement: Story = {
  render: () => {
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterMake, setFilterMake] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('');

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
      {
        key: 'name',
        title: 'Part Details',
        sortable: true,
        render: (_, record) => (
          <div>
            <div className="font-medium text-secondary-900">{record.name}</div>
            <div className="text-sm text-secondary-500">{record.partNumber}</div>
            <div className="text-xs text-secondary-400">{record.vehicle}</div>
          </div>
        ),
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
        key: 'performance',
        title: 'Performance',
        render: (_, record) => (
          <div className="text-sm">
            <div>{record.views} views</div>
            <div className="text-secondary-500">{record.inquiries} inquiries</div>
          </div>
        ),
      },
      {
        key: 'actions',
        title: 'Actions',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label={`View ${record.name}`}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" aria-label={`Edit ${record.name}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" aria-label={`Delete ${record.name}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="min-h-screen bg-secondary-50">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Inventory Management</h1>
                <p className="text-secondary-600">Manage your auto parts inventory</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Part
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="Search Parts">
                  <Input
                    placeholder="Search by name, number, or vehicle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </FormField>

                <FormField label="Vehicle Make">
                  <Select
                    options={[{ value: '', label: 'All Makes' }, ...vehicleMakes]}
                    value={filterMake}
                    onChange={setFilterMake}
                    placeholder="Filter by make"
                  />
                </FormField>

                <FormField label="Status">
                  <Select
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'available', label: 'Available' },
                      { value: 'reserved', label: 'Reserved' },
                      { value: 'sold', label: 'Sold' },
                    ]}
                    value={filterStatus}
                    onChange={setFilterStatus}
                    placeholder="Filter by status"
                  />
                </FormField>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <Alert variant="info" className="mb-4">
              <div className="flex items-center justify-between">
                <span>
                  {selectedRows.length} part{selectedRows.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Bulk Edit</Button>
                  <Button size="sm" variant="outline">List on Marketplace</Button>
                  <Button size="sm" variant="destructive">Delete</Button>
                </div>
              </div>
            </Alert>
          )}

          {/* Inventory Table */}
          <Card>
            <Table
              columns={inventoryColumns}
              data={partsData}
              rowKey="id"
              pagination={{
                current: 1,
                pageSize: 10,
                total: partsData.length,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} parts`,
              }}
            />
          </Card>
        </div>

        {/* Add Part Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          size="lg"
          title="Add New Part"
          description="Add a new part to your inventory"
        >
          <ModalContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Part Name" required>
                <Input placeholder="e.g., Engine Block" />
              </FormField>
              <FormField label="Part Number">
                <Input placeholder="e.g., BMW-12345" />
              </FormField>
            </div>

            <FormField label="Vehicle Compatibility" required>
              <Input placeholder="e.g., 2018 BMW X3" />
            </FormField>

            <FormField label="Description">
              <Textarea placeholder="Detailed part description..." rows={3} />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Condition" required>
                <Select
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'excellent', label: 'Excellent' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' },
                  ]}
                  placeholder="Select condition"
                />
              </FormField>
              <FormField label="Price (ZAR)" required>
                <Input type="number" placeholder="0.00" />
              </FormField>
              <FormField label="Quantity">
                <Input type="number" placeholder="1" defaultValue="1" />
              </FormField>
            </div>
          </ModalContent>

          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddModal(false)}>
              Add Part
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete inventory management system with filtering, bulk actions, and CRUD operations.',
      },
    },
  },
};

/**
 * PartPal marketplace browsing and search interface.
 */
export const MarketplaceBrowsing: Story = {
  render: () => {
    const [searchResults, setSearchResults] = React.useState(partsData);
    const [loading, setLoading] = React.useState(false);
    const [selectedPart, setSelectedPart] = React.useState<any>(null);

    const handleSearch = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    };

    return (
      <div className="min-h-screen bg-secondary-50">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200">
          <div className="px-6 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                Find Auto Parts
              </h1>
              <p className="text-secondary-600">
                Search thousands of quality auto parts from verified sellers
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Search Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="What are you looking for?">
                    <Input
                      placeholder="Part name, number, or description..."
                      icon={<Search className="h-4 w-4" />}
                    />
                  </FormField>

                  <FormField label="Vehicle Make">
                    <Select
                      options={vehicleMakes}
                      placeholder="Select make"
                      searchable
                      groupBy
                    />
                  </FormField>

                  <FormField label="Vehicle Model">
                    <Select
                      options={[
                        { value: 'x3', label: 'X3' },
                        { value: 'x5', label: 'X5' },
                        { value: '3-series', label: '3 Series' },
                      ]}
                      placeholder="Select model"
                      disabled
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <FormField label="Year From">
                    <Input type="number" placeholder="2015" />
                  </FormField>
                  <FormField label="Year To">
                    <Input type="number" placeholder="2023" />
                  </FormField>
                  <FormField label="Max Price">
                    <Input type="number" placeholder="50000" />
                  </FormField>
                  <FormField label="Location">
                    <Input placeholder="City or Province" />
                  </FormField>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={handleSearch}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Part Category">
                    <Select
                      options={[
                        { value: 'engine', label: 'Engine' },
                        { value: 'transmission', label: 'Transmission' },
                        { value: 'brakes', label: 'Brakes' },
                        { value: 'suspension', label: 'Suspension' },
                      ]}
                      placeholder="All categories"
                    />
                  </FormField>

                  <FormField label="Condition">
                    <div className="space-y-2">
                      {['New', 'Excellent', 'Good', 'Fair'].map((condition) => (
                        <label key={condition} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 mr-2"
                          />
                          <span className="text-sm">{condition}</span>
                        </label>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Seller Type">
                    <div className="space-y-2">
                      {['Verified Dealer', 'Auto Shop', 'Individual'].map((type) => (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500 mr-2"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </FormField>
                </CardContent>
              </Card>
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-secondary-600">
                  {loading ? 'Searching...' : `Found ${searchResults.length} parts`}
                </div>
                <Select
                  options={[
                    { value: 'relevance', label: 'Best Match' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'newest', label: 'Newest First' },
                  ]}
                  value="relevance"
                  className="w-48"
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Skeleton variant="image" className="h-32" />
                          <Skeleton variant="title" />
                          <Skeleton variant="text" width="3/4" />
                          <div className="flex justify-between">
                            <Skeleton variant="text" width="1/3" />
                            <Skeleton variant="button" width="1/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((part) => (
                    <Card
                      key={part.id}
                      interactive
                      className="cursor-pointer"
                      onClick={() => setSelectedPart(part)}
                    >
                      <div className="aspect-video bg-secondary-100 rounded-t-xl flex items-center justify-center">
                        <Package className="h-12 w-12 text-secondary-400" />
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-secondary-900 line-clamp-1">
                              {part.name}
                            </h3>
                            <p className="text-sm text-secondary-600">{part.vehicle}</p>
                          </div>
                          <Badge status={part.status as any} />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-secondary-600">
                            <MapPin className="mr-1 h-4 w-4" />
                            {part.location}
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-primary-600">
                                R {part.price.toLocaleString()}
                              </div>
                              <div className="text-xs text-secondary-500">
                                by {part.seller}
                              </div>
                            </div>

                            <div className="flex items-center text-sm text-secondary-500">
                              <Eye className="mr-1 h-4 w-4" />
                              {part.views}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Part Details Modal */}
        {selectedPart && (
          <Modal
            isOpen={!!selectedPart}
            onClose={() => setSelectedPart(null)}
            size="2xl"
            title={selectedPart.name}
            description={`${selectedPart.partNumber} • ${selectedPart.vehicle}`}
          >
            <ModalContent>
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                  <TabsTrigger value="seller">Seller Info</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="aspect-square bg-secondary-100 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-secondary-400" />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-secondary-700">
                          Condition
                        </label>
                        <div className="mt-1">
                          <Badge variant="success">{selectedPart.condition}</Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-secondary-700">
                          Price
                        </label>
                        <div className="text-2xl font-bold text-primary-600 mt-1">
                          R {selectedPart.price.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-secondary-700">
                          Location
                        </label>
                        <div className="flex items-center mt-1 text-secondary-600">
                          <MapPin className="mr-1 h-4 w-4" />
                          {selectedPart.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compatibility">
                  <div className="text-center py-8 text-secondary-500">
                    Vehicle compatibility information would be displayed here.
                  </div>
                </TabsContent>

                <TabsContent value="seller">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {selectedPart.seller.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{selectedPart.seller}</h4>
                        <div className="flex items-center text-sm text-secondary-600">
                          <Star className="mr-1 h-4 w-4 fill-current text-yellow-400" />
                          4.8 (124 reviews)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-500">Response time:</span>
                        <div className="font-medium">Usually within 2 hours</div>
                      </div>
                      <div>
                        <span className="text-secondary-500">Member since:</span>
                        <div className="font-medium">January 2020</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ModalContent>

            <ModalFooter>
              <div className="flex items-center space-x-3 w-full">
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Seller
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button className="flex-1">
                  Make Offer
                </Button>
              </div>
            </ModalFooter>
          </Modal>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete marketplace browsing experience with search, filters, and part details.',
      },
    },
  },
};