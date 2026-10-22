import type { Page, Response } from '@playwright/test';

/**
 * Waits for the first response the page itself receives from one demo API endpoint. Start it
 * before the action that triggers the request. Comparing the UI with this payload — not with an
 * independent API call — keeps live consistency checks synchronized (requirements §13).
 */
export function waitForApiResponse(
  page: Page,
  apiBaseUrl: string,
  path: string,
  method = 'GET',
): Promise<Response> {
  const origin = new URL(apiBaseUrl).origin;
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === origin && url.pathname === path && response.request().method() === method;
  });
}
