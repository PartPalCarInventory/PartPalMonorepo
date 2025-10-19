import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';
import { Plus, Download, Trash2, Eye } from 'lucide-react';

/**
 * The Button component is the foundation of interactive elements in PartPal.
 * It supports multiple variants, sizes, and states optimized for auto parts management.
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Button component provides consistent interactive elements across PartPal applications.
It's designed with accessibility, mobile-first approach, and the auto parts industry in mind.

## Features
- **Touch-friendly**: Minimum 44px touch targets
- **Keyboard accessible**: Full keyboard navigation
- **Screen reader friendly**: Proper ARIA attributes
- **PartPal branding**: Consistent with brand colors
- **Loading states**: Built-in loading indicators
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'accent', 'success', 'warning'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'icon'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    onClick: { action: 'clicked' },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default button style using PartPal's primary brand color.
 * Perfect for primary actions like "Add Part" or "Save Changes".
 */
export const Default: Story = {
  args: {
    children: 'Add Part',
  },
};

/**
 * All available button variants showcasing PartPal's design system.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual styles for various use cases in PartPal applications.',
      },
    },
  },
};

/**
 * Button sizes optimized for different contexts and devices.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various button sizes for different UI contexts. Icon buttons are perfect for compact interfaces.',
      },
    },
  },
};

/**
 * Buttons with icons commonly used in PartPal applications.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Part
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="secondary">
        <Eye className="mr-2 h-4 w-4" />
        Preview
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with icons for common PartPal actions. Icons should be 16px (h-4 w-4) with mr-2 spacing.',
      },
    },
  },
};

/**
 * Button states including disabled and loading.
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different button states for various interaction scenarios.',
      },
    },
  },
};

/**
 * PartPal-specific button usage examples for auto parts management.
 */
export const PartPalExamples: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Inventory Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-secondary-700">Inventory Management</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Add to Inventory
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Catalog
          </Button>
          <Button variant="secondary">Bulk Edit</Button>
        </div>
      </div>

      {/* Part Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-secondary-700">Part Management</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" size="sm">List on Marketplace</Button>
          <Button variant="success" size="sm">Mark as Sold</Button>
          <Button variant="warning" size="sm">Flag for Review</Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Part
          </Button>
        </div>
      </div>

      {/* Vehicle Search */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-secondary-700">Vehicle Search</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Search Parts</Button>
          <Button variant="ghost">Clear Filters</Button>
          <Button variant="link">Advanced Search</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world button usage examples from PartPal applications.',
      },
    },
  },
};

/**
 * Accessibility demonstration showing proper button implementation.
 */
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <Button aria-label="Add BMW engine block to inventory">
        <Plus className="mr-2 h-4 w-4" />
        Add Part
      </Button>
      <Button
        variant="destructive"
        aria-label="Delete transmission part permanently"
        aria-describedby="delete-help"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
      <p id="delete-help" className="text-sm text-secondary-600">
        This action cannot be undone
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Proper accessibility implementation with ARIA labels and descriptions.',
      },
    },
  },
};