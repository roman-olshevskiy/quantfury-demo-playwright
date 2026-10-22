import type { APIResponse } from '@playwright/test';

import type { ApiTransport } from '../http/api-transport';
import { apiPaths } from '../paths';

export class InstrumentsClient {
  readonly #http: ApiTransport;

  constructor(http: ApiTransport) {
    this.#http = http;
  }

  /** Full list (~1 MB) without `afterDate`; only changes since `afterDate` (ms) otherwise. */
  getInstruments(options: { afterDate?: number } = {}): Promise<APIResponse> {
    return this.#http.get(apiPaths.instruments, {
      params: options.afterDate === undefined ? {} : { afterDate: options.afterDate },
    });
  }

  getSearchCategories(): Promise<APIResponse> {
    return this.#http.get(apiPaths.searchCategories);
  }

  getInstrumentDetails(shortName: string): Promise<APIResponse> {
    return this.#http.get(apiPaths.instrumentDetails, { params: { shortName } });
  }
}
