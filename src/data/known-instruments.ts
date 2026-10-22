// Instruments the tests rely on. All were present in the demo instrument list during discovery
// (docs/product-discovery.md). If one disappears, the failure is a data condition, not a defect.

export const knownInstruments = {
  /** Crypto pair, trades 24/7. */
  cryptoPair: 'BTC/USDT',
  /** Forex pair. */
  forexPair: 'EUR/USD',
  /** US stock with company details, earnings and analyst data. */
  usStock: 'AAPL.OQ',
} as const;

/** Syntactically valid short name that does not exist. */
export const unknownInstrument = 'NOPE.XX';
