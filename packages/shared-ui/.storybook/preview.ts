import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: {
        brandTitle: 'PartPal Design System',
        brandUrl: 'https://partpal.com',
        brandImage: undefined,
        brandTarget: '_self',
        colorPrimary: '#3b82f6',
        colorSecondary: '#f37319',
      },
    },
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        'partpal-mobile': {
          name: 'PartPal Mobile',
          styles: {
            width: '375px',
            height: '812px',
          },
        },
        'partpal-tablet': {
          name: 'PartPal Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        'partpal-desktop': {
          name: 'PartPal Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
        {
          name: 'partpal-gray',
          value: '#f8fafc',
        },
      ],
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-order-semantics',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark', 'high-contrast'],
        dynamicTitle: true,
      },
    },
    reducedMotion: {
      description: 'Reduced motion preference',
      defaultValue: false,
      toolbar: {
        title: 'Reduced Motion',
        icon: 'lightning',
        items: [
          { value: false, title: 'Motion enabled' },
          { value: true, title: 'Reduced motion' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const { theme, reducedMotion } = context.globals;

      // Apply theme classes to body
      React.useEffect(() => {
        document.body.className = '';
        if (theme === 'dark') {
          document.body.classList.add('dark');
        }
        if (theme === 'high-contrast') {
          document.body.classList.add('high-contrast');
        }
        if (reducedMotion) {
          document.body.classList.add('motion-reduce');
        }
      }, [theme, reducedMotion]);

      return <Story />;
    },
  ],
};

export default preview;