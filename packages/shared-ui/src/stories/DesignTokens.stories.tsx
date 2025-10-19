import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

/**
 * PartPal design tokens including colors, typography, spacing, and more.
 */
const meta = {
  title: 'Design System/Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Design tokens are the foundational design decisions that ensure consistency across PartPal applications.
They define colors, typography, spacing, and other visual properties used throughout the system.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * PartPal color palette with brand colors and semantic meanings.
 */
export const Colors: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      {/* Brand Colors */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Primary Blue</CardTitle>
              <p className="text-sm text-secondary-600">Main brand color for primary actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded border border-secondary-200 bg-primary-${shade}`}
                      />
                      <span className="text-sm font-mono">primary-{shade}</span>
                    </div>
                    {shade === 500 && <Badge>Default</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent Orange</CardTitle>
              <p className="text-sm text-secondary-600">Secondary brand color for highlights</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded border border-secondary-200 bg-accent-${shade}`}
                      />
                      <span className="text-sm font-mono">accent-{shade}</span>
                    </div>
                    {shade === 500 && <Badge>Default</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secondary Gray</CardTitle>
              <p className="text-sm text-secondary-600">Neutral colors for text and backgrounds</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded border border-secondary-200 bg-secondary-${shade}`}
                      />
                      <span className="text-sm font-mono">secondary-{shade}</span>
                    </div>
                    {shade === 600 && <Badge>Text</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Semantic Colors */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-success-700">Success</CardTitle>
              <p className="text-sm text-secondary-600">Available parts, completed actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[100, 500, 600].map((shade) => (
                  <div key={shade} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded bg-success-${shade}`} />
                    <span className="text-sm font-mono">success-{shade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-warning-700">Warning</CardTitle>
              <p className="text-sm text-secondary-600">Fair condition, pending actions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[100, 500, 600].map((shade) => (
                  <div key={shade} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded bg-warning-${shade}`} />
                    <span className="text-sm font-mono">warning-{shade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-error-700">Error</CardTitle>
              <p className="text-sm text-secondary-600">Unavailable parts, error states</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[100, 500, 600].map((shade) => (
                  <div key={shade} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded bg-error-${shade}`} />
                    <span className="text-sm font-mono">error-{shade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-primary-700">Info</CardTitle>
              <p className="text-sm text-secondary-600">Information, neutral states</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[100, 500, 600].map((shade) => (
                  <div key={shade} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded bg-primary-${shade}`} />
                    <span className="text-sm font-mono">primary-{shade}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete color palette with brand colors and semantic meanings for auto parts contexts.',
      },
    },
  },
};

/**
 * Typography scale and font families used in PartPal.
 */
export const Typography: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Font Families</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Inter (Sans-serif)</CardTitle>
              <p className="text-sm text-secondary-600">Primary font for UI and content</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-sans">
                <div>
                  <div className="text-xs text-secondary-500 mb-1">300 - Light</div>
                  <div className="font-light">BMW X3 Engine Block Available</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">400 - Regular</div>
                  <div className="font-normal">BMW X3 Engine Block Available</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">500 - Medium</div>
                  <div className="font-medium">BMW X3 Engine Block Available</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">600 - Semibold</div>
                  <div className="font-semibold">BMW X3 Engine Block Available</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">700 - Bold</div>
                  <div className="font-bold">BMW X3 Engine Block Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">JetBrains Mono</CardTitle>
              <p className="text-sm text-secondary-600">Monospace font for code and part numbers</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-mono">
                <div>
                  <div className="text-xs text-secondary-500 mb-1">400 - Regular</div>
                  <div className="font-normal">BMW-ENG-2018-001</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">500 - Medium</div>
                  <div className="font-medium">BMW-ENG-2018-001</div>
                </div>
                <div>
                  <div className="text-xs text-secondary-500 mb-1">600 - Semibold</div>
                  <div className="font-semibold">BMW-ENG-2018-001</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Type Scale</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-xs (0.75rem)</div>
                <div className="text-xs">Part number: BMW-ENG-2018-001</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-sm (0.875rem)</div>
                <div className="text-sm">Located in Johannesburg, Gauteng</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-base (1rem)</div>
                <div className="text-base">BMW X3 Engine Block in excellent condition</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-lg (1.125rem)</div>
                <div className="text-lg">Complete engine assembly for 2018 BMW X3</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-xl (1.25rem)</div>
                <div className="text-xl">BMW X3 xDrive30i Engine Block</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-2xl (1.5rem)</div>
                <div className="text-2xl">Auto Parts Marketplace</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-3xl (1.875rem)</div>
                <div className="text-3xl">Find Quality Parts</div>
              </div>
              <div>
                <div className="text-xs text-secondary-500 mb-1">text-4xl (2.25rem)</div>
                <div className="text-4xl">PartPal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typography scale and font families optimized for auto parts content.',
      },
    },
  },
};

/**
 * Spacing scale used throughout PartPal components.
 */
export const Spacing: Story = {
  render: () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-secondary-900 mb-6">Spacing Scale</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[
              { size: '1', rem: '0.25', px: '4' },
              { size: '2', rem: '0.5', px: '8' },
              { size: '3', rem: '0.75', px: '12' },
              { size: '4', rem: '1', px: '16' },
              { size: '5', rem: '1.25', px: '20' },
              { size: '6', rem: '1.5', px: '24' },
              { size: '8', rem: '2', px: '32' },
              { size: '10', rem: '2.5', px: '40' },
              { size: '12', rem: '3', px: '48' },
              { size: '16', rem: '4', px: '64' },
              { size: '20', rem: '5', px: '80' },
              { size: '24', rem: '6', px: '96' },
            ].map((space) => (
              <div key={space.size} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-mono">{space.size}</div>
                <div className="w-20 text-sm text-secondary-600">{space.rem}rem</div>
                <div className="w-16 text-sm text-secondary-600">{space.px}px</div>
                <div
                  className="bg-primary-500 h-4"
                  style={{ width: `${space.px}px` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-secondary-50 rounded-lg">
            <h3 className="font-semibold mb-2">Touch Targets</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Minimum touch target sizes for accessibility and mobile usability:
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-16 text-sm font-mono">44px</div>
                <div className="text-sm text-secondary-600">Minimum touch target (WCAG AA)</div>
                <div className="w-11 h-11 bg-primary-500 rounded border-2 border-primary-600" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 text-sm font-mono">48px</div>
                <div className="text-sm text-secondary-600">Recommended for primary actions</div>
                <div className="w-12 h-12 bg-accent-500 rounded border-2 border-accent-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spacing scale ensuring consistent layout and accessibility-compliant touch targets.',
      },
    },
  },
};

/**
 * Border radius and shadow tokens for consistent visual styling.
 */
export const SurfacesAndDepth: Story = {
  render: () => (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'sm', class: 'rounded-sm', px: '2px' },
            { name: 'default', class: 'rounded', px: '4px' },
            { name: 'md', class: 'rounded-md', px: '6px' },
            { name: 'lg', class: 'rounded-lg', px: '8px' },
            { name: 'xl', class: 'rounded-xl', px: '12px' },
            { name: '2xl', class: 'rounded-2xl', px: '16px' },
            { name: '3xl', class: 'rounded-3xl', px: '24px' },
            { name: 'full', class: 'rounded-full', px: '9999px' },
          ].map((radius) => (
            <Card key={radius.name}>
              <CardContent className="p-4 text-center">
                <div className={`w-16 h-16 bg-primary-500 ${radius.class} mx-auto mb-2`} />
                <div className="text-sm font-medium">{radius.name}</div>
                <div className="text-xs text-secondary-600">{radius.px}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Shadows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Soft Shadow</CardTitle>
              <p className="text-sm text-secondary-600">Subtle depth for cards and inputs</p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-20 bg-white shadow-soft rounded-lg border border-secondary-200 flex items-center justify-center">
                <span className="text-sm text-secondary-600">shadow-soft</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medium Shadow</CardTitle>
              <p className="text-sm text-secondary-600">Standard depth for elevated elements</p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-20 bg-white shadow-medium rounded-lg border border-secondary-200 flex items-center justify-center">
                <span className="text-sm text-secondary-600">shadow-medium</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hard Shadow</CardTitle>
              <p className="text-sm text-secondary-600">Strong depth for modals and overlays</p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-20 bg-white shadow-hard rounded-lg border border-secondary-200 flex items-center justify-center">
                <span className="text-sm text-secondary-600">shadow-hard</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Border radius and shadow tokens for creating visual hierarchy and depth.',
      },
    },
  },
};