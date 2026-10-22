import type { Page, WebSocket } from '@playwright/test';

import { realtimeHubPath } from '../../api/paths';
import { HubTraffic, type SentInvocation } from './hub-traffic';

/** True when a WebSocket URL is the demo's SignalR hub on the given API host. */
export function isRealtimeHub(url: string, apiBaseUrl: string): boolean {
  const hub = new URL(realtimeHubPath, apiBaseUrl);
  const candidate = new URL(url);
  return candidate.host === hub.host && candidate.pathname === hub.pathname;
}

/**
 * Observes the SignalR hub connections of a live page (read-only). Frames are decoded down to the
 * envelope — message kind, target, instrument short names — so tests can check subscriptions;
 * push payloads are opaque binary and are never stored (requirements §13).
 */
export class RealtimeHubMonitor {
  readonly #apiBaseUrl: string;
  readonly #connections: HubTraffic[] = [];

  private constructor(apiBaseUrl: string) {
    this.#apiBaseUrl = apiBaseUrl;
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
    return this.#connections.length;
  }

  get framesReceived(): number {
    return this.#connections.reduce((sum, traffic) => sum + traffic.framesReceived, 0);
  }

  get undecodable(): number {
    return this.#connections.reduce((sum, traffic) => sum + traffic.undecodable, 0);
  }

  /** The handshake of the first connection, or undefined before it was sent. */
  handshake(): unknown {
    return this.#connections[0]?.handshake;
  }

  /** Invocations sent on all connections, optionally only one target. */
  sent(target?: string): SentInvocation[] {
    return this.#connections.flatMap((traffic) => traffic.sent(target));
  }

  /** Received messages of one target or kind, over all connections. */
  received(targetOrKind: string): number {
    return this.#connections.reduce((sum, traffic) => sum + traffic.received(targetOrKind), 0);
  }

  #track(socket: WebSocket): void {
    if (!isRealtimeHub(socket.url(), this.#apiBaseUrl)) return;
    const traffic = new HubTraffic();
    this.#connections.push(traffic);
    socket.on('framesent', (frame) => {
      traffic.recordSent(frame.payload);
    });
    socket.on('framereceived', (frame) => {
      traffic.recordReceived(frame.payload);
    });
  }
}
