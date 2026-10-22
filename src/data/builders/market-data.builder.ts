import type { SuccessEnvelope } from '../../api/models/envelope';
import type { Quote } from '../../api/models/market-data';
import type { TradeHoldedItem } from '../../api/models/market-insights';
import { validators } from '../../api/schemas/validators';
import { expectToMatchSchema } from '../../assertions/schema';
import { successEnvelope } from './envelope.builder';

// Builders return payloads that pass the same JSON Schemas as live responses, so a mock can never
// drift from the observed contract unnoticed (requirements §15).

/** A momentum / most-traded list. Entries are flagged so they show under the "All" filter. */
export function buildTradeHoldedResponse(
  shortNames: readonly string[],
): SuccessEnvelope<TradeHoldedItem[]> {
  const body = successEnvelope(
    shortNames.map((shortName) => ({ shortName, showForAllShortcut: true })),
  );
  expectToMatchSchema(body, validators.tradeHoldedResponse, 'mocked tradeHolded response');
  return body;
}

export interface QuoteValues {
  n: string;
  p: number;
  /** Change, percent. */
  c: number;
}

/** A synthetic quote with a tight spread around `p` and a flat session at `p`. */
export function buildQuote({ n, p, c }: QuoteValues, timestamp = Date.now()): Quote {
  const spread = p / 10_000;
  return {
    i: `mock-${n}`,
    n,
    p,
    b: p - spread,
    a: p + spread,
    c,
    d: timestamp,
    pd: timestamp,
    r: 1,
    s: 'N',
    o: p,
    h: p,
    l: p,
    v: 0,
    o1: p,
    h1: p,
    l1: p,
    v1: 0,
  };
}

/**
 * Replaces the quotes of selected instruments inside a real `/v13/price` response and leaves the
 * rest untouched, then validates the result.
 */
export function overrideQuotes(
  realBody: unknown,
  overrides: readonly QuoteValues[],
): SuccessEnvelope<Quote[]> {
  expectToMatchSchema(realBody, validators.quotesResponse, 'live /v13/price response');
  const byName = new Map(overrides.map((values) => [values.n, values]));
  // Only quotes present in the real response are replaced: the app renders quotes it asked for.
  const data = realBody.data.map((quote) => {
    const values = byName.get(quote.n);
    return values ? buildQuote(values, quote.d) : quote;
  });
  const body = successEnvelope(data);
  expectToMatchSchema(body, validators.quotesResponse, 'mocked /v13/price response');
  return body;
}
