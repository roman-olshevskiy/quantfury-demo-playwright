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
  /** Single HTTP request made through APIRequestContext. */
  apiRequest: 30_000,
} as const;
