import { mergeTests } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';

import type { InstrumentsData } from '../../src/api/models/instrument';
import { test as suiteTest } from '../../src/fixtures';

/** Values a scenario hands from one step to the next; fresh for every scenario. */
export interface ScenarioState {
  gainers: string[];
  catalogue?: InstrumentsData;
}

// The BDD steps use exactly the fixtures of the main suites (pages, API clients, diagnostics,
// third-party blocking); only the scenario state is added (ADR 0006).
export const test = mergeTests(bddTest, suiteTest).extend<{ scenario: ScenarioState }>({
  scenario: async ({}, use) => {
    await use({ gainers: [] });
  },
});

export const { Given, When, Then } = createBdd(test);
