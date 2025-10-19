import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },

    /* Tablet testing */
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'Android Tablet',
      use: { ...devices['Galaxy Tab S4'] },
    },
  ],

  /* PartPal-specific test configuration */

  /* Marketplace tests */
  {
    name: 'Marketplace Desktop',
    testDir: './e2e/marketplace',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: 'http://localhost:3000'
    },
  },

  /* IMS tests */
  {
    name: 'IMS Desktop',
    testDir: './e2e/ims',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: 'http://localhost:3001'
    },
  },

  /* Mobile-specific marketplace tests */
  {
    name: 'Marketplace Mobile',
    testDir: './e2e/marketplace/mobile',
    use: {
      ...devices['Pixel 5'],
      baseURL: 'http://localhost:3000'
    },
  },

  /* Tablet-specific IMS tests (for scrap yard operations) */
  {
    name: 'IMS Tablet',
    testDir: './e2e/ims/tablet',
    use: {
      ...devices['iPad Pro'],
      baseURL: 'http://localhost:3001'
    },
  },

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev:marketplace',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev:ims',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev:api',
      port: 3333,
      reuseExistingServer: !process.env.CI,
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./setup/global-setup.ts'),
  globalTeardown: require.resolve('./setup/global-teardown.ts'),

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 5000
  },
});