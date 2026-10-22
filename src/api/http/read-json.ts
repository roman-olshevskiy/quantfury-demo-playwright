import type { ValidateFunction } from 'ajv';

import { expectToMatchSchema } from '../../assertions/schema';

/** What both APIResponse (APIRequestContext) and Response (page network) offer. */
export interface JsonSource {
  text(): Promise<string>;
  url(): string;
  status(): number;
}

/**
 * Parses a response body as JSON and returns it as `unknown`: external data stays untyped until a
 * schema validator narrows it (see src/assertions/schema.ts).
 */
export async function readJson(response: JsonSource): Promise<unknown> {
  const text = await response.text();
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    throw new Error(
      `Expected a JSON body from ${response.url()} (HTTP ${String(response.status())}), ` +
        `got ${String(text.length)} chars: ${text.slice(0, 200)}`,
    );
  }
}

/** Reads a JSON body and validates it in one step. */
export async function readValidatedJson<T>(
  response: JsonSource,
  validate: ValidateFunction<T>,
  label: string,
): Promise<T> {
  const body = await readJson(response);
  expectToMatchSchema(body, validate, label);
  return body;
}
