// Every path here was observed in the public demo mode (docs/product-discovery.md §6).

export const API_VERSION = '13.0';

export const apiPaths = {
  demoApi: '/v13/users/demoapi',
  instruments: '/v13/instruments',
  searchCategories: '/v13/searchCategories',
  instrumentDetails: '/v13/instrumentDetails',
  price: '/v13/price',
  chart: '/v13/chart/web',
  markets: '/v13/markets',
  news: '/v13/news',
  topGainers: '/v13/tradeHolded/topGainers',
  topLosers: '/v13/tradeHolded/topLoosers',
  mostTraded: '/v13/tradeHolded/mostTraded',
} as const;

/** SignalR hub on the demo API host (MessagePack protocol, docs/product-discovery.md §7). */
export const realtimeHubPath = '/signalr/v13/QuantfuryHub';
