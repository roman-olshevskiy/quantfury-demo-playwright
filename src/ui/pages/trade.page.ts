import type { Locator, Page } from '@playwright/test';

import { timeouts } from '../../config/timeouts';
import { AssetSearch } from '../components/asset-search.component';
import { InstrumentListWidget } from '../components/instrument-list-widget.component';
import { InstrumentPanel } from '../components/instrument-panel.component';

/** The public Trade screen (`/`), which is the demo mode entry point. */
export class TradePage {
  readonly page: Page;
  readonly search: AssetSearch;
  readonly momentum: InstrumentListWidget;
  readonly mostTraded: InstrumentListWidget;
  readonly instrumentPanel: InstrumentPanel;
  readonly watchlistTab: Locator;
  readonly portfolioTab: Locator;
  readonly limitOrdersTab: Locator;
  /** Milliseconds from navigation to a rendered layout, per open/reload. */
  readonly startupTimesMs: number[] = [];

  constructor(page: Page) {
    this.page = page;
    this.search = new AssetSearch(page);
    this.momentum = new InstrumentListWidget(page.getByTestId('widget_momentum'), 'momentum');
    this.mostTraded = new InstrumentListWidget(
      page.getByTestId('widget_most_traded'),
      'most_traded',
    );
    this.instrumentPanel = new InstrumentPanel(page);
    this.watchlistTab = page.getByTestId('watchlist_tab');
    this.portfolioTab = page.getByTestId('positions_tab');
    this.limitOrdersTab = page.getByTestId('limit_orders_tab');
  }

  /** Opens the demo and waits until the trade layout is rendered (not `networkidle`). */
  async open(): Promise<void> {
    await this.#untilReady(() => this.page.goto('/'));
  }

  async reload(): Promise<void> {
    await this.#untilReady(() => this.page.reload());
  }

  /** The demo identity the app keeps in localStorage (docs/product-discovery.md §9). */
  readDeviceId(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('deviceId'));
  }

  async #untilReady(navigate: () => Promise<unknown>): Promise<void> {
    const startedAt = Date.now();
    await navigate();
    await this.watchlistTab.waitFor({ timeout: timeouts.appStart });
    this.startupTimesMs.push(Date.now() - startedAt);
  }
}
