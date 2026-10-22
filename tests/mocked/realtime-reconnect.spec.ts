import {
  HUB_CLIENT_METHODS,
  HUB_HANDSHAKE,
  HUB_SERVER_EVENTS,
  OBSERVED_RECONNECT_DELAY_MS,
} from '../../src/api/models/realtime';
import { expect, test } from '../../src/fixtures/mocked';
import type { HubTraffic } from '../../src/ui/network/hub-traffic';

// The hub traffic passes through a local proxy to the real hub; the test only injects the
// failure (requirements §13: negative network scenarios through local mocks).

const pricesSubscribed = (traffic: HubTraffic) => () =>
  traffic.sent(HUB_CLIENT_METHODS.subscribePrices).flatMap((invocation) => invocation.instruments)
    .length;

test.describe('Real-time channel with a dropped connection', { tag: ['@mocked', '@ui'] }, () => {
  test('MOC-07 after the hub connection drops, the app reconnects and re-subscribes', async ({
    mockApi,
    tradePage,
  }) => {
    const hub = await mockApi.proxyRealtimeHub();
    await tradePage.open();
    await expect.poll(() => hub.connectionCount, { message: 'first hub connection' }).toBe(1);
    await expect
      .poll(pricesSubscribed(hub.connection(0)), { message: 'initial subscription' })
      .toBeGreaterThan(0);

    await hub.dropActiveConnection();

    // Observed: a new connection after a fixed ~15 s delay; allow 10 s on top.
    await expect
      .poll(() => hub.connectionCount, {
        message: 'a new hub connection after the drop',
        timeout: OBSERVED_RECONNECT_DELAY_MS + 10_000,
      })
      .toBe(2);
    const reconnected = hub.connection(1);
    await expect.poll(() => reconnected.handshake, { message: 'handshake' }).toEqual(HUB_HANDSHAKE);
    await expect
      .poll(pricesSubscribed(reconnected), { message: 'prices re-subscribed' })
      .toBeGreaterThan(0);
    await expect
      .poll(() => reconnected.received(HUB_SERVER_EVENTS.newPrice), {
        message: 'prices received again',
      })
      .toBeGreaterThan(0);
    await expect(tradePage.momentum.rows.first(), 'widgets still show data').toBeVisible();
  });
});
