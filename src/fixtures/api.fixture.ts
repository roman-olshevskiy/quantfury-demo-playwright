import { randomUUID } from 'node:crypto';

import { test as base, type APIRequestContext } from '@playwright/test';

import { apiHosts, createDemoApi, type DemoApi } from '../api/clients';
import { ApiTransport } from '../api/http/api-transport';
import { demoHeaders, headersWithoutDemoIdentity } from '../api/http/demo-headers';
import { ApiExchangeLog } from '../api/http/exchange-log';
import { env } from '../config/env';

export interface ApiFixtures {
  /** Fresh demo identity per test (docs/product-discovery.md §9-10). */
  deviceId: string;
  /** Redacted HTTP exchanges of this test; attached to the report when the test fails. */
  apiExchangeLog: ApiExchangeLog;
  /** Clients sending the headers the web app sends, with this test's device id. */
  api: DemoApi;
  /** Same clients without the demo identity headers, for negative tests. */
  apiWithoutDemoHeaders: DemoApi;
}

interface InternalFixtures {
  demoRequest: APIRequestContext;
  anonymousRequest: APIRequestContext;
}

export const apiTest = base.extend<ApiFixtures & InternalFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring here.
  deviceId: async ({}, use) => {
    await use(randomUUID());
  },

  // eslint-disable-next-line no-empty-pattern -- Playwright requires object destructuring here.
  apiExchangeLog: async ({}, use, testInfo) => {
    const log = new ApiExchangeLog();
    await use(log);
    if (testInfo.status !== testInfo.expectedStatus && log.size > 0) {
      await testInfo.attach('api-exchanges.json', {
        body: JSON.stringify(log, null, 2),
        contentType: 'application/json',
      });
    }
  },

  // Each test gets its own APIRequestContext: no cookies or connections are shared between tests.
  demoRequest: async ({ playwright, deviceId }, use) => {
    const request = await playwright.request.newContext({
      extraHTTPHeaders: demoHeaders(deviceId, env.BASE_URL),
    });
    await use(request);
    await request.dispose();
  },

  anonymousRequest: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({
      extraHTTPHeaders: headersWithoutDemoIdentity(env.BASE_URL),
    });
    await use(request);
    await request.dispose();
  },

  api: async ({ demoRequest, apiExchangeLog }, use) => {
    await use(
      createDemoApi({
        bootstrap: new ApiTransport(demoRequest, apiExchangeLog, apiHosts.bootstrap),
        demo: new ApiTransport(demoRequest, apiExchangeLog, apiHosts.demo),
      }),
    );
  },

  apiWithoutDemoHeaders: async ({ anonymousRequest, apiExchangeLog }, use) => {
    await use(
      createDemoApi({
        bootstrap: new ApiTransport(anonymousRequest, apiExchangeLog, apiHosts.bootstrap),
        demo: new ApiTransport(anonymousRequest, apiExchangeLog, apiHosts.demo),
      }),
    );
  },
});
