import { expect } from '@playwright/test';

import { MOMENTUM_LISTS } from '../../src/ui/components/instrument-list-widget.component';
import { Given, Then, When } from './fixtures';

// Steps describe what a visitor does and sees; the work is done by the page objects.

Given('a visitor opens the Quantfury demo', async ({ tradePage }) => {
  await tradePage.open();
});

Then('the watchlist is available', async ({ tradePage }) => {
  await expect(tradePage.watchlistTab).toBeEnabled();
});

Then('the portfolio and limit orders require an account', async ({ tradePage }) => {
  await expect(tradePage.portfolioTab).toBeDisabled();
  await expect(tradePage.limitOrdersTab).toBeDisabled();
});

When('they search for {string}', async ({ tradePage }, query: string) => {
  await tradePage.search.searchFor(query);
});

When('they open the result {string}', async ({ tradePage }, shortName: string) => {
  await tradePage.search.select(shortName);
});

Then(
  'the instrument panel shows {string} with a last price',
  async ({ tradePage }, name: string) => {
    await expect(tradePage.instrumentPanel.name).toHaveText(name);
    await expect(tradePage.instrumentPanel.lastPrice).toHaveText(/^\d{1,3}(,\d{3})*\.\d{2}$/);
  },
);

Then('they are told that nothing matched {string}', async ({ tradePage }, query: string) => {
  await expect(tradePage.search.noResultsMessage).toBeVisible();
  await expect(tradePage.search.echoedQuery).toHaveText(`“${query}”`);
});

Then('popular instruments are suggested instead', async ({ tradePage }) => {
  await expect(tradePage.search.popularShortNameLabels.first()).toBeVisible();
});

Given('the momentum widget shows the top gainers', async ({ tradePage, scenario }) => {
  await expect(tradePage.momentum.selectedListLabel).toHaveText('Top Gainers');
  await expect(tradePage.momentum.rows.first()).toBeVisible();
  scenario.gainers = await tradePage.momentum.shortNames();
});

When('they switch the momentum widget to the top losers', async ({ tradePage, scenario }) => {
  await tradePage.momentum.chooseList(MOMENTUM_LISTS.topLosers);
  await expect(tradePage.momentum.selectedListLabel).toHaveText('Top Losers');
  await expect
    .poll(() => tradePage.momentum.shortNames(), { message: 'list changed' })
    .not.toEqual(scenario.gainers);
});

Then('no instrument is listed both as a gainer and as a loser', async ({ tradePage, scenario }) => {
  const losers = await tradePage.momentum.shortNames();
  expect(losers.length, 'losers listed').toBeGreaterThan(0);
  expect(losers.filter((shortName) => scenario.gainers.includes(shortName))).toEqual([]);
});
