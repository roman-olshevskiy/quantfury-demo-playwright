import type { APIResponse } from '@playwright/test';

import type { ApiTransport } from '../http/api-transport';
import type { ChartRequest } from '../models/market-data';
import { apiPaths } from '../paths';

export class MarketDataClient {
  readonly #http: ApiTransport;

  constructor(http: ApiTransport) {
    this.#http = http;
  }

  getPrices(shortNames: readonly string[]): Promise<APIResponse> {
    return this.#http.post(apiPaths.price, { shortNames });
  }

  getChart(request: ChartRequest): Promise<APIResponse> {
    return this.#http.post(apiPaths.chart, request);
  }

  getMarkets(): Promise<APIResponse> {
    return this.#http.get(apiPaths.markets);
  }
}
