import { readValidatedJson } from '../../src/api/http/read-json';
import type { Instrument, InstrumentsData } from '../../src/api/models/instrument';
import { apiPaths } from '../../src/api/paths';
import { validators } from '../../src/api/schemas/validators';
import { env } from '../../src/config/env';
import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';
import { currencyGlyph } from '../../src/ui/formatting';
import { waitForApiResponse } from '../../src/ui/network/page-responses';
import type { TradePage } from '../../src/ui/pages/trade.page';

/** Opens the demo and returns the instrument list exactly as this page received it. */
async function openWithInstrumentPayload(tradePage: TradePage): Promise<InstrumentsData> {
  const response = waitForApiResponse(tradePage.page, env.API_BASE_URL, apiPaths.instruments);
  await tradePage.open();
  const body = await readValidatedJson(
    await response,
    validators.instrumentsResponse,
    'instrument list received by the page',
  );
  return body.data;
}

function recordOf(data: InstrumentsData, shortName: string): Instrument {
  const record = data.updated.find((instrument) => instrument.sn === shortName);
  if (record === undefined) {
    // Data condition, not a product defect: the test data instrument is no longer offered.
    throw new Error(`${shortName} is not in the instrument list the page received`);
  }
  return record;
}

test.describe('UI and API consistency', { tag: ['@integration', '@live'] }, () => {
  test('INT-01 instruments from the API payload are found by search', async ({ tradePage }) => {
    const data = await openWithInstrumentPayload(tradePage);

    for (const shortName of [knownInstruments.usStock, knownInstruments.cryptoPair]) {
      const record = recordOf(data, shortName);

      await test.step(`${record.sn} (${record.n})`, async () => {
        await tradePage.search.searchFor(record.snd);

        const result = tradePage.search.result(record.sn);
        await expect(result).toContainText(record.snd);
        await expect(result).toContainText(record.n);
      });
    }
  });

  test('INT-02 the instrument panel shows the static attributes of the API record', async ({
    tradePage,
  }) => {
    const data = await openWithInstrumentPayload(tradePage);
    const record = recordOf(data, knownInstruments.usStock);

    await tradePage.search.searchFor(record.snd);
    await tradePage.search.select(record.sn);

    const panel = tradePage.instrumentPanel;
    await expect(panel.name).toHaveText(record.n);
    // Static attribute only: the live price itself changes and is not compared.
    await expect(panel.lastPriceWithCurrency).toHaveText(
      new RegExp(`^${currencyGlyph(record.ic)}\\d`),
    );
  });

  test('INT-03 popular searches follow the API payload', async ({ tradePage }) => {
    const data = await openWithInstrumentPayload(tradePage);

    await tradePage.search.searchFor('zzqxw');
    await expect(tradePage.search.noResultsMessage).toBeVisible();

    expect(await tradePage.search.popularShortNames()).toEqual(data.popularBySearchCategory.all);
  });
});
