// Headers the web app sends with every demo API call (docs/product-discovery.md §6).
// Without the `custom-*` headers the API answers 400.

/** `custom-language`: 0 = English. */
export const DEMO_LANGUAGE_ENGLISH = '0';
/** `custom-platform`: 3 = web. */
export const DEMO_PLATFORM_WEB = '3';

export function demoHeaders(deviceId: string, appUrl: string): Record<string, string> {
  const appOrigin = new URL(appUrl).origin;
  return {
    accept: 'application/json, text/plain, */*',
    origin: appOrigin,
    referer: `${appOrigin}/`,
    'custom-deviceid': deviceId,
    'custom-language': DEMO_LANGUAGE_ENGLISH,
    'custom-platform': DEMO_PLATFORM_WEB,
  };
}

/** Same browser-like headers, but without the demo identity. Used by negative tests only. */
export function headersWithoutDemoIdentity(appUrl: string): Record<string, string> {
  const appOrigin = new URL(appUrl).origin;
  return {
    accept: 'application/json, text/plain, */*',
    origin: appOrigin,
    referer: `${appOrigin}/`,
  };
}
