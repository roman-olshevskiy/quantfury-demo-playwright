# Contributing

Thanks for improving this framework. Everything in the repository — code, comments, docs, commit
messages, PR descriptions — is written in **English**.

## Ground rules

- Test only the **public demo mode**: no accounts, credentials, real financial operations, load
  or vulnerability testing. Never bypass Cloudflare or any bot protection.
- Add hosts or endpoints only after they were **observed** in the demo; record them in
  [docs/product-discovery.md](docs/product-discovery.md).
- No secrets, tokens, session ids, cookies or private data in code, fixtures, docs or
  attachments.

## Workflow

1. Branch from the latest `main`: `feat/…`, `fix/…`, `test/…`, `docs/…`, `ci/…`, `chore/…`.
2. Keep commits focused, with an imperative subject (`test(api): add …`).
3. Before opening a PR, run locally:

   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test:api
   ```

   If you touched UI code, page objects, fixtures or UI tests, also run (they cannot run as CI
   gates, see [ADR 0001](docs/decisions/0001-github-hosted-ci-gates-api-only.md)):

   ```bash
   npm run test:ui
   npm run test:integration
   npm run test:mocked
   ```

4. Open a PR to `main`. The description says **what changed, why, and how it was validated**
   (commands and results, including the local UI runs above when relevant).
5. CI must be green: static checks and the live API suite are required.
6. Dependency updates go in their own PR with the same checks. Dependabot opens them; before
   merging one that updates `@playwright/test` (or anything the UI suites use), run
   `npx playwright install` and the local UI suites above. Run `npm run audit:deps` after
   adding a dependency.

## Adding or changing a test

A test is done when it meets the Definition of Done (requirements §29):

- It covers **confirmed behavior** (discovery) or an explicitly marked hypothesis.
- It has a clear name with its coverage-map ID (`UI-08 …`) and relevant assertions — not just
  visibility or `200 OK`.
- It is independent of order and other tests, with a controlled initial state.
- No fixed waits (`waitForTimeout`), no global `networkidle`, no `try/catch` that hides failures.
- Locators: test ids and roles first; no generated class names; no `nth()` without a reason.
- Live data: assert relations that always hold; never compare live prices to constants.
- Typed, passes lint and typecheck; external data stays `unknown` until a schema narrows it.
- Correct tags: `@api`/`@ui`/`@integration`, `@live` or `@mocked`, and `@smoke` or
  `@regression`.
- It passed locally (and in CI where it runs); failures produce useful diagnostics.
- It is added to [docs/coverage-map.md](docs/coverage-map.md).

Where things go:

| You add…                       | Put it in                                                           |
| ------------------------------ | ------------------------------------------------------------------- |
| A new endpoint                 | `src/api/paths.ts`, a client method, a model, a schema, a validator |
| A new screen part              | A component in `src/ui/components/`, used by a page object          |
| Mock data                      | A builder in `src/data/builders/` that validates against the schema |
| A recurring check              | `src/assertions/`                                                   |
| A new decision with trade-offs | A new ADR in `docs/decisions/`                                      |

## Flaky or broken tests

- A test that passes only on retry **fails** CI. Fix the cause; do not add retries, longer global
  timeouts or `test.describe.serial`.
- Classify live failures as test defect, product behavior, data condition or environment
  (see [test strategy §7](docs/test-strategy.md#7-failure-classification)).
- Only a tracked problem may be quarantined, with `quarantine({ issue, reason, reviewBy })` from
  `src/quality/quarantine.ts` (review date ≤ 30 days; the test fails after it). Never use a bare
  `test.skip`.

## Running against the live demo

Keep the load small: `WORKERS` ≤ 2 for live suites, 4 only for the mocked suite; space repeated
runs instead of looping them.
