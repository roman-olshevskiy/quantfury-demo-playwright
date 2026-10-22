import type { ErrorObject, ValidateFunction } from 'ajv';

import { truncate } from '../utils/redact';

const MAX_LISTED_ERRORS = 15;

/**
 * Narrows `data` to `T` when it matches the compiled schema; otherwise fails with a readable list
 * of the first violations, each with the JSON pointer and a preview of the offending value.
 */
export function expectToMatchSchema<T>(
  data: unknown,
  validate: ValidateFunction<T>,
  label: string,
): asserts data is T {
  if (validate(data)) return;
  const errors = validate.errors ?? [];
  const listed = errors.slice(0, MAX_LISTED_ERRORS).map((error) => describe(error, data));
  const more =
    errors.length > MAX_LISTED_ERRORS
      ? `\n  … and ${String(errors.length - MAX_LISTED_ERRORS)} more`
      : '';
  throw new Error(
    `${label} does not match its JSON Schema (${String(errors.length)} violation(s)):\n` +
      `${listed.join('\n')}${more}`,
  );
}

function describe(error: ErrorObject, root: unknown): string {
  const path = error.instancePath === '' ? '(root)' : error.instancePath;
  const raw = valueAt(root, error.instancePath);
  const value = truncate(raw === undefined ? 'undefined' : JSON.stringify(raw), 120);
  return `  ${path} ${error.message ?? error.keyword} ${JSON.stringify(error.params)} — got ${value}`;
}

function valueAt(root: unknown, pointer: string): unknown {
  if (pointer === '') return root;
  let current: unknown = root;
  for (const rawSegment of pointer.slice(1).split('/')) {
    const segment = rawSegment.replaceAll('~1', '/').replaceAll('~0', '~');
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
