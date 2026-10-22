import { mergeTests } from '@playwright/test';

import { apiTest } from './api.fixture';

export const test = mergeTests(apiTest);
export { expect } from '@playwright/test';
