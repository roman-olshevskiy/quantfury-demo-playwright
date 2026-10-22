import { mergeTests } from '@playwright/test';

import { apiTest } from './api.fixture';
import { uiTest } from './ui.fixture';

// One `test` for every suite. UI fixtures are lazy, so API-only tests never start a browser.
export const test = mergeTests(apiTest, uiTest);
export { expect } from '@playwright/test';
