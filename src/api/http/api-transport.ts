import type { APIRequestContext, APIResponse } from '@playwright/test';

import { timeouts } from '../../config/timeouts';
import type { ApiExchangeLog } from './exchange-log';

export type QueryParams = Readonly<Record<string, string | number | boolean>>;

export interface RequestOptions {
  params?: QueryParams;
  headers?: Readonly<Record<string, string>>;
}

/**
 * Thin layer over APIRequestContext bound to one API host. It exists for one reason: every
 * exchange is recorded (redacted, bounded) for failure diagnostics. It never retries and never
 * interprets status codes — that is the test's job.
 */
export class ApiTransport {
  readonly #request: APIRequestContext;
  readonly #log: ApiExchangeLog;
  readonly #baseUrl: string;

  constructor(request: APIRequestContext, log: ApiExchangeLog, baseUrl: string) {
    this.#request = request;
    this.#log = log;
    this.#baseUrl = baseUrl;
  }

  get(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.#send('GET', path, undefined, options);
  }

  /** `data` is `unknown` on purpose: negative tests send deliberately malformed bodies. */
  post(path: string, data: unknown, options: RequestOptions = {}): Promise<APIResponse> {
    return this.#send('POST', path, data, options);
  }

  async #send(
    method: string,
    path: string,
    data: unknown,
    options: RequestOptions,
  ): Promise<APIResponse> {
    const url = new URL(path, this.#baseUrl);
    for (const [name, value] of Object.entries(options.params ?? {})) {
      url.searchParams.set(name, String(value));
    }
    const startedAt = new Date();
    try {
      const response = await this.#request.fetch(url.toString(), {
        method,
        data,
        headers: options.headers,
        timeout: timeouts.apiRequest,
      });
      this.#log.record({
        startedAt,
        method,
        url: url.toString(),
        requestBody: data,
        status: response.status(),
        responseHeaders: response.headers(),
        responseText: await response.text(),
      });
      return response;
    } catch (error: unknown) {
      this.#log.record({
        startedAt,
        method,
        url: url.toString(),
        requestBody: data,
        transportError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
