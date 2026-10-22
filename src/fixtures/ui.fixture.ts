import { randomUUID } from 'node:crypto';

import { test as base } from '@playwright/test';

import { demoHeaders } from '../api/http/demo-headers';
import { readValidatedJson } from '../api/http/read-json';
import type { SuccessEnvelope } from '../api/models/envelope';
import type { InstrumentsData } from '../api/models/instrument';
import { apiPaths } from '../api/paths';
import { validators } from '../api/schemas/validators';
import { env } from '../config/env';
import { timeouts } from '../config/timeouts';
import { ENVIRONMENT_ANNOTATION } from '../environment/markers';
import { MockApi } from '../ui/network/mock-api';
import { NetworkExpectations } from '../ui/network/network-expectations';
import { PageDiagnostics } from '../ui/network/page-diagnostics';
import { TradePage } from '../ui/pages/trade.page';

/** Hosts the demo needs (docs/product-discovery.md §5). Everything else is aborted. */
const appHosts = [env.BASE_URL, env.DEMO_BOOTSTRAP_URL, env.API_BASE_URL].map(
  (url) => new URL(url).hostname,
);

export interface UiFixtures {
  /** Trade screen of this test's page; not opened yet. */
  tradePage: TradePage;
  /** Narrow route mocks for the mocked suite; register them before `tradePage.open()`. */
  mockApi: MockApi;
  /** Failures the test provokes on purpose; diagnostics label them as expected. */
  networkExpectations: NetworkExpectations;
  /** Bounded page/network diagnostics, attached to the report when the test fails. */
  pageDiagnostics: PageDiagnostics;
}

export interface UiWorkerFixtures {
  /**
   * The full `/v13/instruments` response, fetched once per worker and validated. Immutable
   * reference data, so sharing it between tests is safe (requirements §10). Used by the mocked
   * suite to avoid downloading ~1 MB from the live backend in every test.
   */
  instrumentSnapshot: Readonly<SuccessEnvelope<InstrumentsData>>;
}

export const uiTest = base.extend<UiFixtures, UiWorkerFixtures>({
  instrumentSnapshot: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext({
        extraHTTPHeaders: demoHeaders(randomUUID(), env.BASE_URL),
      });
      const response = await request.get(
        new URL(apiPaths.instruments, env.API_BASE_URL).toString(),
        {
          timeout: timeouts.apiRequest,
        },
      );
      const snapshot = await readValidatedJson(
        response,
        validators.instrumentsResponse,
        'instrument snapshot',
      );
      await request.dispose();
      await use(Object.freeze(snapshot));
    },
    { scope: 'worker' },
  ],

  // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring here.
  networkExpectations: async ({}, use) => {
    await use(new NetworkExpectations());
  },

  pageDiagnostics: async ({ networkExpectations }, use) => {
    await use(new PageDiagnostics(appHosts, networkExpectations));
  },

  // Every UI test already gets a fresh browser context (a fresh demo identity). The page fixture
  // is extended so that, before anything navigates:
  // - analytics, ads, chat and crash reporting are aborted: the demo does not need them and they
  //   add noise and external dependencies (docs/product-discovery.md §5);
  // - diagnostics listen for the whole test and are detached in teardown.
  page: async ({ page, context, pageDiagnostics }, use, testInfo) => {
    const allowed = new Set(appHosts);
    await context.route(
      (url) => !allowed.has(url.hostname),
      (route) => route.abort('blockedbyclient'),
    );
    pageDiagnostics.start(page);
    await use(page);
    pageDiagnostics.stop();
    await pageDiagnostics.settle();
    if (testInfo.status !== testInfo.expectedStatus) {
      // A failure after a CDN block page is an environment condition, not a product defect.
      for (const blocked of pageDiagnostics.blockedResponses) {
        testInfo.annotations.push({ type: ENVIRONMENT_ANNOTATION, description: blocked });
      }
      await testInfo.attach('page-diagnostics.json', {
        body: JSON.stringify(pageDiagnostics, null, 2),
        contentType: 'application/json',
      });
    }
  },

  tradePage: async ({ page }, use, testInfo) => {
    const tradePage = new TradePage(page);
    await use(tradePage);
    // Known product start-up stall: keep it visible and countable in reports.
    for (const ms of tradePage.startupTimesMs.filter((t) => t > timeouts.slowStartThreshold)) {
      testInfo.annotations.push({
        type: 'slow-start',
        description: `trade layout rendered after ${String(ms)} ms (see docs/product-discovery.md §12)`,
      });
    }
  },

  mockApi: async ({ page, networkExpectations }, use, testInfo) => {
    const mockApi = new MockApi(page, env.API_BASE_URL, networkExpectations);
    await use(mockApi);
    await mockApi.dispose();
    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach('mocked-requests.json', {
        body: JSON.stringify(mockApi.intercepted, null, 2),
        contentType: 'application/json',
      });
    }
  },
});
