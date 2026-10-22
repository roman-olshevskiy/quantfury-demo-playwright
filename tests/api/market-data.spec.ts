import {
  BAR_PERIOD_5_MINUTES,
  BAR_PERIOD_DURATION_MS,
  type ChartBar,
} from '../../src/api/models/market-data';
import { apiPaths } from '../../src/api/paths';
import { validators } from '../../src/api/schemas/validators';
import { expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { knownInstruments, unknownInstrument } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';

const HOUR_MS = 3_600_000;

test.describe('Quotes API', { tag: ['@api', '@live'] }, () => {
  test(
    'API-05 quotes are returned for every requested instrument',
    { tag: '@smoke' },
    async ({ api }) => {
      const requested = [knownInstruments.cryptoPair, knownInstruments.forexPair];

      const response = await api.marketData.getPrices(requested);

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.quotesResponse, 'POST /v13/price');
      expect(body.data.map((quote) => quote.n).sort(), 'quoted instruments').toEqual(
        [...requested].sort(),
      );
      // Live values are never compared to constants; only relations that hold for any quote.
      for (const quote of body.data) {
        expect.soft(quote.p, `${quote.n}: last price is positive`).toBeGreaterThan(0);
        expect.soft(quote.b, `${quote.n}: bid ≤ ask`).toBeLessThanOrEqual(quote.a);
        expect.soft(quote.l, `${quote.n}: session low ≤ high`).toBeLessThanOrEqual(quote.h);
      }
    },
  );

  test(
    'API-06 unknown instruments are omitted from quotes',
    { tag: '@regression' },
    async ({ api }) => {
      const response = await api.marketData.getPrices([
        knownInstruments.cryptoPair,
        unknownInstrument,
      ]);

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.quotesResponse, 'POST /v13/price');
      expect(body.data.map((quote) => quote.n)).toEqual([knownInstruments.cryptoPair]);
    },
  );

  test(
    'API-06 an empty instrument list is a validation error',
    { tag: '@regression' },
    async ({ api }) => {
      const response = await api.marketData.getPrices([]);

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.errorEnvelope, 'error envelope');
      expect(body.code).toBe('ValidationFailed');
      expect(body.error).toContain('Short Names');
    },
  );

  test(
    'API-06 a malformed instrument list is rejected',
    { tag: '@regression' },
    async ({ api }) => {
      // A string where the API expects an array of short names.
      const response = await api.raw.post(apiPaths.price, {
        shortNames: knownInstruments.cryptoPair,
      });

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.errorEnvelope, 'error envelope');
      expect(body.code).toBe('StringContainsNotAllowedSymbols');
    },
  );
});

test.describe('Chart API', { tag: ['@api', '@live', '@regression'] }, () => {
  test('API-08 historical bars respect the requested range and OHLC rules', async ({ api }) => {
    const to = Date.now();
    const from = to - 6 * HOUR_MS;
    const count = 10;
    const periodMs = BAR_PERIOD_DURATION_MS[BAR_PERIOD_5_MINUTES] ?? 0;

    const response = await api.marketData.getChart({
      shortName: knownInstruments.cryptoPair,
      barPeriod: BAR_PERIOD_5_MINUTES,
      from,
      to,
      count,
    });

    const body = await expectJsonResponse(response, 200);
    expectToMatchSchema(body, validators.chartResponse, 'POST /v13/chart/web');
    const { s: shortName, p: barPeriod, b: bars } = body.data;
    expect(shortName).toBe(knownInstruments.cryptoPair);
    expect(barPeriod).toBe(BAR_PERIOD_5_MINUTES);
    // A crypto pair trades 24/7, so a 6-hour window has bars.
    expect(bars.length, 'bar count').toBeGreaterThan(0);
    expect(bars.length, 'bar count').toBeLessThanOrEqual(count);

    const describeBar = (bar: ChartBar) => new Date(bar.s).toISOString();
    for (const bar of bars) {
      expect.soft(bar.e - bar.s, `${describeBar(bar)}: bar duration`).toBe(periodMs);
      expect
        .soft(bar.l, `${describeBar(bar)}: low ≤ open/close`)
        .toBeLessThanOrEqual(Math.min(bar.o, bar.c));
      expect
        .soft(bar.h, `${describeBar(bar)}: high ≥ open/close`)
        .toBeGreaterThanOrEqual(Math.max(bar.o, bar.c));
      expect.soft(bar.e, `${describeBar(bar)}: ends after the range start`).toBeGreaterThan(from);
      expect
        .soft(bar.s, `${describeBar(bar)}: starts before the range end`)
        .toBeLessThanOrEqual(to);
    }
    const starts = bars.map((bar) => bar.s);
    expect(starts, 'bars are ordered newest first').toEqual([...starts].sort((a, b) => b - a));
  });

  test('API-08 an unknown instrument has no bars', async ({ api }) => {
    const to = Date.now();

    const response = await api.marketData.getChart({
      shortName: unknownInstrument,
      barPeriod: BAR_PERIOD_5_MINUTES,
      from: to - HOUR_MS,
      to,
      count: 3,
    });

    const body = await expectJsonResponse(response, 200);
    expectToMatchSchema(body, validators.chartResponse, 'POST /v13/chart/web');
    expect(body.data.s).toBe(unknownInstrument);
    expect(body.data.b).toEqual([]);
  });
});

test.describe('Markets API', { tag: ['@api', '@live', '@regression'] }, () => {
  test('API-09 exchange sessions are well-formed', async ({ api }) => {
    const response = await api.marketData.getMarkets();

    const body = await expectJsonResponse(response, 200);
    expectToMatchSchema(body, validators.marketsResponse, 'GET /v13/markets');
    const mics = body.data.map((market) => market.exchangeMic);
    expect(new Set(mics).size, 'exchange MICs are unique').toBe(mics.length);

    for (const market of body.data) {
      const label = market.exchangeMic;
      expect
        .soft(market.previousSessionEndWork, `${label}: previous session ends first`)
        .toBeLessThanOrEqual(market.startWork);
      expect
        .soft(market.startWork, `${label}: session starts before it ends`)
        .toBeLessThan(market.endWork);
      expect
        .soft(market.endWork, `${label}: next session starts after this one`)
        .toBeLessThanOrEqual(market.nextSessionStartWork);
      // FOREX, CRYPTO and CME24 span several days with a 24 h working interval, so the session
      // span is "at least" the interval rather than equal to it.
      expect
        .soft(market.endWork - market.startWork, `${label}: span covers working interval`)
        .toBeGreaterThanOrEqual(market.workingInterval);
    }
  });
});
