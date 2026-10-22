import { POPULAR_CATEGORIES } from '../../src/api/models/instrument';
import { API_VERSION } from '../../src/api/paths';
import { validators } from '../../src/api/schemas/validators';
import { expectDemoApiHeaders, expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { env } from '../../src/config/env';
import { knownInstruments, unknownInstrument } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';

const DAY_MS = 86_400_000;

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)));
}

test.describe('Instruments API', { tag: ['@api', '@live'] }, () => {
  test('API-02 full instrument list is consistent', { tag: '@smoke' }, async ({ api }) => {
    const response = await api.instruments.getInstruments();

    const body = await test.step('response matches the contract', async () => {
      const json = await expectJsonResponse(response, 200);
      expectToMatchSchema(json, validators.instrumentsResponse, 'GET /v13/instruments');
      expectDemoApiHeaders(response, env.BASE_URL, API_VERSION);
      return json;
    });

    const { updated, popularBySearchCategory } = body.data;
    const shortNames = updated.map((instrument) => instrument.sn);

    await test.step('the list is a full snapshot, not a delta', () => {
      // Discovery saw ~3,500 instruments; the UI advertises "more than 2000 assets".
      expect(updated.length, 'instrument count').toBeGreaterThan(2000);
    });

    await test.step('short names are unique', () => {
      expect(duplicates(shortNames), 'duplicated short names').toEqual([]);
    });

    await test.step('popular instruments exist in the list', () => {
      const known = new Set(shortNames);
      for (const category of POPULAR_CATEGORIES) {
        const missing = popularBySearchCategory[category].filter((sn) => !known.has(sn));
        expect(missing, `popular "${category}" instruments missing from the list`).toEqual([]);
      }
    });
  });

  test(
    'API-03 delta sync after a future timestamp is empty',
    { tag: '@regression' },
    async ({ api }) => {
      const response = await api.instruments.getInstruments({ afterDate: Date.now() + DAY_MS });

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.instrumentsResponse, 'GET /v13/instruments?afterDate');
      expect(body.data.updated, 'updated instruments').toEqual([]);
      expect(body.data.deleted, 'deleted instruments').toEqual([]);
      expect(body.data.reseted, 'reset instruments').toEqual([]);
    },
  );

  test(
    'API-04 every instrument references existing search categories',
    {
      tag: '@regression',
    },
    async ({ api }) => {
      const [categoriesResponse, instrumentsResponse] = await Promise.all([
        api.instruments.getSearchCategories(),
        api.instruments.getInstruments(),
      ]);

      const categories = await expectJsonResponse(categoriesResponse, 200);
      expectToMatchSchema(categories, validators.searchCategoriesResponse, 'searchCategories');
      const instruments = await expectJsonResponse(instrumentsResponse, 200);
      expectToMatchSchema(instruments, validators.instrumentsResponse, 'instruments');

      const categoryIds = categories.data.searchCategories.map((category) => category.id);
      expect(duplicates(categoryIds.map(String)), 'duplicated category ids').toEqual([]);

      const knownIds = new Set(categoryIds);
      const orphans = instruments.data.updated
        .filter((instrument) => instrument.sc.some((id) => !knownIds.has(id)))
        .map((instrument) => `${instrument.sn} → [${instrument.sc.join(', ')}]`);
      expect(orphans, 'instruments with unknown search category ids').toEqual([]);
    },
  );

  test(
    'API-07 instrument details are returned for a known instrument',
    {
      tag: '@regression',
    },
    async ({ api }) => {
      const response = await api.instruments.getInstrumentDetails(knownInstruments.usStock);

      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.instrumentDetailsResponse, 'GET /v13/instrumentDetails');
      expect(body.data.shortName).toBe(knownInstruments.usStock);
    },
  );

  test(
    'API-07 instrument details report an unknown instrument as a business error',
    {
      tag: '@regression',
    },
    async ({ api }) => {
      const response = await api.instruments.getInstrumentDetails(unknownInstrument);

      // Business errors use HTTP 200 with isSuccess: false (docs/product-discovery.md §6).
      const body = await expectJsonResponse(response, 200);
      expectToMatchSchema(body, validators.errorEnvelope, 'error envelope');
      expect(body.code).toBe('TradingInstrumentDetailsNotFound');
    },
  );
});
