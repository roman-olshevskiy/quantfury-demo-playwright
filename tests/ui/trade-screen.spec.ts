import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures';
import { MOMENTUM_LISTS } from '../../src/ui/components/instrument-list-widget.component';

// Price text as rendered: optional currency glyph, en-US grouping, decimals.
const PRICE_TEXT = /^\D?\d{1,3}(,\d{3})*(\.\d+)?$/;
const CHANGE_TEXT = /^\d+\.\d{2}%$/;

test.describe('Trade screen', { tag: ['@ui', '@live'] }, () => {
  test(
    'UI-01 demo mode opens with trading tabs restricted',
    { tag: '@smoke' },
    async ({ tradePage }) => {
      await tradePage.open();

      await expect(tradePage.watchlistTab).toBeEnabled();
      // Portfolio and limit orders need an account (docs/product-discovery.md §1).
      await expect(tradePage.portfolioTab).toBeDisabled();
      await expect(tradePage.limitOrdersTab).toBeDisabled();
      await expect(tradePage.search.input).toBeEditable();
    },
  );

  test(
    'UI-02 instrument widgets list instruments with price and change',
    { tag: '@smoke' },
    async ({ tradePage }) => {
      await tradePage.open();

      for (const [label, widget] of [
        ['Trade The Momentum', tradePage.momentum],
        ['Most Traded', tradePage.mostTraded],
      ] as const) {
        await test.step(label, async () => {
          await expect(widget.rows.first(), `${label} has rows`).toBeVisible();
          const shortNames = await widget.shortNames();
          for (const shortName of shortNames) {
            await expect.soft(widget.priceCell(shortName)).toHaveText(PRICE_TEXT);
            await expect.soft(widget.changeCell(shortName)).toHaveText(CHANGE_TEXT);
          }
        });
      }
    },
  );

  test(
    'UI-05 switching momentum to Top Losers shows a different list',
    {
      tag: '@regression',
    },
    async ({ tradePage }) => {
      await tradePage.open();
      const { momentum } = tradePage;
      await expect(momentum.selectedListLabel).toHaveText('Top Gainers');
      await expect(momentum.rows.first()).toBeVisible();
      const gainers = await momentum.shortNames();

      await momentum.chooseList(MOMENTUM_LISTS.topLosers);

      await expect(momentum.selectedListLabel).toHaveText('Top Losers');
      await expect
        .poll(() => momentum.shortNames(), { message: 'list changed' })
        .not.toEqual(gainers);
      const losers = await momentum.shortNames();
      expect(losers.length, 'losers listed').toBeGreaterThan(0);
      expect(
        losers.filter((shortName) => gainers.includes(shortName)),
        'instruments listed both as gainer and loser',
      ).toEqual([]);
    },
  );

  test(
    'UI-06 reload keeps the demo identity and resets the selection',
    {
      tag: '@regression',
    },
    async ({ tradePage }) => {
      await tradePage.open();
      await tradePage.search.searchFor('Apple');
      await tradePage.search.select(knownInstruments.usStock);
      await expect(tradePage.instrumentPanel.name).toBeVisible();
      const deviceIdBefore = await tradePage.readDeviceId();

      await tradePage.reload();

      await expect(tradePage.instrumentPanel.root).toBeHidden();
      await expect(tradePage.search.input).toHaveValue('');
      expect(deviceIdBefore, 'device id before reload').not.toBeNull();
      expect(await tradePage.readDeviceId(), 'device id after reload').toBe(deviceIdBefore);
    },
  );
});
