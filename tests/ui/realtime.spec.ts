import { env } from '../../src/config/env';
import { expect, test } from '../../src/fixtures';
import { RealtimeHubMonitor } from '../../src/ui/network/realtime-hub-monitor';

test.describe('Real-time channel', { tag: ['@ui', '@live', '@regression'] }, () => {
  test('UI-07 the app opens the SignalR hub with MessagePack and receives frames', async ({
    page,
    tradePage,
  }) => {
    const hub = RealtimeHubMonitor.watch(page, env.API_BASE_URL);

    await tradePage.open();

    await expect
      .poll(() => hub.handshake(), { message: 'SignalR handshake' })
      .toEqual({
        protocol: 'messagepack',
        version: 1,
      });
    expect(hub.connections, 'hub connections').toBe(1);
    await expect
      .poll(() => hub.framesReceived, { message: 'frames from the hub' })
      .toBeGreaterThan(1);
  });
});
