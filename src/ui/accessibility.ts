import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';

/** WCAG 2.0 and 2.1, levels A and AA. Best-practice rules are not part of the smoke check. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

export type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

export interface ScanOptions {
  /** CSS selector limiting the scan to one region; the whole page otherwise. */
  include?: string;
}

/**
 * Runs axe on the current page state and attaches a compact summary (rule, impact, node count,
 * first targets) to the report, whatever the outcome — the summary is the record of what the
 * product looked like at that moment.
 */
export class AccessibilityScanner {
  readonly #page: Page;
  readonly #testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.#page = page;
    this.#testInfo = testInfo;
  }

  async scan(label: string, options: ScanOptions = {}): Promise<AxeResults> {
    let builder = new AxeBuilder({ page: this.#page }).withTags([...WCAG_TAGS]);
    if (options.include !== undefined) builder = builder.include(options.include);
    const results = await builder.analyze();
    await this.#testInfo.attach(`axe-${label}.json`, {
      body: JSON.stringify(summarize(results), null, 2),
      contentType: 'application/json',
    });
    return results;
  }
}

function summarize(results: AxeResults) {
  return {
    url: results.url,
    timestamp: results.timestamp,
    engine: results.testEngine.version,
    violations: results.violations.map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      help: violation.help,
      examples: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
    })),
  };
}
