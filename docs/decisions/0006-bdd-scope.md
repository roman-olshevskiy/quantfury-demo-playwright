# ADR 0006 — A small BDD suite for communication, built on the existing framework

- Status: accepted
- Date: 2026-10-22
- Requirements: §25

## Context

The main suites are written for engineers: precise, but full of test ids, schemas and fixtures.
Product owners, analysts and reviewers mostly want to know **which visitor behaviors are
protected**. The requirements ask for a separate, small BDD set (3–5 scenarios) with English
feature files that reuse the same fixtures, components and API clients, without duplicating the
main suite's implementation.

## Decision

- Use **playwright-bdd** (9.2.1): feature files are compiled by `bddgen` into ordinary Playwright
  tests, so BDD runs on the same runner, reports, diagnostics, retries and gates.
- Keep it **small and business-level**: 5 scenarios in 4 features (`bdd/features`) covering demo
  access, instrument search (found and not found), market momentum and the instrument catalogue.
  They restate behaviors that matter to a reader, not every edge case.
- **Steps contain no page or HTTP logic.** They call the existing page objects
  (`TradePage` and its components), API clients and assertions through the same fixtures
  (`mergeTests(playwright-bdd test, src/fixtures test)`); only a per-scenario `scenario` state is
  added. A shared helper used by both suites lives in `src/utils`.
- **Generated files** (`.features-gen/`) are git-ignored and never edited by hand;
  `npm run test:bdd` regenerates them. An undefined step fails generation (`missingSteps` is
  set to `fail-on-gen`).
- Own Playwright project `bdd`; scenarios carry the usual tags (`@ui`/`@api`, `@live`,
  `@smoke`/`@regression`). CI runs it as a scheduled **signal** like the other UI suites
  (ADR 0001).

## Where BDD helps — and where it does not

| Helps                                                                     | Does not help                                                        |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Reviewing _what_ the demo is protected for in plain English               | Contract checks (schemas, headers, invariants) — kept in `tests/api` |
| Onboarding: a feature file is a readable entry point to the page objects  | Mocked edge cases (empty, error, slow) — kept in `tests/mocked`      |
| Discussing a new behavior before automating it (write the scenario first) | Exhaustive or data-driven coverage — kept in the main suites         |

## Alternatives considered

| Alternative                          | Why not                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Cucumber.js with its own runner      | A second runner, reports and fixtures; duplicates the framework.                                    |
| Rewriting the main suites in Gherkin | Slower to change, worse failure messages for engineers, no benefit for contract checks.             |
| No BDD                               | The requirements ask for a small BDD set (§25); it also gives non-engineers a view of the coverage. |

## Consequences

- One more project and an extra generation step (`bddgen`) for the BDD command only.
- Scenarios overlap on purpose with UI-01, UI-03, UI-04, UI-05 and API-02 (docs/coverage-map.md);
  they are counted as a communication layer, not as extra coverage.
