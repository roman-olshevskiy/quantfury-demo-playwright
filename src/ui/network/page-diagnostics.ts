import type { ConsoleMessage, Page, Request, Response, WebSocket } from '@playwright/test';

import { BoundedBuffer } from '../../utils/bounded-buffer';
import { redactUrl, truncate } from '../../utils/redact';
import type { NetworkExpectations } from './network-expectations';

interface DiagnosticEvent {
  at: string;
  kind: 'page-error' | 'console-error' | 'request-failed' | 'http-error';
  message: string;
  url?: string;
  /** Set when the test provoked this failure on purpose. */
  expected?: string;
}

interface SocketSummary {
  url: string;
  openedAt: string;
  framesSent: number;
  framesReceived: number;
  closedAt?: string;
}

/** Errors the third-party blocking produces by design; they are not diagnostics. */
const BLOCKED_BY_CLIENT = /ERR_BLOCKED_BY_CLIENT|NS_ERROR_FAILURE|blocked/i;
const MAX_IN_FLIGHT = 200;

/**
 * Bounded record of page errors, console errors, failed requests, HTTP errors from the app's own
 * hosts and WebSocket activity (counts only — frame payloads may carry session data).
 */
export class PageDiagnostics {
  readonly #events = new BoundedBuffer<DiagnosticEvent>(100);
  readonly #sockets = new BoundedBuffer<SocketSummary>(10);
  readonly #appHosts: ReadonlySet<string>;
  readonly #expectations: NetworkExpectations;
  #page: Page | undefined;

  readonly #onPageError = (error: Error) => {
    this.#add({ kind: 'page-error', message: error.message });
  };

  readonly #onConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error' || BLOCKED_BY_CLIENT.test(message.text())) return;
    this.#add({ kind: 'console-error', message: message.text() });
  };

  // Requests to the app's own hosts that have not finished yet. A load that never becomes ready
  // shows here which call stalled (docs/product-discovery.md §12, uncertainty 1).
  readonly #inFlight = new Map<Request, { startedAt: number; request: string }>();

  readonly #onRequest = (request: Request) => {
    if (this.#inFlight.size >= MAX_IN_FLIGHT) return;
    if (!this.#appHosts.has(new URL(request.url()).hostname)) return;
    this.#inFlight.set(request, {
      startedAt: Date.now(),
      request: `${request.method()} ${redactUrl(request.url())}`,
    });
  };

  readonly #onRequestFinished = (request: Request) => {
    this.#inFlight.delete(request);
  };

  readonly #onRequestFailed = (request: Request) => {
    this.#inFlight.delete(request);
    const reason = request.failure()?.errorText ?? 'unknown';
    if (BLOCKED_BY_CLIENT.test(reason)) return;
    this.#add({ kind: 'request-failed', message: reason, url: request.url() });
  };

  readonly #onResponse = (response: Response) => {
    if (response.status() < 400 || !this.#appHosts.has(new URL(response.url()).hostname)) return;
    this.#add({
      kind: 'http-error',
      message: `${response.request().method()} → HTTP ${String(response.status())}`,
      url: response.url(),
    });
  };

  readonly #onWebSocket = (socket: WebSocket) => {
    const summary: SocketSummary = {
      url: redactUrl(socket.url()),
      openedAt: new Date().toISOString(),
      framesSent: 0,
      framesReceived: 0,
    };
    this.#sockets.push(summary);
    socket.on('framesent', () => summary.framesSent++);
    socket.on('framereceived', () => summary.framesReceived++);
    socket.on('close', () => (summary.closedAt = new Date().toISOString()));
  };

  constructor(appHosts: Iterable<string>, expectations: NetworkExpectations) {
    this.#appHosts = new Set(appHosts);
    this.#expectations = expectations;
  }

  start(page: Page): void {
    this.#page = page;
    page.on('pageerror', this.#onPageError);
    page.on('console', this.#onConsole);
    page.on('request', this.#onRequest);
    page.on('requestfinished', this.#onRequestFinished);
    page.on('requestfailed', this.#onRequestFailed);
    page.on('response', this.#onResponse);
    page.on('websocket', this.#onWebSocket);
  }

  stop(): void {
    const page = this.#page;
    if (!page) return;
    page.off('pageerror', this.#onPageError);
    page.off('console', this.#onConsole);
    page.off('request', this.#onRequest);
    page.off('requestfinished', this.#onRequestFinished);
    page.off('requestfailed', this.#onRequestFailed);
    page.off('response', this.#onResponse);
    page.off('websocket', this.#onWebSocket);
    this.#page = undefined;
  }

  get unexpectedEvents(): readonly DiagnosticEvent[] {
    return this.#events.items.filter((event) => event.expected === undefined);
  }

  toJSON() {
    const now = Date.now();
    return {
      droppedEvents: this.#events.dropped,
      events: this.#events.items,
      inFlightRequests: [...this.#inFlight.values()].map(({ startedAt, request }) => ({
        request,
        pendingForMs: now - startedAt,
      })),
      webSockets: this.#sockets.items,
    };
  }

  #add(event: Omit<DiagnosticEvent, 'at' | 'expected'>): void {
    const entry: DiagnosticEvent = {
      at: new Date().toISOString(),
      ...event,
      message: truncate(event.message, 300),
    };
    if (event.url !== undefined) {
      entry.url = redactUrl(event.url);
      const reason = this.#expectations.reasonFor(event.url);
      if (reason !== undefined) entry.expected = reason;
    }
    this.#events.push(entry);
  }
}
