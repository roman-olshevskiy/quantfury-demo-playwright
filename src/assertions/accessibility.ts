import { expect } from '@playwright/test';

import type { KnownViolation } from '../data/accessibility-baseline';
import type { AxeResults } from '../ui/accessibility';

/**
 * Fails when axe reports a rule that is not in the documented baseline of known product issues.
 * Matching is per rule, not per element count: counts move with live data, a new rule does not.
 */
export function expectNoNewAccessibilityViolations(
  results: AxeResults,
  known: Readonly<Record<string, KnownViolation>>,
  label: string,
): void {
  const unexpected = results.violations.filter((violation) => !(violation.id in known));
  const details = unexpected.map(
    (violation) =>
      `  - ${violation.id} (${violation.impact ?? 'unknown impact'}, ${String(violation.nodes.length)} ` +
      `element(s)): ${violation.help}\n    ${violation.helpUrl}\n    e.g. ` +
      violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(' '))
        .join(' | '),
  );
  expect(
    unexpected.map((violation) => violation.id),
    `${label}: accessibility rules violated that are not in the known baseline ` +
      `(src/data/accessibility-baseline.ts):\n${details.join('\n')}`,
  ).toEqual([]);
}
