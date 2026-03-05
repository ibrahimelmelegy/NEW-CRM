import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * See https://playwright.dev/docs/test-configuration.
 *
 * Test directories:
 *   - tests/e2e/  : Comprehensive module tests with shared auth setup
 *   - e2e/        : Focused user-flow tests (auth, leads, deals, navigation, responsive)
 *
 * Running tests:
 *   npx playwright test                       # Run all tests in both directories
 *   npx playwright test --project=chromium    # Run only chromium (includes both dirs)
 *   npx playwright test --project=e2e-quick   # Run only e2e/ directory tests
 *   npx playwright test e2e/auth.spec.ts      # Run a specific test file
 */
export default defineConfig({
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Limit workers to avoid overwhelming the backend API (/auth/me per navigation) */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Global timeout */
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshots on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'on-first-retry',

    /* Action timeout */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup - runs once before all tests (for tests/e2e/ directory)
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /auth\.setup\.ts/,
    },

    // Main test suite - tests/e2e/ directory (comprehensive module tests)
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        // Reuse auth state from setup
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Focused user-flow tests - e2e/ directory
    // These tests handle auth inline (storageState or re-login fallback)
    {
      name: 'e2e-quick',
      testDir: './e2e',
      testIgnore: /example\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Reuse auth state from setup for authenticated tests
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Firefox and WebKit disabled - browsers not installed locally.
    // To enable: npx playwright install firefox webkit
    // {
    //   name: 'firefox',
    //   testDir: './tests/e2e',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'tests/e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // {
    //   name: 'webkit',
    //   testDir: './tests/e2e',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'tests/e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],
});
