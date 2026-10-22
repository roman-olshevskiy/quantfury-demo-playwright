// Timeouts are set per kind instead of raising one global value. See README "Timeouts".
export const timeouts = {
  /** Whole test, including fixtures. */
  test: 60_000,
  /** Web-first assertion retry window (`expect(...).toBeVisible()` and friends). */
  expect: 10_000,
  /** Single UI action such as click or fill. */
  action: 15_000,
  /** `page.goto` / `page.reload`. */
  navigation: 30_000,
  /**
   * Navigation until the trade layout is rendered. About 1 in 15-20 fresh loads stalls ~15 s on
   * the client after the instrument list has arrived (docs/product-discovery.md §12); such starts
   * are annotated as `slow-start` in the report instead of being hidden.
   */
  appStart: 30_000,
  /** A start-up slower than this is annotated as `slow-start`. Normal starts take ~2 s. */
  slowStartThreshold: 6_000,
  /** Single HTTP request made through APIRequestContext. */
  apiRequest: 30_000,
} as const;
