import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';

import type {
  FullResult,
  Reporter,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

import { ENVIRONMENT_REPORT_PATH } from '../environment/global-setup';
import { ENVIRONMENT_ANNOTATION, ENVIRONMENT_UNAVAILABLE } from '../environment/markers';

interface Annotated {
  title: string;
  description: string;
}

const MAX_LISTED = 10;

export const RUN_VERDICT_PATH = 'reports/run-verdict.json';

/** Written after every run; CI uses it to tell product failures from environment failures. */
export interface RunVerdict {
  status: FullResult['status'];
  passed: number;
  failed: number;
  /** Failed tests attributed to the environment (CDN block page, challenge). */
  environmentFailures: number;
  flaky: number;
  /** The pre-flight check stopped the run before any test. */
  environmentUnavailable: boolean;
}

/**
 * Prints a short run summary and, on GitHub Actions, writes it to the job summary: outcome counts
 * (flaky ones listed — they fail the gate), failures caused by the environment (e.g. a CDN block
 * page — not product defects), quarantined tests, slow starts and the pre-flight status.
 */
export default class SummaryReporter implements Reporter {
  readonly #tests = new Set<TestCase>();
  readonly #quarantined: Annotated[] = [];
  readonly #slowStarts: Annotated[] = [];
  /** Latest environment cause per test; a later passing retry removes it. */
  readonly #environmentFailures = new Map<TestCase, string>();
  #environmentError: string | undefined;

  onTestEnd(test: TestCase, result: TestResult): void {
    this.#tests.add(test);
    const title = titleOf(test);
    for (const annotation of result.annotations) {
      const entry = { title, description: annotation.description ?? '' };
      if (annotation.type === 'quarantine') this.#quarantined.push(entry);
      if (annotation.type === 'slow-start') this.#slowStarts.push(entry);
    }
    const cause = environmentCause(result);
    if (cause === undefined) this.#environmentFailures.delete(test);
    else this.#environmentFailures.set(test, cause);
  }

  onError(error: TestError): void {
    const message = error.message ?? '';
    if (message.includes(ENVIRONMENT_UNAVAILABLE)) this.#environmentError = firstLine(message);
  }

  async onEnd(result: FullResult): Promise<void> {
    const outcomes = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
    const flaky: string[] = [];
    for (const test of this.#tests) {
      const outcome = test.outcome();
      outcomes[outcome]++;
      if (outcome === 'flaky') flaky.push(titleOf(test));
    }
    const environmentFailures = [...this.#environmentFailures]
      .filter(([test]) => test.outcome() === 'unexpected')
      .map(([test, cause]) => ({ title: titleOf(test), description: cause }));
    const preflight = await readEnvironmentStatus();
    const environment =
      environmentFailures.length > 0 && preflight === 'available'
        ? 'available at start, blocked during run'
        : preflight;

    const lines = [
      `### Test run: ${result.status}`,
      '',
      '| Passed | Failed | of which environment | Flaky | Skipped | Quarantined | Slow starts | Environment |',
      '| -----: | -----: | -------------------: | ----: | ------: | ----------: | ----------: | ----------- |',
      `| ${String(outcomes.expected)} | ${String(outcomes.unexpected)} | ` +
        `${String(environmentFailures.length)} | ${String(outcomes.flaky)} | ` +
        `${String(outcomes.skipped - this.#quarantined.length)} | ${String(this.#quarantined.length)} | ` +
        `${String(this.#slowStarts.length)} | ${environment} |`,
    ];
    if (this.#environmentError !== undefined) lines.push('', `> ${this.#environmentError}`);
    section(
      lines,
      '**Failed because of the environment (not product defects):**',
      environmentFailures,
    );
    section(
      lines,
      '**Flaky (passed only on retry — fails the gate):**',
      flaky.map((title) => ({ title, description: '' })),
    );
    section(lines, '**Quarantined:**', this.#quarantined);
    section(lines, '**Slow starts (known product behavior):**', this.#slowStarts);
    const markdown = `${lines.join('\n')}\n`;

    console.log(`\n${markdown}`);
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile !== undefined && summaryFile !== '') await appendFile(summaryFile, markdown);

    // Machine-readable verdict for CI (see .github/scripts/evaluate-run.mjs).
    const verdict: RunVerdict = {
      status: result.status,
      passed: outcomes.expected,
      failed: outcomes.unexpected,
      environmentFailures: environmentFailures.length,
      flaky: outcomes.flaky,
      environmentUnavailable: this.#environmentError !== undefined,
    };
    await mkdir('reports', { recursive: true });
    await writeFile(RUN_VERDICT_PATH, JSON.stringify(verdict, null, 2));
  }

  printsToStdio(): boolean {
    return true;
  }
}

function titleOf(test: TestCase): string {
  return test.titlePath().slice(1).join(' › ');
}

function firstLine(text: string): string {
  return text.split('\n')[0] ?? text;
}

/** Why a failed attempt is attributed to the environment, if it is. */
function environmentCause(result: TestResult): string | undefined {
  if (result.status === 'passed' || result.status === 'skipped') return undefined;
  const annotated = result.annotations.find((a) => a.type === ENVIRONMENT_ANNOTATION);
  if (annotated?.description !== undefined) return annotated.description;
  const error = result.errors.find((e) => (e.message ?? '').includes(ENVIRONMENT_UNAVAILABLE));
  return error?.message === undefined ? undefined : firstLine(error.message);
}

function section(lines: string[], heading: string, items: readonly Annotated[]): void {
  if (items.length === 0) return;
  const listed = items
    .slice(0, MAX_LISTED)
    .map((item) =>
      item.description === '' ? `- ${item.title}` : `- ${item.title}: ${item.description}`,
    );
  const more =
    items.length > MAX_LISTED ? [`- … and ${String(items.length - MAX_LISTED)} more`] : [];
  lines.push('', heading, ...listed, ...more);
}

async function readEnvironmentStatus(): Promise<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(ENVIRONMENT_REPORT_PATH, 'utf8'));
  } catch {
    return 'not checked';
  }
  const status: unknown =
    typeof parsed === 'object' && parsed !== null && 'status' in parsed ? parsed.status : undefined;
  return typeof status === 'string' ? status : 'unknown';
}
