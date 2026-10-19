import { defineConfig, devices } from '@playwright/test'

/** MVP acceptance scenarios (spec §15). Each test starts from a fresh browser context (fresh mock backend). */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5210',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
    // Uses the locally installed Google Chrome (no Playwright browser download needed).
    channel: 'chrome',
    viewport: { width: 1280, height: 860 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5210',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
