import { apiPaths } from '../../src/api/paths';
import { errorEnvelope } from '../../src/data/builders/envelope.builder';
import {
  buildTradeHoldedResponse,
  overrideQuotes,
} from '../../src/data/builders/market-data.builder';
import { knownInstruments } from '../../src/data/known-instruments';
import { expect, test } from '../../src/fixtures/mocked';

// Only `/v13/tradeHolded/topGainers` (and `/v13/price` in MOC-05) is mocked, plus the full
// instrument list served from the worker snapshot; every other request reaches the real demo
// backend. The expected UI reactions were observed in M2 exploration.

test.describe('Momentum widget with mocked data', { tag: ['@mocked', '@ui'] }, () => {
  test('MOC-01 an empty gainers list shows an empty state', async ({ mockApi, tradePage }) => {
    await mockApi.fulfillJson(apiPaths.topGainers, buildTradeHoldedResponse([]));

    await tradePage.open();

    await expect(tradePage.momentum.root).toContainText('0 Gainers');
    await expect(tradePage.momentum.rows).toHaveCount(0);
    await expect(tradePage.mostTraded.rows.first(), 'other widgets unaffected').toBeVisible();
  });

  test('MOC-02 an HTTP error shows a retry message in the widget only', async ({
    mockApi,
    tradePage,
  }) => {
    await mockApi.failWithStatus(apiPaths.topGainers, 500);

    await tradePage.open();

    await expect(tradePage.momentum.root).toContainText('An error occurred, please try again');
    await expect(tradePage.momentum.rows).toHaveCount(0);
    await expect(tradePage.mostTraded.rows.first(), 'other widgets unaffected').toBeVisible();
  });

  test('MOC-03 a business error shows the server message', async ({ mockApi, tradePage }) => {
    const message = 'Mocked: momentum list is unavailable';
    await mockApi.fulfillJson(apiPaths.topGainers, errorEnvelope('MockedFailure', message));

    await tradePage.open();

    await expect(tradePage.momentum.root).toContainText(message);
    await expect(tradePage.momentum.rows).toHaveCount(0);
    await expect(tradePage.mostTraded.rows.first(), 'other widgets unaffected').toBeVisible();
  });

  test('MOC-04 a slow response keeps the widget loading until data arrives', async ({
    mockApi,
    tradePage,
  }) => {
    const held = await mockApi.hold(apiPaths.topGainers);

    await tradePage.open();
    await held.requested;

    await test.step('while the response is held', async () => {
      await expect(tradePage.mostTraded.rows.first(), 'other widgets render').toBeVisible();
      await expect(tradePage.momentum.rows).toHaveCount(0);
      await expect(tradePage.momentum.root).not.toContainText('0 Gainers');
      await expect(tradePage.momentum.root).not.toContainText('An error occurred');
    });

    held.release();

    await expect(tradePage.momentum.rows.first(), 'rows after the response').toBeVisible();
  });

  test('MOC-05 fixed quotes render with currency, grouping and rounding', async ({
    mockApi,
    tradePage,
  }) => {
    // Live quotes from the hub would overwrite the mocked ones.
    await mockApi.stubRealtimeHub();
    await mockApi.fulfillJson(
      apiPaths.topGainers,
      buildTradeHoldedResponse([knownInstruments.usStock, knownInstruments.cryptoPair]),
    );
    await mockApi.transformJson(apiPaths.price, (body) =>
      overrideQuotes(body, [
        { n: knownInstruments.usStock, p: 1234.5, c: 3.456 },
        { n: knownInstruments.cryptoPair, p: 81234.567, c: -1.5 },
      ]),
    );

    await tradePage.open();

    const { momentum } = tradePage;
    await expect(momentum.rows).toHaveCount(2);
    // USD is drawn by the font from "Χ" (U+03A7); USDT pairs have no symbol.
    await expect(momentum.priceCell(knownInstruments.usStock)).toHaveText('Χ1,234.50');
    await expect(momentum.changeCell(knownInstruments.usStock)).toHaveText('3.46%');
    await expect(momentum.priceCell(knownInstruments.cryptoPair)).toHaveText('81,234.57');
    // The sign is shown by an arrow icon, not in the text.
    await expect(momentum.changeCell(knownInstruments.cryptoPair)).toHaveText('1.50%');
  });
});
