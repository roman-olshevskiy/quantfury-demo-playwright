// SignalR hub methods observed in the demo (docs/product-discovery.md §7). Client → server
// invocations and server → client pushes; push payloads are opaque binary.

export const HUB_CLIENT_METHODS = {
  subscribeSystemUpdates: 'SubscribeSystemUpdates',
  subscribePrices: 'SubscribeToPriceStreams',
  unsubscribePrices: 'UnsubscribePriceStreams',
  subscribeDetails: 'SubscribeToDetailsStream',
  subscribeTrades: 'SubscribeToTradesStream',
} as const;

export const HUB_SERVER_EVENTS = {
  newPrice: 'OnNewPriceAsync',
  newDetails: 'OnNewDetailsAsync',
  newTrade: 'OnNewTradeAsync',
} as const;

/** The client handshake: SignalR protocol name and version. */
export const HUB_HANDSHAKE = { protocol: 'messagepack', version: 1 } as const;

/** The web app reconnects this long after the hub connection drops (3/3 observations). */
export const OBSERVED_RECONNECT_DELAY_MS = 15_000;
