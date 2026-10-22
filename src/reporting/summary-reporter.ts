import { appendFile, readFile } from 'node:fs/promises';

import type {
  FullResult,
  Reporter,
  TestCase,
  TestError,
  TestResult,
} from '@playwright/test/reporter';

import { ENVIRONMENT_REPORT_PATH, ENVIRONMENT_UNAVAILABLE } from '../environment/global-setup';

interface Annotated {
  title: string;
  description: string;
}

/**
 * Prints a short run summary and, on GitHub Actions, writes it to the job summary: outcome counts
 * (flaky ones listed — they fail the gate), quarantined tests, slow starts and environment status.
 */
export default class SummaryReporter implements Reporter {
  readonly #tests = new Set<TestCase>();
  readonly #quarantined: Annotated[] = [];
  readonly #slowStarts: Annotated[] = [];
  #environmentError: string | undefined;

  onTestEnd(test: TestCase, result: TestResult): void {
    this.#tests.add(test);
    for (const annotation of result.annotations) {
      const entry = {
        title: test.titlePath().slice(1).join(' › '),
        description: annotation.description ?? '',
      };
      if (annotation.type === 'quarantine') this.#quarantined.push(entry);
      if (annotation.type === 'slow-start') this.#slowStarts.push(entry);
    }
  }

  onError(error: TestError): void {
    const message = error.message ?? '';
    if (message.includes(ENVIRONMENT_UNAVAILABLE)) this.#environmentError = message.split('\n')[0];
  }

  async onEnd(result: FullResult): Promise<void> {
    const outcomes = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
    const flaky: string[] = [];
    for (const test of this.#tests) {
      const outcome = test.outcome();
      outcomes[outcome]++;
      if (outcome === 'flaky') flaky.push(test.titlePath().slice(1).join(' › '));
    }
    const environment = await readEnvironmentStatus();

    const lines = [
      `### Test run: ${result.status}`,
      '',
      `| Passed | Failed | Flaky | Skipped | Quarantined | Slow starts | Environment |`,
      `| -----: | -----: | ----: | ------: | ----------: | ----------: | ----------- |`,
      `| ${String(outcomes.expected)} | ${String(outcomes.unexpected)} | ${String(outcomes.flaky)} | ` +
        `${String(outcomes.skipped - this.#quarantined.length)} | ${String(this.#quarantined.length)} | ` +
        `${String(this.#slowStarts.length)} | ${environment} |`,
    ];
    if (this.#environmentError !== undefined) lines.push('', `> ${this.#environmentError}`);
    if (flaky.length > 0) {
      lines.push(
        '',
        '**Flaky (passed only on retry — fails the gate):**',
        ...flaky.map((t) => `- ${t}`),
      );
    }
    if (this.#quarantined.length > 0) {
      lines.push(
        '',
        '**Quarantined:**',
        ...this.#quarantined.map((q) => `- ${q.title}: ${q.description}`),
      );
    }
    if (this.#slowStarts.length > 0) {
      lines.push(
        '',
        '**Slow starts (known product behavior):**',
        ...this.#slowStarts.map((s) => `- ${s.title}: ${s.description}`),
      );
    }
    const markdown = `${lines.join('\n')}\n`;

    console.log(`\n${markdown}`);
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile !== undefined && summaryFile !== '') await appendFile(summaryFile, markdown);
  }

  printsToStdio(): boolean {
    return true;
  }
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
