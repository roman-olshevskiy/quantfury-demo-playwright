import type { Locator, Page } from '@playwright/test';

/** Header search box and its results dropdown. */
export class AssetSearch {
  readonly input: Locator;
  /** The search form: contains the input and the dropdown, nothing else. */
  readonly root: Locator;
  readonly noResultsMessage: Locator;
  readonly echoedQuery: Locator;
  readonly popularShortNameLabels: Locator;

  constructor(page: Page) {
    this.input = page.getByRole('textbox', { name: 'Search asset to trade' });
    this.root = page.locator('form').filter({ has: this.input });
    this.noResultsMessage = this.root.getByText('No Results Matched', { exact: true });
    this.echoedQuery = this.root.getByTestId('search_current_value');
    this.popularShortNameLabels = this.root.locator(
      '[data-testid^="popular_"][data-testid$="_short_name"]',
    );
  }

  /** A result row, keyed by the instrument short name (e.g. `AAPL.OQ`). */
  result(shortName: string): Locator {
    return this.root.getByTestId(`instrument_information_${shortName}`);
  }

  async searchFor(query: string): Promise<void> {
    await this.input.fill(query);
  }

  async select(shortName: string): Promise<void> {
    await this.result(shortName).click();
  }

  /** Short names of the "Popular Searches" rows, in display order. */
  async popularShortNames(): Promise<string[]> {
    const testIds = await this.popularShortNameLabels.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-testid') ?? ''),
    );
    return testIds.map((testId) => testId.replace(/^popular_/, '').replace(/_short_name$/, ''));
  }
}
