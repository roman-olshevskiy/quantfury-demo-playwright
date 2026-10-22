import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

import { checkAvailability, type AvailabilityReport } from './availability';

export const ENVIRONMENT_REPORT_PATH = 'reports/environment.json';
/** Prefix the summary reporter uses to classify a run as an environment failure. */
export const ENVIRONMENT_UNAVAILABLE = 'ENVIRONMENT UNAVAILABLE';

// One extra attempt absorbs a single dropped connection; anything longer is a real outage.
const ATTEMPTS = 2;
const PAUSE_MS = 5_000;

/**
 * Pre-flight check before any test: is the public demo reachable from this machine? A failed
 * check fails the run with a classified message instead of a wall of test failures.
 */
export default async function globalSetup(): Promise<void> {
  let report: AvailabilityReport = await checkAvailability();
  for (let attempt = 2; attempt <= ATTEMPTS && report.status !== 'available'; attempt++) {
    await delay(PAUSE_MS);
    report = await checkAvailability();
  }

  await mkdir('reports', { recursive: true });
  await writeFile(ENVIRONMENT_REPORT_PATH, JSON.stringify(report, null, 2));

  if (report.status !== 'available') {
    const lines = report.checks
      .filter((item) => item.status !== 'available')
      .map((item) => `  - ${item.name}: ${item.status} (${item.detail}) ${item.url}`);
    throw new Error(
      `${ENVIRONMENT_UNAVAILABLE} (${report.status}): the public demo cannot be used from this ` +
        `runner, so no tests were run. This is not evidence of a product defect.\n` +
        `${lines.join('\n')}\nDetails: ${ENVIRONMENT_REPORT_PATH}`,
    );
  }
}
