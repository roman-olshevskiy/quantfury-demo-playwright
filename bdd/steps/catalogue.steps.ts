import { expect } from '@playwright/test';

import { POPULAR_CATEGORIES } from '../../src/api/models/instrument';
import { validators } from '../../src/api/schemas/validators';
import { expectJsonResponse } from '../../src/assertions/http';
import { expectToMatchSchema } from '../../src/assertions/schema';
import { findDuplicates } from '../../src/utils/collections';
import { Given, Then, When } from './fixtures';

// HTTP-only scenario: the `api` fixture gives every scenario its own demo identity and request
// context, as in the live API suite; no browser is started.

Given('a new demo visitor', ({ deviceId }) => {
  expect(deviceId, 'fresh demo identity').toMatch(/^[0-9a-f-]{36}$/);
});

When('the full instrument catalogue is requested', async ({ api, scenario }) => {
  const response = await api.instruments.getInstruments();
  const body = await expectJsonResponse(response, 200);
  expectToMatchSchema(body, validators.instrumentsResponse, 'GET /v13/instruments');
  scenario.catalogue = body.data;
});

Then('every instrument has a unique short name', ({ scenario }) => {
  const shortNames = catalogueOf(scenario.catalogue).updated.map((instrument) => instrument.sn);
  expect(findDuplicates(shortNames), 'duplicated short names').toEqual([]);
});

Then('every popular instrument is part of the catalogue', ({ scenario }) => {
  const catalogue = catalogueOf(scenario.catalogue);
  const known = new Set(catalogue.updated.map((instrument) => instrument.sn));
  for (const category of POPULAR_CATEGORIES) {
    const missing = catalogue.popularBySearchCategory[category].filter((sn) => !known.has(sn));
    expect(missing, `popular "${category}" instruments missing`).toEqual([]);
  }
});

function catalogueOf<T>(catalogue: T | undefined): T {
  if (catalogue === undefined) throw new Error('The catalogue was not requested in this scenario');
  return catalogue;
}
