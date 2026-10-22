/** Quote returned by `POST /v13/price`. Prices are in the instrument currency. */
export interface Quote {
  /** Quote id. */
  i: string;
  /** Short name of the instrument. */
  n: string;
  /** Last price. */
  p: number;
  /** Bid. */
  b: number;
  /** Ask. */
  a: number;
  /** Change, percent. */
  c: number;
  /** Quote timestamp, ms. */
  d: number;
  /** Previous quote timestamp, ms (inferred). */
  pd: number;
  r: number;
  /** Status letter (inferred). */
  s: string;
  o: number;
  h: number;
  l: number;
  v: number;
  o1: number;
  h1: number;
  l1: number;
  v1: number;
  // Order book fields are present only for instruments with an exchange order book (observed for
  // crypto pairs, absent for forex).
  /** Order book, bid side: price (as string key) → size. */
  bb?: Record<string, number>;
  /** Order book, ask side: price (as string key) → size. */
  ab?: Record<string, number>;
  db?: number;
}

/** `barPeriod` values observed in the web app: 1 = 5-minute bars. */
export const BAR_PERIOD_5_MINUTES = 1;
export const BAR_PERIOD_DURATION_MS: Readonly<Record<number, number>> = {
  [BAR_PERIOD_5_MINUTES]: 5 * 60_000,
};

export interface ChartRequest {
  shortName: string;
  barPeriod: number;
  /** ms */
  from: number;
  /** ms */
  to: number;
  count: number;
}

export interface ChartBar {
  /** Bar start, ms. */
  s: number;
  /** Bar end, ms. */
  e: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  /** Change, percent. */
  p: number;
  /** Present on the newest bar (inferred: bar still open). */
  t?: boolean;
}

export interface ChartData {
  /** Short name echoed back. */
  s: string;
  /** Bar period echoed back. */
  p: number;
  /** Bars, newest first. */
  b: ChartBar[];
  l?: number;
  c?: number;
}

/** Trading session of one exchange (`GET /v13/markets`). All timestamps are ms. */
export interface MarketSession {
  exchangeMic: string;
  timezoneOffset: number;
  timezoneCode: string;
  previousSessionStartWork: number;
  previousSessionWorkingInterval: number;
  previousSessionEndWork: number;
  startWork: number;
  workingInterval: number;
  endWork: number;
  nextSessionStartWork: number;
  nextSessionWorkingInterval: number;
  nextSessionEndWork: number;
  standardSessionDuration: number;
  offMarketEnabled: boolean;
  dataDisplayMode: number;
  previousSessionPreMarketStart?: number;
  previousSessionAfterMarketEnd?: number;
  preMarketStart?: number;
  afterMarketEnd?: number;
  nextSessionPreMarketStart?: number;
  nextSessionAfterMarketEnd?: number;
  previousSessionBreakStart?: number;
  previousSessionBreakEnd?: number;
  breakStart?: number;
  breakEnd?: number;
  nextSessionBreakStart?: number;
  nextSessionBreakEnd?: number;
}
