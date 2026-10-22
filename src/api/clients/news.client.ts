import type { APIResponse } from '@playwright/test';

import type { ApiTransport, QueryParams } from '../http/api-transport';
import type { NewsInstrumentType } from '../models/news';
import { apiPaths } from '../paths';

export class NewsClient {
  readonly #http: ApiTransport;

  constructor(http: ApiTransport) {
    this.#http = http;
  }

  getNewsByInstrumentType(instrumentType: NewsInstrumentType, newsAmount: number) {
    return this.getNews({ instrumentType, newsAmount });
  }

  /** Untyped parameters on purpose: negative tests send values the API must reject. */
  getNews(params: QueryParams): Promise<APIResponse> {
    return this.#http.get(apiPaths.news, { params });
  }
}
