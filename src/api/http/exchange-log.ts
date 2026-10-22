import { BoundedBuffer } from '../../utils/bounded-buffer';
import { redactHeaders, redactJson, redactUrl, truncate } from '../../utils/redact';

export interface ApiExchange {
  startedAt: string;
  durationMs: number;
  method: string;
  url: string;
  requestBody?: unknown;
  status?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  transportError?: string;
}

export interface ExchangeInput {
  startedAt: Date;
  method: string;
  url: string;
  requestBody?: unknown;
  status?: number;
  responseHeaders?: Record<string, string>;
  responseText?: string;
  transportError?: string;
}

const MAX_BODY_CHARS = 2_000;

// Headers that help diagnose a failure; everything else (cookies included) is left out.
const KEPT_RESPONSE_HEADERS = new Set([
  'content-type',
  'content-length',
  'api-supported-versions',
  'api-deprecated-versions',
  'access-control-allow-origin',
  'cf-ray',
  'cf-cache-status',
  'date',
  'retry-after',
]);

/**
 * Bounded, redacted record of the HTTP exchanges made during one test. It is attached to the
 * report only when the test fails, so it never needs to hold more than the recent history.
 */
export class ApiExchangeLog {
  readonly #entries: BoundedBuffer<ApiExchange>;

  constructor(capacity = 50) {
    this.#entries = new BoundedBuffer(capacity);
  }

  record(input: ExchangeInput): void {
    const entry: ApiExchange = {
      startedAt: input.startedAt.toISOString(),
      durationMs: Date.now() - input.startedAt.getTime(),
      method: input.method,
      url: redactUrl(input.url),
    };
    if (input.requestBody !== undefined) entry.requestBody = redactJson(input.requestBody);
    if (input.status !== undefined) entry.status = input.status;
    if (input.responseHeaders) entry.responseHeaders = pickHeaders(input.responseHeaders);
    if (input.responseText !== undefined) {
      entry.responseBody = truncate(input.responseText, MAX_BODY_CHARS);
    }
    if (input.transportError !== undefined) entry.transportError = input.transportError;

    this.#entries.push(entry);
  }

  get size(): number {
    return this.#entries.size;
  }

  toJSON(): { dropped: number; exchanges: readonly ApiExchange[] } {
    return { dropped: this.#entries.dropped, exchanges: this.#entries.items };
  }
}

function pickHeaders(headers: Record<string, string>): Record<string, string> {
  return redactHeaders(
    Object.fromEntries(Object.entries(headers).filter(([name]) => KEPT_RESPONSE_HEADERS.has(name))),
  );
}
