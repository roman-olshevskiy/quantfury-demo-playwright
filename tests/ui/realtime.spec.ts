import {
  HUB_CLIENT_METHODS,
  HUB_HANDSHAKE,
  HUB_SERVER_EVENTS,
} from '../../src/api/models/realtime';
import { env } from '../../src/config/env';
import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';
import { RealtimeHubMonitor } from '../../src/ui/network/realtime-hub-monitor';

test.describe('Real-time channel', { tag: ['@ui', '@live', '@regression'] }, () => {
  test('UI-07 the app subscribes to price streams over the MessagePack hub and receives prices', async ({
    page,
    tradePage,
  }) => {
    const hub = RealtimeHubMonitor.watch(page, env.API_BASE_URL);

    await tradePage.open();

    await expect
      .poll(() => hub.handshake(), { message: 'SignalR handshake' })
      .toEqual(HUB_HANDSHAKE);
    expect(hub.connections, 'hub connections').toBe(1);
    await expect
      .poll(
        () => hub.sent(HUB_CLIENT_METHODS.subscribePrices).flatMap((s) => s.instruments).length,
        {
          message: 'instruments subscribed for prices',
        },
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() => hub.received(HUB_SERVER_EVENTS.newPrice), { message: 'price pushes received' })
      .toBeGreaterThan(0);
    expect(hub.undecodable, 'frames with an undecodable envelope').toBe(0);
  });

  test('UI-10 selecting an instrument subscribes to its details and trades', async ({
    page,
    tradePage,
  }) => {
    // A crypto pair trades 24/7, so detail updates arrive at any time of day.
    const shortName = knownInstruments.cryptoPair;
    const hub = RealtimeHubMonitor.watch(page, env.API_BASE_URL);
    await tradePage.open();

    await tradePage.search.searchFor(shortName);
    await tradePage.search.select(shortName);

    const subscribedTo = (method: string) => () =>
      hub.sent(method).flatMap((invocation) => invocation.instruments);
    await expect
      .poll(subscribedTo(HUB_CLIENT_METHODS.subscribeDetails), { message: 'details subscription' })
      .toContain(shortName);
    await expect
      .poll(subscribedTo(HUB_CLIENT_METHODS.subscribeTrades), { message: 'trades subscription' })
      .toContain(shortName);
    await expect
      .poll(() => hub.received(HUB_SERVER_EVENTS.newDetails), {
        message: 'detail updates received',
        timeout: 15_000,
      })
      .toBeGreaterThan(0);
  });
});
