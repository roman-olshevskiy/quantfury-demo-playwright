import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';

test.describe('Asset search', { tag: ['@ui', '@live'] }, () => {
  test(
    'UI-03 a found instrument opens in the instrument panel',
    { tag: '@smoke' },
    async ({ tradePage }) => {
      await tradePage.open();

      await tradePage.search.searchFor('Apple');
      const result = tradePage.search.result(knownInstruments.usStock);
      await expect(result).toContainText('AAPL');
      await expect(result).toContainText('Apple Inc.');
      await tradePage.search.select(knownInstruments.usStock);

      const panel = tradePage.instrumentPanel;
      await expect(panel.name).toHaveText('Apple Inc.');
      await expect(panel.lastPriceLabel).toHaveText('Last Price');
      await expect(panel.lastPrice).toHaveText(/^\d{1,3}(,\d{3})*\.\d{2}$/);
    },
  );

  test(
    'UI-04 an unknown query shows no results and popular searches',
    {
      tag: '@regression',
    },
    async ({ tradePage }) => {
      const query = 'zzqxw';
      await tradePage.open();

      await tradePage.search.searchFor(query);

      await expect(tradePage.search.noResultsMessage).toBeVisible();
      await expect(tradePage.search.echoedQuery).toHaveText(`“${query}”`);
      await expect(tradePage.search.popularShortNameLabels.first()).toBeVisible();
    },
  );
});
