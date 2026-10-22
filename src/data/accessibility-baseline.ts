// Accessibility rules the demo violates today (axe-core 4.13, WCAG 2.0/2.1 A and AA), observed on
// 2026-10-22. They are product issues, recorded so the smoke test can catch *new* problems
// without failing on known ones (docs/coverage-map.md, UI-08/UI-09). Remove an entry once the
// product fixes it; never add one without the observation that justifies it.

export interface KnownViolation {
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  /** Where it was observed and what it affects. */
  observed: string;
}

export const KNOWN_ACCESSIBILITY_VIOLATIONS: Readonly<Record<string, KnownViolation>> = {
  'button-name': {
    impact: 'critical',
    observed:
      'Icon-only buttons without an accessible name: header profile and layout buttons, ' +
      'instrument "+" buttons in search, panel buttons (10 on the Trade screen, 5 in the panel).',
  },
  'scrollable-region-focusable': {
    impact: 'serious',
    observed: 'Scrollable instrument lists in the widgets cannot be reached by keyboard (5).',
  },
  'color-contrast': {
    impact: 'serious',
    observed: 'One text element on the Trade screen below the WCAG AA contrast ratio (1).',
  },
};
