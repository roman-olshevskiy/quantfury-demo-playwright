import type { Page, WebSocket } from '@playwright/test';

import { realtimeHubPath } from '../../api/paths';

// SignalR terminates JSON handshake messages with the ASCII record separator.
const RECORD_SEPARATOR = '\u001e';

/**
 * Observes the SignalR hub connection of a page at transport level. Binary MessagePack frames are
 * only counted, never stored: they are not decoded and may carry session data (requirements §13).
 */
export class RealtimeHubMonitor {
  readonly #hubUrl: URL;
  readonly #textFramesSent: string[] = [];
  #framesReceived = 0;
  #connections = 0;

  private constructor(apiBaseUrl: string) {
    this.#hubUrl = new URL(realtimeHubPath, apiBaseUrl);
  }

  /** Start before navigation so the first frames are not missed. */
  static watch(page: Page, apiBaseUrl: string): RealtimeHubMonitor {
    const monitor = new RealtimeHubMonitor(apiBaseUrl);
    page.on('websocket', (socket) => {
      monitor.#track(socket);
    });
    return monitor;
  }

  get connections(): number {
    return this.#connections;
  }

  get framesReceived(): number {
    return this.#framesReceived;
  }

  /** The first JSON message the client sent (SignalR handshake), or undefined before it is sent. */
  handshake(): unknown {
    const first = this.#textFramesSent[0];
    return first === undefined ? undefined : JSON.parse(first.split(RECORD_SEPARATOR)[0] ?? '');
  }

  #track(socket: WebSocket): void {
    const url = new URL(socket.url());
    if (url.host !== this.#hubUrl.host || url.pathname !== this.#hubUrl.pathname) return;
    this.#connections++;
    socket.on('framesent', (frame) => {
      if (typeof frame.payload === 'string' && this.#textFramesSent.length < 5) {
        this.#textFramesSent.push(frame.payload);
      }
    });
    socket.on('framereceived', () => {
      this.#framesReceived++;
    });
  }
}
