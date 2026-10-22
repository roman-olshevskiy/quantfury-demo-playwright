import type { APIResponse } from '@playwright/test';

import type { ApiTransport } from '../http/api-transport';
import { apiPaths } from '../paths';

/** Bootstrap host (`b1`): tells the web app which host serves the demo API. */
export class BootstrapClient {
  readonly #http: ApiTransport;

  constructor(http: ApiTransport) {
    this.#http = http;
  }

  getDemoApi(): Promise<APIResponse> {
    return this.#http.get(apiPaths.demoApi);
  }
}
