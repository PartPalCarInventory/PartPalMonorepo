import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import {
  FormField,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  FormSection,
  FormGrid,
  type RadioOption,
} from './Form';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Search, Mail, Lock, User, Phone } from 'lucide-react';
import React from 'react';

/**
 * Form components provide comprehensive form building capabilities for PartPal.
 * Includes validation, accessibility, and mobile-optimized inputs.
 */
const meta = {
  title: 'Components/Forms',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Form components provide a complete form building system for PartPal applications.
All components include accessibility features, validation, and mobile optimization.

## Features
- **Validation**: Built-in validation with error states
- **Accessibility**: Proper labeling and ARIA attributes
- **Mobile-first**: Touch-friendly inputs with proper sizing
- **Flexible layouts**: Grid and section components for organization
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'inline', 'stacked'],
      description: 'Layout variant',
    },
    required: {
      control: 'boolean',
      description: 'Mark field as required',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic form field with input.
 */
export const BasicField: Story = {
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="Enter part name..." />
    </FormField>
  ),
  args: {
    label: 'Part Name',
    description: 'Enter the official part name or description',
    required: true,
  },
};

/**
 * Form field with error state.
 */
export const WithError: Story = {
  render: () => (
    <FormField
      label="Part Number"
      description="Enter the manufacturer's part number"
      error="Part number is required and must be valid"
      required
    >
      <Input
        placeholder="Enter part number..."
        aria-invalid="true"
      />
    </FormField>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form field showing validation error with proper ARIA attributes.',
      },
    },
  },
};

/**
 * All input types and variants.
 */
export const InputTypes: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <FormField label="Search Parts" description="Search by name, number, or vehicle">
        <Input
          type="search"
          placeholder="Search..."
          icon={<Search className="h-4 w-4" />}
        />
      </FormField>

      <FormField label="Email Address" required>
        <Input
          type="email"
          placeholder="seller@example.com"
          icon={<Mail className="h-4 w-4" />}
        />
      </FormField>

      <FormField label="Password" required>
        <Input
          type="password"
          placeholder="Enter password..."
          icon={<Lock className="h-4 w-4" />}
        />
      </FormField>

      <FormField label="Phone Number">
        <Input
          type="tel"
          placeholder="+27 12 345 6789"
          icon={<Phone className="h-4 w-4" />}
        />
      </FormField>

      <FormField label="Part Price" description="Price in South African Rand">
        <Input
          type="number"
          placeholder="0.00"
          suffix={<span className="text-secondary-500">ZAR</span>}
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various input types with icons and suffixes for different data types.',
      },
    },
  },
};

/**
 * Textarea for longer content.
 */
export const TextareaExample: Story = {
  render: () => (
    <div className="w-96">
      <FormField
        label="Part Description"
        description="Provide detailed information about the part's condition and history"
        required
      >
        <Textarea
          placeholder="Describe the part condition, any damage, maintenance history, and other relevant details..."
          rows={4}
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Textarea component for longer text input with proper labeling.',
      },
    },
  },
};

/**
 * Checkbox components with different states.
 */
export const CheckboxExamples: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Checkbox
        label="List on Marketplace"
        description="Make this part visible to potential buyers"
      />

      <Checkbox
        label="Accept Best Offers"
        description="Allow buyers to make offers below the asking price"
        defaultChecked
      />

      <Checkbox
        label="Include Shipping"
        description="Shipping costs included in price"
        error="Please specify shipping terms"
      />

      <Checkbox
        label="Certified Part"
        description="This part has been professionally inspected"
        disabled
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Checkbox variations with labels, descriptions, and different states.',
      },
    },
  },
};

/**
 * Radio group for single selection.
 */
export const RadioGroupExample: Story = {
  render: () => {
    const conditionOptions: RadioOption[] = [
      {
        value: 'new',
        label: 'New',
        description: 'Brand new, never used or installed',
      },
      {
        value: 'excellent',
        label: 'Excellent',
        description: 'Like new with no visible wear',
      },
      {
        value: 'good',
        label: 'Good',
        description: 'Minor wear but fully functional',
      },
      {
        value: 'fair',
        label: 'Fair',
        description: 'Some wear, may need minor repairs',
      },
      {
        value: 'poor',
        label: 'Poor',
        description: 'Significant wear, suitable for parts only',
      },
    ];

    return (
      <div className="w-96">
        <FormField
          label="Part Condition"
          description="Select the condition that best describes this part"
          required
        >
          <RadioGroup
            name="condition"
            options={conditionOptions}
            defaultValue="good"
          />
        </FormField>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio group for selecting part condition with descriptions.',
      },
    },
  },
};

/**
 * Form layout components - sections and grids.
 */
export const FormLayouts: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Card className="p-6">
        <FormSection
          title="Part Information"
          description="Basic details about the auto part"
        >
          <FormGrid cols={2} gap="md">
            <FormField label="Part Name" required>
              <Input placeholder="e.g., Engine Block" />
            </FormField>

            <FormField label="Part Number">
              <Input placeholder="e.g., BMW-12345" />
            </FormField>

            <FormField label="Vehicle Make" required>
              <Input placeholder="e.g., BMW" />
            </FormField>

            <FormField label="Vehicle Model" required>
              <Input placeholder="e.g., X3" />
            </FormField>
          </FormGrid>

          <FormField label="Description">
            <Textarea
              placeholder="Detailed description of the part..."
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Pricing & Availability"
          description="Set pricing and availability options"
        >
          <FormGrid cols={3} gap="md">
            <FormField label="Price (ZAR)" required>
              <Input
                type="number"
                placeholder="0.00"
                suffix={<span className="text-secondary-500">ZAR</span>}
              />
            </FormField>

            <FormField label="Quantity">
              <Input
                type="number"
                placeholder="1"
                defaultValue="1"
              />
            </FormField>

            <FormField label="Location" required>
              <Input placeholder="City, Province" />
            </FormField>
          </FormGrid>

          <div className="space-y-3">
            <Checkbox
              label="List on Marketplace"
              description="Make this part visible to buyers"
              defaultChecked
            />

            <Checkbox
              label="Accept Offers"
              description="Allow buyers to negotiate price"
            />
          </div>
        </FormSection>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete form layout using sections and grids for organizing related fields.',
      },
    },
  },
};

/**
 * PartPal seller registration form example.
 */
export const SellerRegistration: Story = {
  render: () => {
    const [formData, setFormData] = React.useState({
      businessType: '',
      acceptTerms: false,
      newsletter: true,
    });

    const businessTypeOptions: RadioOption[] = [
      {
        value: 'individual',
        label: 'Individual Seller',
        description: 'Selling personal vehicle parts',
      },
      {
        value: 'dealer',
        label: 'Auto Dealer',
        description: 'Licensed vehicle dealership',
      },
      {
        value: 'scrapyard',
        label: 'Scrap Yard',
        description: 'Auto salvage and recycling business',
      },
      {
        value: 'workshop',
        label: 'Auto Workshop',
        description: 'Repair shop or service center',
      },
    ];

    return (
      <div className="w-full max-w-2xl">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-secondary-900">Join PartPal</h2>
            <p className="text-secondary-600 mt-2">
              Create your seller account to start listing auto parts
            </p>
          </div>

          <FormSection title="Business Information">
            <FormGrid cols={2}>
              <FormField label="Business Name" required>
                <Input
                  placeholder="Your business name"
                  icon={<User className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Contact Email" required>
                <Input
                  type="email"
                  placeholder="contact@business.com"
                  icon={<Mail className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Phone Number" required>
                <Input
                  type="tel"
                  placeholder="+27 12 345 6789"
                  icon={<Phone className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Business Registration">
                <Input placeholder="Registration number (optional)" />
              </FormField>
            </FormGrid>

            <FormField label="Business Address" required>
              <Textarea
                placeholder="Street address, city, province, postal code"
                rows={3}
              />
            </FormField>
          </FormSection>

          <FormSection title="Business Type">
            <RadioGroup
              name="businessType"
              options={businessTypeOptions}
              value={formData.businessType}
              onChange={(value) =>
                setFormData({ ...formData, businessType: value })
              }
            />
          </FormSection>

          <FormSection title="Account Setup">
            <FormGrid cols={2}>
              <FormField label="Password" required>
                <Input
                  type="password"
                  placeholder="Create password"
                  icon={<Lock className="h-4 w-4" />}
                />
              </FormField>

              <FormField label="Confirm Password" required>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  icon={<Lock className="h-4 w-4" />}
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Preferences">
            <div className="space-y-4">
              <Checkbox
                label="I agree to the Terms of Service and Privacy Policy"
                description="Required to create an account"
                checked={formData.acceptTerms}
                onChange={(e) =>
                  setFormData({ ...formData, acceptTerms: e.target.checked })
                }
                required
              />

              <Checkbox
                label="Subscribe to PartPal newsletter"
                description="Get updates about new features and market trends"
                checked={formData.newsletter}
                onChange={(e) =>
                  setFormData({ ...formData, newsletter: e.target.checked })
                }
              />
            </div>
          </FormSection>

          <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
            <Button variant="outline">Cancel</Button>
            <Button
              disabled={!formData.acceptTerms}
              className="min-w-[120px]"
            >
              Create Account
            </Button>
          </div>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete seller registration form showing real-world PartPal usage.',
      },
    },
  },
};

/**
 * Form validation and accessibility example.
 */
export const ValidationExample: Story = {
  render: () => {
    const [errors, setErrors] = React.useState({
      partName: 'Part name is required',
      price: '',
      email: '',
    });

    return (
      <div className="w-96">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Part</h3>

          <div className="space-y-4">
            <FormField
              label="Part Name"
              error={errors.partName}
              required
            >
              <Input
                placeholder="Enter part name"
                aria-invalid={!!errors.partName}
                aria-describedby="partName-error"
              />
            </FormField>

            <FormField
              label="Price"
              description="Price in South African Rand"
              error={errors.price}
              required
            >
              <Input
                type="number"
                placeholder="0.00"
                suffix={<span className="text-secondary-500">ZAR</span>}
                aria-invalid={!!errors.price}
              />
            </FormField>

            <FormField
              label="Contact Email"
              helper="Buyers will use this to contact you"
              error={errors.email}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="h-4 w-4" />}
                aria-invalid={!!errors.email}
              />
            </FormField>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Add Part</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with validation errors and proper accessibility attributes.',
      },
    },
  },
};