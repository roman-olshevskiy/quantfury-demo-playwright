import { stripOptionalFieldsOf } from '../../src/data/builders/instrument.builder';
import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures/mocked';

test.describe('Instrument list with mocked data', { tag: ['@mocked', '@ui'] }, () => {
  test('MOC-06 an instrument without optional fields is still searchable and selectable', async ({
    instrumentSnapshot,
    mockApi,
    tradePage,
  }) => {
    const shortName = knownInstruments.usStock;
    const mocked = stripOptionalFieldsOf(instrumentSnapshot, shortName);
    const record = mocked.data.updated.find((instrument) => instrument.sn === shortName);
    expect(record, 'instrument in the mocked list').toBeDefined();
    expect(record, 'optional fields removed').not.toHaveProperty('sy');
    // Registered after the snapshot route of the mocked suite, so it takes precedence.
    await mockApi.serveInstrumentList(mocked);

    await tradePage.open();

    await tradePage.search.searchFor('AAPL');
    await expect(tradePage.search.result(shortName)).toContainText('Apple Inc.');
    await tradePage.search.select(shortName);
    await expect(tradePage.instrumentPanel.name).toHaveText('Apple Inc.');
  });
});
