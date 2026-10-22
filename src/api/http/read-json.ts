import type { ValidateFunction } from 'ajv';

import { expectToMatchSchema } from '../../assertions/schema';
import { describeBlockedResponse } from '../../environment/blocked-response';
import { ENVIRONMENT_UNAVAILABLE } from '../../environment/markers';

/** What both APIResponse (APIRequestContext) and Response (page network) offer. */
export interface JsonSource {
  text(): Promise<string>;
  url(): string;
  status(): number;
  headers(): Record<string, string>;
}

/**
 * Parses a response body as JSON and returns it as `unknown`: external data stays untyped until a
 * schema validator narrows it (see src/assertions/schema.ts). A CDN block page instead of JSON is
 * reported as an environment condition, not as a contract problem.
 */
export async function readJson(response: JsonSource): Promise<unknown> {
  const text = await response.text();
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    const status = response.status();
    const blocked = describeBlockedResponse({ status, headers: response.headers(), body: text });
    if (blocked !== undefined) {
      throw new Error(
        `${ENVIRONMENT_UNAVAILABLE} (bot-protection): ${response.url()} → ${blocked}`,
      );
    }
    throw new Error(
      `Expected a JSON body from ${response.url()} (HTTP ${String(status)}), ` +
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
