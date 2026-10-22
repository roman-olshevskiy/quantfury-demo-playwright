import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

import { env } from './src/config/env';
import { timeouts } from './src/config/timeouts';

const liveRetries = env.CI ? 1 : 0;

const reporters: ReporterDescription[] = env.CI
  ? [
      ['github'],
      ['list'],
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ['junit', { outputFile: 'reports/junit.xml' }],
    ]
  : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]];

export default defineConfig({
  testDir: './tests',
  outputDir: 'test-results',
  forbidOnly: env.CI,
  workers: env.WORKERS,
  reporter: reporters,
  timeout: timeouts.test,
  expect: { timeout: timeouts.expect },
  use: {
    baseURL: env.BASE_URL,
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: { width: 1440, height: 900 },
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
      fullyParallel: true,
    },
    {
      name: 'ui-chromium',
      testMatch: ['ui/**/*.spec.ts', 'integration/**/*.spec.ts'],
      retries: liveRetries,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'ui-firefox-smoke',
      testDir: './tests/ui',
      grep: /@smoke/,
      retries: liveRetries,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'ui-webkit-smoke',
      testDir: './tests/ui',
      grep: /@smoke/,
      retries: liveRetries,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'ui-mocked',
      testDir: './tests/mocked',
      retries: 0,
      fullyParallel: true,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
