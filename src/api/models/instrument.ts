// Abbreviated keys are the API's own. Meanings marked "inferred" are not documented by the product
// (docs/product-discovery.md §12).

export interface Instrument {
  /** Instrument type id (1-6 observed). */
  t: number;
  /** Full name, e.g. "Apple Inc.". */
  n: string;
  /** Short name: the unique key used by every other endpoint, e.g. "AAPL.OQ". */
  sn: string;
  /** Short name shown in the UI, e.g. "AAPL". */
  snd: string;
  /** Header name (inferred). */
  hn: string;
  /** Exchange name, e.g. "Nasdaq". */
  en: string;
  /** Exchange country ISO code. */
  eci: string;
  /** Exchange MIC as used by `/v13/markets`. */
  em: string;
  /** Instrument currency, e.g. "USD". */
  ic: string;
  /** Unit of trading, e.g. "share", "pair", "barrel" (inferred). */
  s: string;
  /** Price rounding digits. */
  r: number;
  /** Search category ids (`/v13/searchCategories`). */
  sc: number[];
  aot: number;
  los: number;
  sos: number;
  tos: number;
  lopgp: number;
  f: boolean;
  auss: boolean;
  /** Comma-separated search synonyms. */
  sy?: string;
  ed?: number;
  tn?: string;
  ig?: string;
}

export const POPULAR_CATEGORIES = ['all', 'crypto', 'etfs', 'forex', 'futures', 'stock'] as const;
export type PopularCategory = (typeof POPULAR_CATEGORIES)[number];

export interface InstrumentsData {
  updated: Instrument[];
  /** Always empty in observations; item shape unknown. */
  deleted: unknown[];
  /** Always empty in observations; item shape unknown. */
  reseted: unknown[];
  /** Server timestamp (ms) to pass as `afterDate` for the next delta sync. */
  afterDate: number;
  popularBySearchCategory: Record<PopularCategory, string[]>;
}

export interface SearchCategory {
  id: number;
  /** Comma-separated multilingual synonyms; the first one is the English name. */
  value: string;
}

export interface SearchCategoriesData {
  searchCategories: SearchCategory[];
}

export interface InstrumentDetails {
  shortName: string;
  description: string;
  industry?: string;
  website?: string;
}
