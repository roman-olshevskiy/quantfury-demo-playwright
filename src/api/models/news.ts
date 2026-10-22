/**
 * `instrumentType` values the web app sends to `GET /v13/news`. The mapping to widget filters is
 * inferred (docs/product-discovery.md §12).
 */
export const NEWS_INSTRUMENT_TYPES = {
  stocks: 1,
  futures: 2,
  currencies: 3,
  crypto: 5,
  etfs: 6,
} as const;

export type NewsInstrumentType = (typeof NEWS_INSTRUMENT_TYPES)[keyof typeof NEWS_INSTRUMENT_TYPES];

export interface NewsItem {
  id: string;
  /** ms */
  revisionTime: number;
  title: string;
  /** Link to the external article. */
  story: string;
  source: number;
  shortName: string;
}
