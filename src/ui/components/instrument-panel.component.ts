import type { Locator, Page } from '@playwright/test';

/** Left panel shown after an instrument is selected. */
export class InstrumentPanel {
  readonly root: Locator;
  readonly name: Locator;
  readonly lastPriceLabel: Locator;
  /** Numeric part of the last price. */
  readonly lastPrice: Locator;
  /** Currency glyph + last price; the glyph has no hook of its own. */
  readonly lastPriceWithCurrency: Locator;
  readonly sellButton: Locator;
  readonly buyButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId('instrument_panel');
    // The app uses ids instead of test ids for these elements.
    this.name = this.root.locator('#details_name');
    this.lastPriceLabel = this.root.getByTestId('last_price_header');
    this.lastPrice = this.root.locator('#details_price');
    this.lastPriceWithCurrency = this.root.locator('span:has(> #details_price)');
    this.sellButton = this.root.locator('#sell');
    this.buyButton = this.root.locator('#buy');
  }
}
