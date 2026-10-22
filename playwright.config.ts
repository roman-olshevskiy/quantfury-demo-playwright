import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

import { env } from './src/config/env';
import { timeouts } from './src/config/timeouts';

// Retries: local 0; CI at most 1 for live suites, 0 for the mocked suite (requirements §21).
// A test that passes only on retry is reported as flaky and fails the run (failOnFlakyTests).
const liveRetries = env.CI ? 1 : 0;

const summary: ReporterDescription = ['./src/reporting/summary-reporter.ts'];
const html: ReporterDescription = ['html', { open: 'never', outputFolder: 'playwright-report' }];

const reporters: ReporterDescription[] = env.CI
  ? [['github'], ['list'], html, ['junit', { outputFile: 'reports/junit.xml' }], summary]
  : [['list'], html, summary];

const desktop = { width: 1440, height: 900 };

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  globalSetup: './src/environment/global-setup.ts',
  forbidOnly: env.CI,
  failOnFlakyTests: env.CI,
  fullyParallel: true,
  workers: env.WORKERS,
  reporter: reporters,
  timeout: timeouts.test,
  expect: { timeout: timeouts.expect },
  use: {
    baseURL: env.BASE_URL,
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: desktop,
    actionTimeout: timeouts.action,
    navigationTimeout: timeouts.navigation,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api-live',
      testDir: './tests/api',
      retries: liveRetries,
    },
    {
      name: 'ui-chromium',
      testMatch: ['ui/**/*.spec.ts', 'integration/**/*.spec.ts'],
      retries: liveRetries,
      use: { ...devices['Desktop Chrome'], viewport: desktop },
    },
    {
      name: 'ui-firefox-smoke',
      testDir: './tests/ui',
      grep: /@smoke/,
      retries: liveRetries,
      use: { ...devices['Desktop Firefox'], viewport: desktop },
    },
    {
      name: 'ui-webkit-smoke',
      testDir: './tests/ui',
      grep: /@smoke/,
      retries: liveRetries,
      use: { ...devices['Desktop Safari'], viewport: desktop },
    },
    {
      name: 'ui-mocked',
      testDir: './tests/mocked',
      retries: 0,
      use: { ...devices['Desktop Chrome'], viewport: desktop },
    },
  ],
});
