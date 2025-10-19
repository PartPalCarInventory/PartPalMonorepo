import type { Meta, StoryObj } from '@storybook/react';
import {
  AccessibilityProvider,
  ScreenReaderOnly,
  VisuallyHidden,
  FocusRing,
  Landmark,
  RovingTabIndex,
} from './AccessibilityProvider';
import {
  auditAccessibility,
  logAccessibilityReport,
  testKeyboardNavigation,
} from '../../utils/accessibility-testing';
import { Button } from '../ui/Button';
import { Input } from '../forms/Form';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import React from 'react';

/**
 * Accessibility features and utilities for PartPal applications.
 * Demonstrates WCAG 2.1 AA compliance and inclusive design patterns.
 */
const meta = {
  title: 'Accessibility/Overview',
  component: AccessibilityProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
PartPal's accessibility implementation ensures that all users can access and use our applications,
regardless of their abilities or the assistive technologies they use.

## Key Features
- **WCAG 2.1 AA Compliance**: Meets international accessibility standards
- **Screen Reader Support**: Comprehensive ARIA implementation
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators and logical tab order
- **High Contrast**: Works with high contrast mode
- **Reduced Motion**: Respects user motion preferences
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AccessibilityProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete accessibility provider setup for PartPal applications.
 */
export const ProviderSetup: Story = {
  render: () => (
    <AccessibilityProvider
      skipLinks={[
        { href: '#main-content', label: 'Skip to main content' },
        { href: '#navigation', label: 'Skip to navigation' },
        { href: '#search', label: 'Skip to search' },
      ]}
    >
      <div className="min-h-screen bg-secondary-50">
        <header className="bg-white shadow-sm border-b border-secondary-200 p-4">
          <nav id="navigation" aria-label="Main navigation">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary-600">PartPal</h1>
              <div className="flex items-center space-x-4">
                <Button variant="ghost">Inventory</Button>
                <Button variant="ghost">Marketplace</Button>
                <Button variant="outline">Login</Button>
              </div>
            </div>
          </nav>
        </header>

        <main id="main-content" className="container mx-auto p-6">
          <Landmark as="section" label="Search parts">
            <div id="search" className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Find Auto Parts</h2>
              <div className="flex space-x-4">
                <Input
                  placeholder="Search by part name, number, or vehicle..."
                  className="flex-1"
                  aria-label="Search parts"
                />
                <Button>Search</Button>
              </div>
            </div>
          </Landmark>

          <Landmark as="section" label="Featured parts">
            <h2 className="text-lg font-semibold mb-4">Featured Parts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle>BMW Engine Block {i}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge status="available">Available</Badge>
                      <span className="font-bold">R 15,000</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Landmark>
        </main>

        <footer className="bg-secondary-100 p-6 mt-12">
          <div className="container mx-auto text-center text-secondary-600">
            <p>&copy; 2024 PartPal. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AccessibilityProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete page setup with AccessibilityProvider, skip links, and semantic landmarks.',
      },
    },
  },
};

/**
 * Screen reader utilities for hiding and showing content appropriately.
 */
export const ScreenReaderUtilities: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Screen Reader Only Content</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button aria-describedby="button-help">
              Edit Part
              <ScreenReaderOnly>
                - Opens part editing form in a new window
              </ScreenReaderOnly>
            </Button>
            <div id="button-help" className="text-sm text-secondary-600">
              Screen readers get additional context about this button
            </div>
          </div>

          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="font-medium">Visual Status Indicator</h4>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <span>Available</span>
              <ScreenReaderOnly>
                This part is currently available for purchase
              </ScreenReaderOnly>
            </div>
          </div>

          <div className="bg-secondary-50 p-4 rounded">
            <h4 className="font-medium mb-2">Price Information</h4>
            <div className="text-2xl font-bold">
              R 15,000
              <ScreenReaderOnly>
                South African Rand, fifteen thousand
              </ScreenReaderOnly>
            </div>
          </div>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of screen reader only content that provides additional context for assistive technologies.',
      },
    },
  },
};

/**
 * Focus management and keyboard navigation patterns.
 */
export const FocusManagement: Story = {
  render: () => {
    const [showModal, setShowModal] = React.useState(false);
    const tabItems = ['Overview', 'Specifications', 'Reviews', 'Related'];
    const [activeTab, setActiveTab] = React.useState(0);

    return (
      <div className="space-y-8 p-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Focus Ring Examples</h3>
          <div className="space-y-4">
            <div className="space-x-4">
              <FocusRing>
                <Button>Standard Focus</Button>
              </FocusRing>
              <Button className="focus-ring">Custom Focus Ring</Button>
              <Button variant="outline">Default Focus</Button>
            </div>

            <div className="text-sm text-secondary-600">
              Tab through these buttons to see focus indicators. The focus ring should be clearly visible.
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Roving Tab Index</h3>
          <p className="text-sm text-secondary-600 mb-4">
            Use arrow keys to navigate, Tab to exit the group
          </p>

          <RovingTabIndex
            orientation="horizontal"
            className="flex space-x-2 p-2 border rounded"
          >
            {tabItems.map((item, index) => (
              <button
                key={item}
                className="px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 data-[active='true']:bg-primary-100"
                onClick={() => setActiveTab(index)}
              >
                {item}
              </button>
            ))}
          </RovingTabIndex>

          <div className="mt-4 p-4 bg-secondary-50 rounded">
            <h4 className="font-medium">{tabItems[activeTab]} Content</h4>
            <p className="text-sm text-secondary-600 mt-2">
              Content for the {tabItems[activeTab].toLowerCase()} section would appear here.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Focus Trapping Example</h3>
          <div className="space-y-4">
            <Button onClick={() => setShowModal(true)}>
              Open Modal (Focus Trap Demo)
            </Button>

            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div
                  className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-title"
                >
                  <h4 id="modal-title" className="text-lg font-semibold mb-4">
                    Focus Trapped Modal
                  </h4>
                  <p className="text-sm text-secondary-600 mb-4">
                    Tab navigation is trapped within this modal. Use Tab to cycle through
                    the interactive elements, or press Escape to close.
                  </p>

                  <div className="space-y-3">
                    <Input placeholder="First input..." />
                    <Input placeholder="Second input..." />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => setShowModal(false)}>
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Focus management examples including focus rings, roving tab index, and focus trapping.',
      },
    },
  },
};

/**
 * PartPal-specific accessibility patterns for auto parts applications.
 */
export const PartPalPatterns: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Accessible Part Listings</h3>

        <article
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          aria-labelledby="part-1-name"
          aria-describedby="part-1-details"
        >
          <header className="flex items-start justify-between mb-3">
            <div>
              <h4 id="part-1-name" className="font-semibold text-lg">
                BMW X3 Engine Block
              </h4>
              <p className="text-sm text-secondary-600">
                Part #: BMW-ENG-2018-001
              </p>
            </div>
            <Badge status="available" aria-label="Part status: Available">
              Available
            </Badge>
          </header>

          <div id="part-1-details" className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-secondary-500">Vehicle:</span>
                <span className="ml-2 font-medium">2018 BMW X3</span>
              </div>
              <div>
                <span className="text-secondary-500">Condition:</span>
                <span className="ml-2 font-medium">Excellent</span>
              </div>
              <div>
                <span className="text-secondary-500">Location:</span>
                <span className="ml-2">Johannesburg, GP</span>
              </div>
              <div aria-label="Price: fifteen thousand South African Rand">
                <span className="text-secondary-500">Price:</span>
                <span className="ml-2 font-bold text-primary-600">R 15,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-sm text-secondary-600">
                Listed by:
                <a href="#" className="ml-1 text-primary-600 hover:underline">
                  Auto Parts Pro
                </a>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="View details for BMW X3 Engine Block"
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  aria-label="Contact seller about BMW X3 Engine Block"
                >
                  Contact Seller
                </Button>
              </div>
            </div>
          </div>
        </article>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Accessible Search Interface</h3>

        <form role="search" aria-label="Search auto parts">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search-query" className="block text-sm font-medium mb-2">
                  Search Parts
                </label>
                <Input
                  id="search-query"
                  placeholder="Part name, number, or vehicle..."
                  aria-describedby="search-help"
                />
                <div id="search-help" className="text-xs text-secondary-500 mt-1">
                  Search by part name, part number, or vehicle make/model
                </div>
              </div>

              <div>
                <label htmlFor="vehicle-make" className="block text-sm font-medium mb-2">
                  Vehicle Make
                </label>
                <select
                  id="vehicle-make"
                  className="w-full rounded-md border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  aria-describedby="make-help"
                >
                  <option value="">Any Make</option>
                  <option value="bmw">BMW</option>
                  <option value="mercedes">Mercedes-Benz</option>
                  <option value="toyota">Toyota</option>
                </select>
                <div id="make-help" className="text-xs text-secondary-500 mt-1">
                  Filter by vehicle manufacturer
                </div>
              </div>

              <div>
                <label htmlFor="price-range" className="block text-sm font-medium mb-2">
                  Max Price
                </label>
                <Input
                  id="price-range"
                  type="number"
                  placeholder="Maximum price..."
                  aria-describedby="price-help"
                />
                <div id="price-help" className="text-xs text-secondary-500 mt-1">
                  Maximum price in South African Rand
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button type="submit">Search Parts</Button>
              <button
                type="button"
                className="text-sm text-secondary-600 hover:text-secondary-900"
                aria-label="Clear all search filters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </form>

        <div
          role="status"
          aria-live="polite"
          aria-label="Search results"
          className="mt-4 p-3 bg-secondary-50 rounded text-sm text-secondary-700"
        >
          Search results will be announced here when the search completes.
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Status Updates</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-3"></div>
              <span className="text-success-800">Part successfully added to inventory</span>
            </div>
            <button
              className="text-success-600 hover:text-success-800"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>

          <div
            role="alert"
            aria-live="assertive"
            className="p-3 bg-error-50 border border-error-200 rounded text-error-800"
          >
            <strong>Error:</strong> Failed to update part status. Please try again.
          </div>

          <div
            role="status"
            aria-live="polite"
            className="p-3 bg-primary-50 border border-primary-200 rounded text-primary-800"
          >
            <strong>Processing:</strong> Updating inventory status...
          </div>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'PartPal-specific accessibility patterns for auto parts applications.',
      },
    },
  },
};

/**
 * Accessibility testing and validation tools.
 */
export const AccessibilityTesting: Story = {
  render: () => {
    const [auditResults, setAuditResults] = React.useState<any>(null);
    const [isAuditing, setIsAuditing] = React.useState(false);

    const runAudit = () => {
      setIsAuditing(true);
      // Simulate audit delay
      setTimeout(() => {
        const testElement = document.querySelector('[data-testid="audit-target"]');
        if (testElement) {
          const results = auditAccessibility(testElement as HTMLElement);
          setAuditResults(results);
          logAccessibilityReport(results);
        }
        setIsAuditing(false);
      }, 1000);
    };

    const testKeyboard = async () => {
      const testElement = document.querySelector('[data-testid="keyboard-target"]');
      if (testElement) {
        const result = await testKeyboardNavigation(testElement as HTMLElement);
        alert(`Keyboard navigation test: ${result ? 'PASSED' : 'FAILED'}`);
      }
    };

    return (
      <div className="space-y-8 p-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Accessibility Audit Tool</h3>
          <p className="text-sm text-secondary-600 mb-4">
            Test the accessibility of components and get detailed reports.
          </p>

          <div className="space-y-4">
            <Button onClick={runAudit} disabled={isAuditing}>
              {isAuditing ? 'Running Audit...' : 'Run Accessibility Audit'}
            </Button>

            <div data-testid="audit-target" className="p-4 border rounded">
              <h4 className="font-medium mb-2">Test Component</h4>
              <div className="space-y-2">
                <Button aria-label="Properly labeled button">Good Button</Button>
                <button>Unlabeled Button (Issue)</button>
                <Input placeholder="Input without label (Issue)" />
                <img alt="BMW Engine" className="w-16 h-16 bg-secondary-200 rounded" />
                <img className="w-16 h-16 bg-secondary-200 rounded" />
              </div>
            </div>

            {auditResults && (
              <div className="p-4 bg-secondary-50 rounded">
                <h4 className="font-medium mb-2">
                  Audit Results - Score: {auditResults.score}/100
                </h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Issues Found:</span> {auditResults.issues.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Passed:</span> {auditResults.passed} / {auditResults.total}
                  </div>
                  {auditResults.issues.slice(0, 3).map((issue: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-warning-50 border border-warning-200 rounded">
                      <span className="font-medium text-warning-800">{issue.rule}:</span>{' '}
                      <span className="text-warning-700">{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Keyboard Navigation Test</h3>
          <p className="text-sm text-secondary-600 mb-4">
            Test keyboard accessibility of interactive elements.
          </p>

          <div className="space-y-4">
            <Button onClick={testKeyboard}>Test Keyboard Navigation</Button>

            <div data-testid="keyboard-target" className="p-4 border rounded">
              <h4 className="font-medium mb-2">Interactive Elements</h4>
              <div className="space-x-2">
                <Button size="sm">Button 1</Button>
                <Button size="sm" variant="outline">Button 2</Button>
                <Input placeholder="Input field" className="inline-block w-auto" />
                <select className="px-3 py-1 border border-secondary-300 rounded">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Accessibility Checklist</h3>
          <div className="space-y-3">
            {[
              'All interactive elements are keyboard accessible',
              'Focus indicators are visible and clear',
              'Images have appropriate alt text',
              'Form inputs have associated labels',
              'Color is not the only way to convey information',
              'Text has sufficient color contrast (4.5:1 minimum)',
              'Content is structured with proper headings',
              'Error messages are announced to screen readers',
              'Live regions announce dynamic content changes',
              'Skip links are provided for keyboard users',
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`check-${index}`}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor={`check-${index}`} className="text-sm">
                  {item}
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility testing tools and validation checklist for PartPal components.',
      },
    },
  },
};