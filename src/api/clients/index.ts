import { env } from '../../config/env';
import type { ApiTransport } from '../http/api-transport';
import { BootstrapClient } from './bootstrap.client';
import { InstrumentsClient } from './instruments.client';
import { MarketDataClient } from './market-data.client';
import { NewsClient } from './news.client';

export { BootstrapClient, InstrumentsClient, MarketDataClient, NewsClient };

export interface DemoApi {
  bootstrap: BootstrapClient;
  instruments: InstrumentsClient;
  marketData: MarketDataClient;
  news: NewsClient;
  /** Raw transport to the demo API host, for deliberately malformed requests. */
  raw: ApiTransport;
}

export function createDemoApi(transports: {
  bootstrap: ApiTransport;
  demo: ApiTransport;
}): DemoApi {
  return {
    bootstrap: new BootstrapClient(transports.bootstrap),
    instruments: new InstrumentsClient(transports.demo),
    marketData: new MarketDataClient(transports.demo),
    news: new NewsClient(transports.demo),
    raw: transports.demo,
  };
}

export const apiHosts = {
  bootstrap: env.DEMO_BOOTSTRAP_URL,
  demo: env.API_BASE_URL,
} as const;
