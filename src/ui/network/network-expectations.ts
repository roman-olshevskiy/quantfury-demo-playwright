export type UrlPredicate = (url: URL) => boolean;

interface Expectation {
  matches: UrlPredicate;
  reason: string;
}

/**
 * Failures a test provokes on purpose (mocked HTTP errors). Diagnostics label matching entries as
 * expected so a report separates them from unexpected failures (requirements §19).
 */
export class NetworkExpectations {
  readonly #expected: Expectation[] = [];

  expectFailure(matches: UrlPredicate, reason: string): void {
    this.#expected.push({ matches, reason });
  }

  reasonFor(url: string): string | undefined {
    const parsed = new URL(url);
    return this.#expected.find((expectation) => expectation.matches(parsed))?.reason;
  }
}
