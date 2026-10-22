import { expectNoNewAccessibilityViolations } from '../../src/assertions/accessibility';
import { KNOWN_ACCESSIBILITY_VIOLATIONS } from '../../src/data/accessibility-baseline';
import { knownInstruments } from '../../src/data/known-instruments';
import { test } from '../../src/fixtures';

// Smoke-level accessibility check (WCAG 2.0/2.1 A and AA, axe-core). Known product issues are
// listed in src/data/accessibility-baseline.ts; any other rule violation fails the test.

test.describe('Accessibility', { tag: ['@ui', '@live', '@regression', '@a11y'] }, () => {
  test('UI-08 the Trade screen has no new accessibility violations', async ({
    tradePage,
    accessibility,
  }) => {
    await tradePage.open();
    // Scan the populated screen, not the loading state.
    await tradePage.momentum.rows.first().waitFor();
    await tradePage.mostTraded.rows.first().waitFor();

    const results = await accessibility.scan('trade-screen');

    expectNoNewAccessibilityViolations(results, KNOWN_ACCESSIBILITY_VIOLATIONS, 'Trade screen');
  });

  test('UI-09 search results and the instrument panel have no new accessibility violations', async ({
    tradePage,
    accessibility,
  }) => {
    await tradePage.open();

    await test.step('search results', async () => {
      await tradePage.search.searchFor('Apple');
      await tradePage.search.result(knownInstruments.usStock).waitFor();

      const results = await accessibility.scan('search-results', {
        include: 'form:has(input[placeholder="Search asset to trade"])',
      });

      expectNoNewAccessibilityViolations(results, KNOWN_ACCESSIBILITY_VIOLATIONS, 'Search results');
    });

    await test.step('instrument panel', async () => {
      await tradePage.search.select(knownInstruments.usStock);
      await tradePage.instrumentPanel.lastPrice.waitFor();

      const results = await accessibility.scan('instrument-panel', {
        include: '[data-testid="instrument_panel"]',
      });

      expectNoNewAccessibilityViolations(
        results,
        KNOWN_ACCESSIBILITY_VIOLATIONS,
        'Instrument panel',
      );
    });
  });
});
