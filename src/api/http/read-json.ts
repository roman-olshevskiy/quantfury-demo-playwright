import type { APIResponse } from '@playwright/test';

/**
 * Parses a response body as JSON and returns it as `unknown`: external data stays untyped until a
 * schema validator narrows it (see src/assertions/schema.ts).
 */
export async function readJson(response: APIResponse): Promise<unknown> {
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
