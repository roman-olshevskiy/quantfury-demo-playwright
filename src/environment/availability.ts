import { randomUUID } from 'node:crypto';

import { request, type APIResponse } from '@playwright/test';

import { demoHeaders } from '../api/http/demo-headers';
import { apiPaths } from '../api/paths';
import { env } from '../config/env';

/**
 * Why the environment is not usable. Kept separate from test results so an outage is never read
 * as a product defect (requirements §21).
 */
export type AvailabilityStatus = 'available' | 'unreachable' | 'http-error' | 'bot-protection';

export interface AvailabilityCheck {
  name: string;
  url: string;
  status: AvailabilityStatus;
  httpStatus?: number;
  detail: string;
  durationMs: number;
}

export interface AvailabilityReport {
  checkedAt: string;
  status: AvailabilityStatus;
  checks: AvailabilityCheck[];
}

const CHECK_TIMEOUT_MS = 15_000;

interface Target {
  name: string;
  url: string;
  headers?: Record<string, string>;
  /** Extra acceptance rule beyond HTTP 200. */
  accept?: (response: APIResponse, body: string) => string | undefined;
}

function targets(): Target[] {
  const headers = demoHeaders(randomUUID(), env.BASE_URL);
  const isSuccessEnvelope = (_: APIResponse, body: string) =>
    body.includes('"isSuccess":true') ? undefined : 'response is not a success envelope';
  return [
    {
      name: 'web app',
      url: env.BASE_URL,
      accept: (response) =>
        (response.headers()['content-type'] ?? '').includes('text/html')
          ? undefined
          : 'not an HTML page',
    },
    {
      name: 'demo bootstrap',
      url: new URL(apiPaths.demoApi, env.DEMO_BOOTSTRAP_URL).toString(),
      headers,
      accept: isSuccessEnvelope,
    },
    {
      name: 'demo API',
      url: new URL(apiPaths.searchCategories, env.API_BASE_URL).toString(),
      headers,
      accept: isSuccessEnvelope,
    },
  ];
}

/** Cloudflare marks challenge pages; a challenged runner cannot use the app (no bypass). */
function isBotChallenge(response: APIResponse): boolean {
  const headers = response.headers();
  return (
    headers['cf-mitigated'] === 'challenge' ||
    ([403, 503].includes(response.status()) && (headers.server ?? '').includes('cloudflare'))
  );
}

async function check(target: Target): Promise<AvailabilityCheck> {
  const context = await request.newContext({ extraHTTPHeaders: target.headers ?? {} });
  const startedAt = Date.now();
  const base = { name: target.name, url: target.url };
  try {
    const response = await context.get(target.url, { timeout: CHECK_TIMEOUT_MS });
    const durationMs = Date.now() - startedAt;
    const httpStatus = response.status();
    if (isBotChallenge(response)) {
      return {
        ...base,
        status: 'bot-protection',
        httpStatus,
        durationMs,
        detail: 'Cloudflare challenge',
      };
    }
    if (httpStatus !== 200) {
      return {
        ...base,
        status: 'http-error',
        httpStatus,
        durationMs,
        detail: `HTTP ${String(httpStatus)}`,
      };
    }
    const problem = target.accept?.(response, await response.text());
    return problem === undefined
      ? { ...base, status: 'available', httpStatus, durationMs, detail: 'OK' }
      : { ...base, status: 'http-error', httpStatus, durationMs, detail: problem };
  } catch (error: unknown) {
    return {
      ...base,
      status: 'unreachable',
      durationMs: Date.now() - startedAt,
      detail: error instanceof Error ? (error.message.split('\n')[0] ?? 'error') : String(error),
    };
  } finally {
    await context.dispose();
  }
}

/** Checks the three hosts the demo needs with one cheap request each. */
export async function checkAvailability(): Promise<AvailabilityReport> {
  const checks = await Promise.all(targets().map(check));
  const failed = checks.find((item) => item.status !== 'available');
  return {
    checkedAt: new Date().toISOString(),
    status: failed?.status ?? 'available',
    checks,
  };
}
