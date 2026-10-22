import type { Locator } from '@playwright/test';

const NAME_CELL = '[data-testid^="trades_instrument_name_"]';

/**
 * Widget listing instruments with price and change ("Trade The Momentum", "Most Traded"). Both
 * share the same row markup; they differ in their dropdown test ids.
 */
export class InstrumentListWidget {
  readonly root: Locator;
  readonly rows: Locator;
  readonly listSelector: Locator;
  readonly selectedListLabel: Locator;

  constructor(root: Locator, dropdownTestIdPrefix: string) {
    this.root = root;
    this.rows = root.getByRole('button').filter({ has: root.page().locator(NAME_CELL) });
    this.listSelector = root.getByTestId(`${dropdownTestIdPrefix}_dropdown_button_active`);
    this.selectedListLabel = root.getByTestId(
      `${dropdownTestIdPrefix}_dropdown_button_active_value`,
    );
  }

  nameCell(shortName: string): Locator {
    return this.root.getByTestId(`trades_instrument_name_${shortName}`);
  }

  priceCell(shortName: string): Locator {
    return this.root.getByTestId(`trades_instrument_price_${shortName}`);
  }

  changeCell(shortName: string): Locator {
    return this.root.getByTestId(`trades_instrument_percent_change_${shortName}`);
  }

  /** Picks a list in the widget dropdown by the option's test id (e.g. `2_top_losers`). */
  async chooseList(optionTestId: string): Promise<void> {
    await this.listSelector.click();
    await this.root.getByTestId(optionTestId).click();
  }

  /** Short names of the visible rows, in display order. */
  async shortNames(): Promise<string[]> {
    const testIds = await this.rows
      .locator(NAME_CELL)
      .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-testid') ?? ''));
    return testIds.map((testId) => testId.replace(/^trades_instrument_name_/, ''));
  }
}

export const MOMENTUM_LISTS = {
  topGainers: '1_top_gainers',
  topLosers: '2_top_losers',
} as const;
