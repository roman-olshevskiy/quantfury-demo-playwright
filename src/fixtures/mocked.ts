import { test as base } from './index';

/**
 * `test` for the mocked suite: on top of the shared fixtures, the full instrument list is served
 * from the worker snapshot, so a mocked test depends on the live backend only for the endpoints
 * it does not mock. Tests may register a more specific instrument mock; the last route wins.
 */
export const test = base.extend({
  mockApi: async ({ mockApi, instrumentSnapshot }, use) => {
    await mockApi.serveInstrumentList(instrumentSnapshot);
    await use(mockApi);
  },
});

export { expect } from './index';
