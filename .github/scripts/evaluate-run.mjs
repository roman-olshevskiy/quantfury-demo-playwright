// Decides the CI job result from the test step outcome and reports/run-verdict.json (written by
// src/reporting/summary-reporter.ts).
//
//   node .github/scripts/evaluate-run.mjs <gate|signal> <success|failure|cancelled|skipped>
//
// gate:   the job fails whenever the tests failed (blocking suites, requirements §21).
// signal: non-blocking suites (docs/decisions/0001). Failures caused only by the environment —
//         the pre-flight stopped the run, or every failed test saw a CDN block/challenge page —
//         end as a warning; any other failure, or a flaky test, still fails the job.
import { readFile } from 'node:fs/promises';

const [mode, outcome] = process.argv.slice(2);
if (!['gate', 'signal'].includes(mode ?? '')) {
  console.error('usage: evaluate-run.mjs <gate|signal> <step outcome>');
  process.exit(2);
}

if (outcome === 'success') {
  console.log('Tests passed.');
  process.exit(0);
}

let verdict;
try {
  verdict = JSON.parse(await readFile('reports/run-verdict.json', 'utf8'));
} catch {
  console.log(`::error::Tests ${outcome ?? 'did not finish'} and no run verdict was written.`);
  process.exit(1);
}

const environmentOnly =
  verdict.environmentUnavailable ||
  (verdict.failed > 0 && verdict.failed === verdict.environmentFailures && verdict.flaky === 0);

if (mode === 'signal' && environmentOnly) {
  console.log(
    '::warning::Environment unavailable for this runner (see the job summary); no product ' +
      'failure detected. Signal-only suite, so the job is not failed.',
  );
  process.exit(0);
}

const reason = environmentOnly
  ? 'environment unavailable (not a product defect, but a blocking suite must not pass)'
  : `${String(verdict.failed - verdict.environmentFailures)} test failure(s), ${String(verdict.flaky)} flaky`;
console.log(`::error::${mode === 'gate' ? 'Blocking' : 'Signal'} suite failed: ${reason}.`);
process.exit(1);
