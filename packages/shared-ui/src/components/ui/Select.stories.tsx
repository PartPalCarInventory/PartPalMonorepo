import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Select, type SelectOption } from './Select';
import React from 'react';

/**
 * Select components provide searchable dropdowns for PartPal applications.
 * Perfect for vehicle selection, part categories, and filtering options.
 */
const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Select component provides powerful dropdown functionality for PartPal applications.
It includes search, multi-select, grouping, and accessibility features.

## Features
- **Searchable**: Built-in search functionality
- **Multi-select**: Select multiple options
- **Grouping**: Organize options into groups
- **Keyboard navigation**: Full accessibility support
- **Custom rendering**: Flexible option display
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the select',
    },
    searchable: {
      control: 'boolean',
      description: 'Enable search functionality',
    },
    multiple: {
      control: 'boolean',
      description: 'Allow multiple selections',
    },
    clearable: {
      control: 'boolean',
      description: 'Show clear button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    onChange: { action: 'changed' },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for vehicle makes
const vehicleMakes: SelectOption[] = [
  { value: 'bmw', label: 'BMW', group: 'German' },
  { value: 'mercedes', label: 'Mercedes-Benz', group: 'German' },
  { value: 'audi', label: 'Audi', group: 'German' },
  { value: 'volkswagen', label: 'Volkswagen', group: 'German' },
  { value: 'toyota', label: 'Toyota', group: 'Japanese' },
  { value: 'honda', label: 'Honda', group: 'Japanese' },
  { value: 'nissan', label: 'Nissan', group: 'Japanese' },
  { value: 'mazda', label: 'Mazda', group: 'Japanese' },
  { value: 'ford', label: 'Ford', group: 'American' },
  { value: 'chevrolet', label: 'Chevrolet', group: 'American' },
  { value: 'dodge', label: 'Dodge', group: 'American' },
];

// Sample data for part categories
const partCategories: SelectOption[] = [
  { value: 'engine', label: 'Engine Components', description: 'Engine blocks, pistons, valves' },
  { value: 'transmission', label: 'Transmission', description: 'Gearboxes, clutches, torque converters' },
  { value: 'electrical', label: 'Electrical', description: 'Alternators, starters, wiring' },
  { value: 'suspension', label: 'Suspension', description: 'Shocks, struts, springs' },
  { value: 'brakes', label: 'Brake System', description: 'Brake pads, rotors, calipers' },
  { value: 'body', label: 'Body Parts', description: 'Doors, panels, bumpers' },
  { value: 'interior', label: 'Interior', description: 'Seats, dashboard, trim' },
  { value: 'wheels', label: 'Wheels & Tires', description: 'Rims, tires, hubcaps' },
];

/**
 * Basic select with vehicle makes.
 */
export const Default: Story = {
  args: {
    options: vehicleMakes.slice(0, 5),
    placeholder: 'Select a vehicle make...',
    label: 'Vehicle Make',
  },
};

/**
 * Searchable select for finding parts quickly.
 */
export const Searchable: Story = {
  args: {
    options: partCategories,
    searchable: true,
    placeholder: 'Search part categories...',
    label: 'Part Category',
    helper: 'Start typing to search categories',
  },
  parameters: {
    docs: {
      description: {
        story: 'Searchable select that filters options as you type. Perfect for large datasets.',
      },
    },
  },
};

/**
 * Grouped select showing vehicle makes by region.
 */
export const Grouped: Story = {
  args: {
    options: vehicleMakes,
    groupBy: true,
    searchable: true,
    placeholder: 'Select vehicle make...',
    label: 'Vehicle Make',
    helper: 'Organized by manufacturing region',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select with grouped options for better organization of large datasets.',
      },
    },
  },
};

/**
 * Multi-select for choosing multiple part categories.
 */
export const MultiSelect: Story = {
  args: {
    options: partCategories,
    multiple: true,
    searchable: true,
    clearable: true,
    placeholder: 'Select categories...',
    label: 'Part Categories',
    helper: 'Select multiple categories for your search',
    maxSelections: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-select component with search and clear functionality.',
      },
    },
  },
};

/**
 * Select with error state for form validation.
 */
export const WithError: Story = {
  args: {
    options: vehicleMakes.slice(0, 5),
    variant: 'error',
    placeholder: 'Select vehicle make...',
    label: 'Vehicle Make',
    error: 'Please select a vehicle make',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select in error state showing validation feedback.',
      },
    },
  },
};

/**
 * Different sizes for various UI contexts.
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        size="sm"
        options={vehicleMakes.slice(0, 3)}
        placeholder="Small select..."
        label="Small Size"
      />
      <Select
        size="md"
        options={vehicleMakes.slice(0, 3)}
        placeholder="Medium select..."
        label="Medium Size (Default)"
      />
      <Select
        size="lg"
        options={vehicleMakes.slice(0, 3)}
        placeholder="Large select..."
        label="Large Size"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different select sizes for various UI contexts and screen sizes.',
      },
    },
  },
};

/**
 * PartPal-specific select examples for auto parts applications.
 */
export const PartPalExamples: Story = {
  render: () => {
    const [selectedMake, setSelectedMake] = React.useState<string>('');
    const [selectedModel, setSelectedModel] = React.useState<string>('');
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

    const vehicleModels: SelectOption[] = selectedMake === 'bmw' ? [
      { value: 'x3', label: 'X3' },
      { value: 'x5', label: 'X5' },
      { value: '3-series', label: '3 Series' },
      { value: '5-series', label: '5 Series' },
    ] : selectedMake === 'toyota' ? [
      { value: 'hilux', label: 'Hilux' },
      { value: 'corolla', label: 'Corolla' },
      { value: 'camry', label: 'Camry' },
      { value: 'rav4', label: 'RAV4' },
    ] : [];

    const conditions: SelectOption[] = [
      { value: 'new', label: 'New', description: 'Brand new, never used' },
      { value: 'excellent', label: 'Excellent', description: 'Like new condition' },
      { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
      { value: 'fair', label: 'Fair', description: 'Some wear, may need minor repairs' },
      { value: 'poor', label: 'Poor', description: 'Significant wear, for parts only' },
    ];

    return (
      <div className="space-y-6 w-96">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vehicle Selection</h3>

          <Select
            options={vehicleMakes}
            value={selectedMake}
            onChange={setSelectedMake}
            searchable
            groupBy
            placeholder="Select vehicle make..."
            label="Vehicle Make"
            clearable
          />

          <Select
            options={vehicleModels}
            value={selectedModel}
            onChange={setSelectedModel}
            placeholder={selectedMake ? "Select model..." : "Select make first"}
            label="Vehicle Model"
            disabled={!selectedMake}
            clearable
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Part Filtering</h3>

          <Select
            options={partCategories}
            value={selectedCategories}
            onChange={setSelectedCategories}
            multiple
            searchable
            clearable
            placeholder="Select categories..."
            label="Part Categories"
            helper="Select multiple categories to filter parts"
            maxSelections={5}
          />

          <Select
            options={conditions}
            placeholder="Any condition"
            label="Part Condition"
            searchable
            helper="Filter by part condition"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Business Settings</h3>

          <Select
            options={[
              { value: 'public', label: 'Public', description: 'Visible to all users' },
              { value: 'verified', label: 'Verified Only', description: 'Only verified sellers' },
              { value: 'private', label: 'Private', description: 'Invitation only' },
            ]}
            placeholder="Select visibility..."
            label="Listing Visibility"
            helper="Who can see your parts listings"
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world PartPal examples showing cascading selects and multi-category filtering.',
      },
    },
  },
};

/**
 * Select with loading state for dynamic data.
 */
export const Loading: Story = {
  args: {
    options: [],
    loading: true,
    placeholder: 'Loading options...',
    label: 'Dynamic Data',
    helper: 'Options are being loaded from the server',
  },
  parameters: {
    docs: {
      description: {
        story: 'Select component in loading state while fetching options from API.',
      },
    },
  },
};

/**
 * Accessibility demonstration with proper ARIA attributes.
 */
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={vehicleMakes.slice(0, 5)}
        placeholder="Select vehicle make..."
        label="Vehicle Make"
        aria-describedby="make-help"
        helper="Choose the manufacturer of your vehicle"
        id="vehicle-make-select"
      />

      <Select
        options={partCategories.slice(0, 5)}
        placeholder="Select category..."
        label="Part Category"
        error="Please select a part category"
        aria-invalid={true}
        aria-describedby="category-error"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Proper accessibility implementation with ARIA attributes and error handling.',
      },
    },
  },
};