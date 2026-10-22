import { expect, type APIResponse } from '@playwright/test';

import { readJson } from '../api/http/read-json';

const JSON_CONTENT_TYPE = /^application\/json(; charset=utf-8)?$/i;
const PROBLEM_CONTENT_TYPE = /^application\/(problem\+)?json(; charset=utf-8)?$/i;

/** Asserts status and JSON content type, then returns the body as `unknown`. */
export async function expectJsonResponse(
  response: APIResponse,
  expectedStatus: number,
): Promise<unknown> {
  expect(response.status(), `HTTP status of ${response.url()}`).toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  const allowed = expectedStatus >= 400 ? PROBLEM_CONTENT_TYPE : JSON_CONTENT_TYPE;
  expect(contentType, `content-type of ${response.url()}`).toMatch(allowed);
  return readJson(response);
}

/**
 * Headers the demo web client depends on: the API version it calls is still supported, and CORS
 * allows the app origin (the browser would otherwise block every call).
 */
export function expectDemoApiHeaders(response: APIResponse, appUrl: string, apiVersion: string) {
  const headers = response.headers();
  const supported = (headers['api-supported-versions'] ?? '').split(',').map((v) => v.trim());
  expect(supported, 'api-supported-versions').toContain(apiVersion);
  expect(headers['access-control-allow-origin'], 'access-control-allow-origin').toBe(
    new URL(appUrl).origin,
  );
  expect(headers['x-content-type-options'], 'x-content-type-options').toBe('nosniff');
}
