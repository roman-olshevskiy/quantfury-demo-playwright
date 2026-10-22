import type { Page, Route } from '@playwright/test';

import { readJson } from '../../api/http/read-json';
import { apiPaths, realtimeHubPath } from '../../api/paths';
import { BoundedBuffer } from '../../utils/bounded-buffer';
import { redactUrl } from '../../utils/redact';
import { HubProxy } from './hub-proxy';
import type { NetworkExpectations, UrlPredicate } from './network-expectations';

export interface HeldResponses {
  /** Resolves when the app has requested the held endpoint at least once. */
  readonly requested: Promise<undefined>;
  /** Lets every held (and future) request continue to the real server. */
  release(): void;
}

/**
 * Narrow interception of single demo API endpoints for the mocked suite. Each method matches one
 * exact host + path; everything else reaches the real backend. Register mocks before navigation.
 */
export class MockApi {
  readonly #page: Page;
  readonly #apiOrigin: string;
  readonly #expectations: NetworkExpectations;
  readonly #intercepted = new BoundedBuffer<string>(50);

  constructor(page: Page, apiBaseUrl: string, expectations: NetworkExpectations) {
    this.#page = page;
    this.#apiOrigin = new URL(apiBaseUrl).origin;
    this.#expectations = expectations;
  }

  /** Fulfills the endpoint with a JSON body (HTTP 200 unless given). */
  async fulfillJson(path: string, body: unknown, status = 200): Promise<void> {
    await this.#route(path, (route) =>
      route.fulfill({
        status,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(body),
      }),
    );
  }

  /**
   * Serves the full instrument list (`GET /v13/instruments` without `afterDate`) from `body`.
   * Delta syncs (`?afterDate=`) still reach the backend and are small.
   */
  async serveInstrumentList(body: unknown): Promise<void> {
    const text = JSON.stringify(body);
    await this.#route(
      apiPaths.instruments,
      (route) =>
        route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: text }),
      (url) => !url.searchParams.has('afterDate'),
    );
  }

  /** Answers with an HTTP error status; the failure is registered as expected. */
  async failWithStatus(path: string, status: number): Promise<void> {
    this.#expectations.expectFailure(this.#matcher(path), `mocked HTTP ${String(status)}`);
    await this.#route(path, (route) => route.fulfill({ status, body: '' }));
  }

  /** Lets the real request through and rewrites its JSON body. */
  async transformJson(path: string, transform: (realBody: unknown) => unknown): Promise<void> {
    await this.#route(path, async (route) => {
      const response = await route.fetch();
      const body = transform(await readJson(response));
      await route.fulfill({ response, body: JSON.stringify(body) });
    });
  }

  /**
   * Holds requests to the endpoint until `release()` is called — a controlled "slow response"
   * without any fixed delay.
   */
  async hold(path: string): Promise<HeldResponses> {
    const requested = Promise.withResolvers<undefined>();
    const released = Promise.withResolvers<undefined>();
    await this.#route(path, async (route) => {
      requested.resolve(undefined);
      await released.promise;
      await route.continue();
    });
    return {
      requested: requested.promise,
      release: () => {
        released.resolve(undefined);
      },
    };
  }

  /**
   * Replaces the SignalR hub with a connection that never reaches the server, so no live quote
   * overwrites mocked values.
   */
  async stubRealtimeHub(): Promise<void> {
    const hubUrl = new URL(realtimeHubPath, this.#apiOrigin);
    await this.#page.routeWebSocket(
      (url) => url.host === hubUrl.host && url.pathname === hubUrl.pathname,
      () => undefined,
    );
  }

  /**
   * Routes the SignalR hub through a local pass-through proxy that records the traffic and can
   * drop the connection (disconnect/reconnect scenarios). Use instead of `stubRealtimeHub`.
   */
  proxyRealtimeHub(): Promise<HubProxy> {
    return HubProxy.install(this.#page, this.#apiOrigin);
  }

  get intercepted(): readonly string[] {
    return this.#intercepted.items;
  }

  async dispose(): Promise<void> {
    // Held handlers may still be waiting; do not fail teardown on them.
    await this.#page.unrouteAll({ behavior: 'ignoreErrors' });
  }

  #matcher(path: string, extra: UrlPredicate = () => true): UrlPredicate {
    return (url) => url.origin === this.#apiOrigin && url.pathname === path && extra(url);
  }

  async #route(
    path: string,
    handler: (route: Route) => Promise<void>,
    extra?: UrlPredicate,
  ): Promise<void> {
    const matches = this.#matcher(path, extra);
    await this.#page.route(matches, async (route) => {
      this.#intercepted.push(`${route.request().method()} ${redactUrl(route.request().url())}`);
      await handler(route);
    });
  }
}
