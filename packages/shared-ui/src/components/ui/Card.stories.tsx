import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Eye, Edit, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react';

/**
 * Cards are flexible containers for displaying content in PartPal applications.
 * They're perfect for part listings, seller profiles, and information grouping.
 */
const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Card component provides a flexible container for organizing content in PartPal applications.
It's designed to display parts, vehicles, sellers, and other structured information.

## Features
- **Responsive design**: Works on all device sizes
- **Interactive variants**: Hover effects for clickable cards
- **Flexible layout**: Header, content, and footer sections
- **PartPal styling**: Consistent with design system
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outline', 'ghost'],
      description: 'Visual style variant',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding',
    },
    interactive: {
      control: 'boolean',
      description: 'Enable hover effects for interactive cards',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card structure with header, content, and footer.
 */
export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>BMW Engine Block</CardTitle>
        <CardDescription>Complete engine assembly for 2015-2018 BMW X3</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-secondary-600">
          High-performance engine block in excellent condition. Recently serviced with
          all maintenance records available.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Different card variants for various use cases.
 */
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
      <Card variant="default" className="p-6">
        <h3 className="font-semibold">Default</h3>
        <p className="text-sm text-secondary-600 mt-2">Standard card with shadow</p>
      </Card>
      <Card variant="elevated" className="p-6">
        <h3 className="font-semibold">Elevated</h3>
        <p className="text-sm text-secondary-600 mt-2">Enhanced shadow for prominence</p>
      </Card>
      <Card variant="outline" className="p-6">
        <h3 className="font-semibold">Outline</h3>
        <p className="text-sm text-secondary-600 mt-2">Clean border without shadow</p>
      </Card>
      <Card variant="ghost" className="p-6">
        <h3 className="font-semibold">Ghost</h3>
        <p className="text-sm text-secondary-600 mt-2">Minimal styling for subtle content</p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual styles for various contexts and emphasis levels.',
      },
    },
  },
};

/**
 * Interactive card with hover effects, perfect for clickable part listings.
 */
export const Interactive: Story = {
  render: () => (
    <Card interactive className="w-80 cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mercedes Transmission</CardTitle>
          <Badge status="available">Available</Badge>
        </div>
        <CardDescription>Automatic transmission for C-Class vehicles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-secondary-600">
            <MapPin className="mr-2 h-4 w-4" />
            Johannesburg, Gauteng
          </div>
          <div className="flex items-center text-sm text-secondary-600">
            <Calendar className="mr-2 h-4 w-4" />
            Listed 2 days ago
          </div>
          <div className="flex items-center font-semibold text-lg">
            <DollarSign className="mr-1 h-5 w-5 text-primary-600" />
            R 25,000
          </div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with hover effects for clickable content like part listings.',
      },
    },
  },
};

/**
 * Comprehensive part card example used in PartPal marketplace.
 */
export const PartCard: Story = {
  render: () => (
    <Card className="w-80">
      <div className="aspect-video bg-secondary-100 rounded-t-lg flex items-center justify-center">
        <span className="text-secondary-500">Part Image</span>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">Ford F-150 Tailgate</CardTitle>
            <CardDescription>Complete tailgate assembly with handle</CardDescription>
          </div>
          <Badge variant="success">Verified</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-secondary-500">Year:</span>
            <div className="font-medium">2015-2020</div>
          </div>
          <div>
            <span className="text-secondary-500">Condition:</span>
            <div className="font-medium">Good</div>
          </div>
          <div>
            <span className="text-secondary-500">Part #:</span>
            <div className="font-medium">FL3Z-9940602-A</div>
          </div>
          <div>
            <span className="text-secondary-500">Location:</span>
            <div className="font-medium">Cape Town</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
          <div className="text-2xl font-bold text-primary-600">R 4,500</div>
          <div className="text-sm text-secondary-500">Best Offer</div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete part card example showing how to display auto parts in PartPal marketplace.',
      },
    },
  },
};

/**
 * Seller profile card for PartPal's seller directory.
 */
export const SellerCard: Story = {
  render: () => (
    <Card variant="outline" className="w-80">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold">AS</span>
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Auto Spares Joburg</CardTitle>
            <CardDescription>Premium auto parts supplier</CardDescription>
          </div>
          <Badge variant="success">Verified</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-secondary-500">Rating:</span>
            <div className="font-medium">4.8/5 ⭐</div>
          </div>
          <div>
            <span className="text-secondary-500">Parts:</span>
            <div className="font-medium">1,247</div>
          </div>
          <div>
            <span className="text-secondary-500">Years:</span>
            <div className="font-medium">12 years</div>
          </div>
          <div>
            <span className="text-secondary-500">Response:</span>
            <div className="font-medium">< 2 hours</div>
          </div>
        </div>
        <div className="flex items-center text-sm text-secondary-600">
          <MapPin className="mr-2 h-4 w-4" />
          Johannesburg, Gauteng • 15km away
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Inventory</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Seller profile card showcasing seller information and credentials.',
      },
    },
  },
};

/**
 * Inventory summary card for PartPal IMS dashboard.
 */
export const InventoryCard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-secondary-600">Total Parts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,247</div>
          <p className="text-sm text-success-600 mt-1">+12 this week</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-secondary-600">Listed Online</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">856</div>
          <p className="text-sm text-primary-600 mt-1">68.6% of inventory</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-secondary-600">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R 145,890</div>
          <p className="text-sm text-success-600 mt-1">+23% vs last month</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard summary cards for displaying key metrics in PartPal IMS.',
      },
    },
  },
};

/**
 * Vehicle information card for part compatibility display.
 */
export const VehicleCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>2018 BMW X3 xDrive30i</CardTitle>
            <CardDescription>Sport Activity Vehicle</CardDescription>
          </div>
          <Badge>Compatible</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-secondary-500">Engine:</span>
            <div className="font-medium">2.0L Turbo</div>
          </div>
          <div>
            <span className="text-secondary-500">VIN:</span>
            <div className="font-medium">5UX***123</div>
          </div>
          <div>
            <span className="text-secondary-500">Transmission:</span>
            <div className="font-medium">8-Speed Auto</div>
          </div>
          <div>
            <span className="text-secondary-500">Drive:</span>
            <div className="font-medium">AWD</div>
          </div>
        </div>
        <div className="pt-2 border-t border-secondary-200">
          <div className="text-sm text-secondary-600">Available Parts: 47</div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Browse Parts</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vehicle information card showing compatibility and specifications.',
      },
    },
  },
};