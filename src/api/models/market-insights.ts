/** Entry of the "Trade The Momentum" and "Most Traded" lists (`/v13/tradeHolded/*`). */
export interface TradeHoldedItem {
  shortName: string;
  /** Only flagged entries are shown under the "All" filter (observed in M2). */
  showForAllShortcut?: boolean;
}
