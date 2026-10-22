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
} as const;
