const { defineConfig, devices } = require('@playwright/test')

// The tests run against a server of their own on another port, so the dev
// server on :3000 can keep running alongside
const TEST_PORT = 3300
const TEST_URL = `http://localhost:${TEST_PORT}`

/**
 * Playwright configuration for GOV.UK Prototype Kit
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // One worker: the specs share the kit's session store and some write
  // files under content/ for the length of a run
  workers: 1,

  // Reporter to use
  reporter: [['html'], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: TEST_URL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure'
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // Start the test server before the tests (or reuse one left running)
  webServer: {
    command: 'npm run dev',
    url: TEST_URL,
    env: { PORT: String(TEST_PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
