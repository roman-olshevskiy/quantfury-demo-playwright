import type { Page, WebSocketRoute } from '@playwright/test';

import { HubTraffic } from './hub-traffic';
import { isRealtimeHub } from './realtime-hub-monitor';

interface ProxiedConnection {
  page: WebSocketRoute;
  server: WebSocketRoute;
  traffic: HubTraffic;
}

/**
 * Local pass-through proxy for the SignalR hub (mocked suite only): every frame is forwarded to
 * and from the real hub unchanged and recorded, and the test can drop the connection to simulate
 * a server-side disconnect (requirements §13, P1). Register before navigation.
 */
export class HubProxy {
  readonly #connections: ProxiedConnection[] = [];

  /** Use `HubProxy.install(page, apiBaseUrl)`, which also registers the route. */
  static async install(page: Page, apiBaseUrl: string): Promise<HubProxy> {
    const proxy = new HubProxy();
    await page.routeWebSocket(
      (url) => isRealtimeHub(url.toString(), apiBaseUrl),
      (ws) => {
        proxy.#connect(ws);
      },
    );
    return proxy;
  }

  /** Number of hub connections the page has opened so far. */
  get connectionCount(): number {
    return this.#connections.length;
  }

  /** Traffic of the n-th connection (0 = first). Fails if the page has not opened it yet. */
  connection(index: number): HubTraffic {
    const connection = this.#connections[index];
    if (connection === undefined) {
      throw new Error(`Hub connection #${String(index + 1)} has not been opened`);
    }
    return connection.traffic;
  }

  /**
   * Closes the newest connection on both sides, as a server failure would: the page sees the
   * close code and reason, the real hub sees a normal close.
   */
  async dropActiveConnection(code = 1011, reason = 'Simulated server failure'): Promise<void> {
    const active = this.#connections.at(-1);
    if (active === undefined) throw new Error('No hub connection to drop');
    await active.server.close();
    await active.page.close({ code, reason });
  }

  #connect(page: WebSocketRoute): void {
    const server = page.connectToServer();
    const traffic = new HubTraffic();
    this.#connections.push({ page, server, traffic });
    page.onMessage((message) => {
      traffic.recordSent(message);
      server.send(message);
    });
    server.onMessage((message) => {
      traffic.recordReceived(message);
      page.send(message);
    });
    // With onClose handlers set, Playwright no longer forwards closes; forward them explicitly.
    page.onClose((code, reason) => {
      void server.close({ code, reason });
    });
    server.onClose((code, reason) => {
      void page.close({ code, reason });
    });
  }
}
