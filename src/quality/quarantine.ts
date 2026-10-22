import { test } from '@playwright/test';

export interface QuarantineEntry {
  /** Tracking issue, e.g. https://github.com/<owner>/<repo>/issues/12 */
  issue: string;
  reason: string;
  /** ISO date (YYYY-MM-DD) by which the quarantine must be reviewed. */
  reviewBy: string;
}

const ISSUE_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/;
/** Longest allowed quarantine; a longer one needs a new decision. */
const MAX_QUARANTINE_DAYS = 30;
const DAY_MS = 86_400_000;

/**
 * Skips the current test as quarantined (requirements §21): only with an issue, a reason and a
 * review date at most 30 days ahead. After the review date the test fails instead, so a
 * quarantine can never become an indefinite `test.skip`. Quarantined tests are counted in the
 * run summary. Call it as the first statement of a test.
 */
export function quarantine(entry: QuarantineEntry, today: Date = new Date()): void {
  if (!ISSUE_URL.test(entry.issue)) {
    throw new Error(`Quarantine needs a GitHub issue URL, got "${entry.issue}"`);
  }
  if (entry.reason.trim() === '') throw new Error('Quarantine needs a reason');
  const reviewBy = Date.parse(`${entry.reviewBy}T23:59:59Z`);
  if (Number.isNaN(reviewBy)) throw new Error(`Invalid review date "${entry.reviewBy}"`);
  if (reviewBy < today.getTime()) {
    throw new Error(
      `Quarantine expired on ${entry.reviewBy} (${entry.issue}): fix the test, extend the ` +
        'quarantine with a new review date, or delete the test.',
    );
  }
  if (reviewBy - today.getTime() > MAX_QUARANTINE_DAYS * DAY_MS) {
    throw new Error(`Quarantine review date must be within ${String(MAX_QUARANTINE_DAYS)} days`);
  }
  test.info().annotations.push({
    type: 'quarantine',
    description: `${entry.reason} — ${entry.issue} (review by ${entry.reviewBy})`,
  });
  test.skip(true, `Quarantined: ${entry.reason} (${entry.issue})`);
}
