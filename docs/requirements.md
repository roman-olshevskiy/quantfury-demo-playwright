# Quantfury Demo — Playwright + TypeScript Framework

Requirements version: 1.0  
Date: 2026-10-22  
Repository: quantfury-demo-playwright  
System under test: https://trading.quantfury.com/

> English translation of the original requirements document. Requirement IDs in other documents
> refer to the section numbers below (for example, §12 = API automation).

## 1. Project goal

Build a portfolio automation project for the public Quantfury demo mode that demonstrates:

- Practical command of TypeScript and Playwright Test.
- The architecture of a maintainable UI/API framework.
- Typed fixtures and data lifecycle management.
- Test isolation and parallel execution.
- Testing of real network interactions.
- Failure diagnostics, reporting and CI quality gates.
- Justification of engineering decisions at Lead Automation QA level.

The project is an independent portfolio and is not positioned as an official Quantfury test
framework.

## 2. Priorities and requirement status

- P0 — mandatory for the first complete release.
- P1 — next stage of development.
- P2 — optional extension.

Specific screens, endpoints, messages and business rules must be confirmed during product
discovery.

Features listed as candidates are not considered confirmed capabilities of the demo mode.

## 3. Scope

### In scope

- The public web interface without authentication.
- User scenarios available in demo mode.
- HTTP APIs actually used by the public demo mode.
- WebSocket behavior, if such connections are used.
- Browser storage and the initial state of the demo session.
- Deterministic UI checks with network mocking.
- Cross-browser smoke.
- CI, reporting, static checks and documentation.

### Out of scope

- Registration, login and real accounts.
- Real financial operations.
- Internal APIs and corporate materials.
- Deploying or modifying the production application.
- Load testing of the public environment.
- Testing on real mobile devices.
- Vulnerability scanning of the public product.

Docker may be used for the test runner. Running Quantfury via Docker Compose is not required.

## 4. Development environment

### 4.1. Required software — P0

| Component           | Purpose                              | Requirement                                               |
| ------------------- | ------------------------------------ | --------------------------------------------------------- |
| Windows 11          | Primary local environment            | Supported configuration                                   |
| Linux               | CI environment                       | GitHub-hosted runner                                      |
| Node.js             | Running TypeScript tooling and tests | A supported LTS version compatible with chosen Playwright |
| npm                 | Package management                   | Version recorded in documentation                         |
| Git                 | Version control                      | Command line available on PATH                            |
| VS Code             | Recommended editor                   | Current stable version                                    |
| Playwright browsers | Chromium, Firefox, WebKit            | Installed via the Playwright CLI                          |
| GitHub account      | Repository and CI                    | Access to GitHub Actions                                  |

The chosen Node.js, npm, Playwright and TypeScript versions must be pinned during
implementation. Do not use an unverified "latest" as the only reproduction instruction.

### 4.2. Version management — P0

- Add `.nvmrc` with the chosen Node.js version.
- Duplicate the supported Node.js version in `package.json#engines`.
- Document how to switch Node.js versions on Windows.
- Commit `package-lock.json`.
- Install dependencies in CI with `npm ci`.
- Local and CI environments use consistent Node.js versions.
- Dependency updates are done in separate PRs with checks.

Installing a version manager is recommended but not mandatory.

### 4.3. VS Code extensions

| Extension ID               | Priority                             | Purpose                                        |
| -------------------------- | ------------------------------------ | ---------------------------------------------- |
| ms-playwright.playwright   | P0 for the recommended VS Code setup | Running, debugging, viewing tests and locators |
| dbaeumer.vscode-eslint     | P0 for the recommended VS Code setup | ESLint diagnostics                             |
| esbenp.prettier-vscode     | P0 for the recommended VS Code setup | Formatting                                     |
| EditorConfig.EditorConfig  | P1                                   | Consistent indentation and line endings        |
| yzhang.markdown-all-in-one | P2                                   | Working with documentation                     |
| eamodio.gitlens            | P2                                   | Git history navigation                         |

TypeScript language support and the JavaScript debugger are available in VS Code without a
separate extension.

Editor extensions are not runtime dependencies. All checks must work through the CLI without
VS Code.

### 4.4. Editor configuration — P0

Add:

- `.vscode/extensions.json` — recommended extensions.
- `.vscode/settings.json` — formatter, format on save, ESLint.
- `.editorconfig` — UTF-8, indentation, newline, trailing whitespace.

Do not add personal absolute paths to repository settings.

### 4.5. Optional local tools

- GitHub CLI — creating PRs and working with Actions.
- Docker Desktop — containerized runner.
- Browser DevTools — a mandatory skill for discovery; no separate installation needed.

Postman, Java, Python, Selenium, a separate global TypeScript and a global Playwright are not
required dependencies.

## 5. Libraries

### 5.1. Core dependencies — P0

| Package                  | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| @playwright/test         | Runner, browser automation, APIRequestContext, assertions, reporters |
| typescript               | Static type checking                                                 |
| @types/node              | Node.js types                                                        |
| eslint                   | Static analysis                                                      |
| @eslint/js               | Base ESLint rules                                                    |
| typescript-eslint        | TypeScript-aware linting                                             |
| eslint-plugin-playwright | Rules for Playwright tests                                           |
| prettier                 | Formatting                                                           |
| eslint-config-prettier   | Removing conflicts between ESLint and Prettier                       |
| zod                      | Validating environment configuration                                 |
| dotenv                   | Loading a local `.env`                                               |
| ajv                      | Validating API responses against JSON Schema                         |
| ajv-formats              | Validating formats used in the schemas                               |

The project is test tooling, so these packages may be devDependencies.

The built-in Playwright HTML, JUnit and blob reporters do not require separate reporter packages.

### 5.2. Additional dependencies

| Package              | Priority | Condition for use                                        |
| -------------------- | -------- | -------------------------------------------------------- |
| playwright-bdd       | P1       | A separate small BDD suite                               |
| @axe-core/playwright | P1       | Accessibility smoke                                      |
| @faker-js/faker      | P2       | Only if complex synthetic data is needed                 |
| allure-playwright    | P2       | If a need arises beyond the HTML reporter's capabilities |

Use APIRequestContext for API testing. Do not add Axios, RestSharp, Jest, Mocha or Chai without a
separate justification.

## 6. Product discovery — P0

Before implementing functional tests, create `docs/product-discovery.md`.

The document must contain:

1. A map of available screens and components.
2. How the demo mode is entered.
3. Behavior on first and repeat opening.
4. Use of cookies, localStorage, sessionStorage and IndexedDB, if any.
5. The list of network hosts required by the demo mode.
6. HTTP endpoints: method, path, parameters, response structure.
7. WebSocket channels/messages, if any.
8. Dependence of behavior on trading sessions and market data.
9. Presence of session identifiers or public bootstrap tokens.
10. State-changing operations and how that state is isolated.
11. Stable test oracles.
12. Uncertainties and assumptions.

An API without user login is not necessarily fully stateless. Do not assume there is no session
initialization.

Do not invent unknown endpoints. Add network addresses to the configuration only after they have
been observed.

## 7. Architecture — P0

Recommended structure:

```text
.github/
  workflows/

.vscode/
  extensions.json
  settings.json

src/
  config/
  fixtures/
  ui/
    pages/
    components/
  api/
    clients/
    models/
    schemas/
  data/
    builders/
  assertions/
  utils/

tests/
  ui/
  api/
  integration/
  mocked/

bdd/
  features/
  steps/

docs/
  product-discovery.md
  architecture.md
  test-strategy.md
  coverage-map.md
  reliability.md
  decisions/

.env.example
.editorconfig
.gitignore
.nvmrc
package.json
package-lock.json
playwright.config.ts
tsconfig.json
eslint.config.mjs
.prettierrc.json
README.md
CONTRIBUTING.md
```

Do not create empty directories or unnecessary layers in advance.

### 7.1. Separation of responsibilities

- Tests: scenario, business expectations, assertions.
- Page Objects: locators and page actions.
- Components: reusable parts of the UI.
- API clients: endpoints, transport, serialization.
- Models: compile-time types.
- Schemas: runtime validation.
- Fixtures: setup, dependency injection, teardown.
- Builders: synthetic data for mocked scenarios.
- Config: reading and validating parameters.
- Assertions: narrow reusable checks with clear messages.

### 7.2. Principles

- AAA for the main test suite.
- Composition over unjustified inheritance.
- Do not put business assertions in Page Objects.
- Do not duplicate the Playwright API with generic wrappers.
- Do not create a generic BasePage without a concrete need.
- Do not use try/catch in tests to hide failures.
- Cleanup and transport error handling are allowed in the appropriate layers.
- The test fixture is the primary dependency-passing mechanism.
- Avoid global mutable state.

## 8. TypeScript — P0

- `strict: true`.
- A separate `tsc --noEmit` step in CI.
- Type-aware linting.
- Enable `@typescript-eslint/no-floating-promises`.
- Do not use explicit `any` without a documented reason.
- Treat external data as `unknown` until validated.
- Do not replace runtime validation with an `as` type cast.
- Type fixtures, API models, config and page objects.
- Use union types for confirmed bounded sets of values.
- Apply generics only for a real recurring need.
- Do not use non-null assertions en masse.
- Choose one module system and align it with the tooling.
- All async operations are correctly awaited or explicitly managed.

## 9. Configuration — P0

Example parameters:

```dotenv
BASE_URL=https://trading.quantfury.com/
CI=false
WORKERS=2
```

Add an API base URL only after discovery. If there are several hosts, configure them separately.

Requirements:

- URLs and numeric parameters are validated before a run.
- Default values are documented.
- A configuration error has a clear message.
- `.env` is excluded from Git.
- `.env.example` contains only safe examples.
- No real account credentials.
- Fix the locale, timezone and viewport of the main UI project.
- Document network, action, assertion and test timeouts separately.
- Do not increase all timeouts to mask instability.

## 10. Fixtures — P0

Typed fixtures are required for:

- Pages and components.
- An initialized demo mode.
- API clients.
- An isolated APIRequestContext.
- Controlled browser storage, if needed.
- Mock data and route handlers for the mocked suite.
- Diagnostics on failure.

Requirements:

- A new browser context for every UI test.
- The API context is released after use.
- Route handlers and listeners have a controlled lifecycle.
- Worker-scoped resources are allowed for immutable data.
- Mutable data is not shared between independent tests.
- Shared demo state is not assumed to be isolated without verification.
- A saved storage state is used only after verifying that it does not carry a shared mutable
  demo session between tests.
- Test failures are not hidden during teardown.

Authentication fixtures and account pools are not in the current scope.

## 11. UI automation — P0

After discovery, form a set of confirmed scenarios.

Candidates:

- Opening the demo mode.
- Rendering of the main components.
- The list of available instruments.
- Searching and selecting an instrument, if available.
- Displaying instrument details.
- Switching categories or filters, if available.
- Changing the chart or timeframe, if available.
- State after reload.
- Empty search result.
- Network error handling.
- State-changing demo actions — only after isolation is confirmed.

### Implementation requirements

- Prefer role, label, text and test ID locators.
- CSS/XPath are allowed when justified.
- Do not use unstable generated classes.
- Avoid `nth()` without a verified semantic justification.
- Use web-first assertions.
- Prohibit `waitForTimeout` for synchronization.
- Wait for a specific UI or network condition.
- Do not use global `networkidle` as a universal readiness signal for a live trading UI.
- Assertions must check behavior, not just page visibility.
- Do not require a quote to change within a fixed time for a closed market.
- Do not check a canvas chart through DOM text that is not there.
- Document the limits of chart verification.

## 12. API automation — P0

Use Playwright APIRequestContext.

Test only HTTP endpoints observed in the public demo mode.

Possible categories after discovery:

- Instrument lists.
- Instrument details.
- Search and filtering.
- Historical market data.
- Demo session parameters.
- Invalid request parameters.
- Unknown instrument identifier.
- Empty response.
- Error message structure.

### Requirements

- Expected statuses are defined by the actual specification.
- Check status, relevant headers, body and semantics.
- Do not treat `200 OK` as a sufficient check.
- Check JSON Schema and business invariants.
- Account for nullable fields and differences between instrument types.
- Do not require `additionalProperties: false` without justification.
- Do not check exact live prices as constants.
- Do not use a tolerance without explaining its units and reason.
- Do not duplicate the API suite for every browser project.
- Do not use HTTP client retries to hide product errors.

If the required data is delivered only via WebSocket, APIRequestContext does not substitute for a
WebSocket client.

HTTP API scope and WebSocket scope are documented separately. Unavailable scenarios are not
simulated as live API coverage.

## 13. Live data and WebSocket — P0/P1

### P0

- Identify the data source the UI is compared against.
- Do not compare independent live snapshots for exact equality.
- For synchronized comparison use the payload actually received by the page in question.
- Account for rounding, formatting, currency and time zone.
- Keep diagnostic timestamps.
- Do not treat an unchanged price as a defect without a business reason.

### P1, if the product uses WebSocket

- Verify connection establishment and relevant messages.
- Verify subscription behavior for the selected instrument.
- Add a controlled disconnect/reconnect scenario.
- Do not publish session tokens in payload attachments.
- Run negative network scenarios through local mocks.

## 14. UI/API integration — P0

At least two confirmed scenarios over shared data, for example:

1. An instrument from the API is available for search or selection in the UI.
2. Static attributes of an instrument in the UI match the API.

Additionally, if the product allows:

- Data of a specific HTTP response is consistent with what the UI displays.
- A change of demo state through the UI is confirmed by an available API.

Do not invent write endpoints for the sake of an end-to-end scenario.

## 15. Mocked UI tests — P0

Mocks are used for:

- Empty state.
- A controlled HTTP error.
- Invalid or incomplete data.
- A slow response.
- Deterministic data formatting.
- WebSocket edge cases, if the chosen Playwright APIs support them.

Requirements:

- A separate directory and the `@mocked` tag.
- Routes are registered before the corresponding request.
- Interception is as narrow as possible.
- Unrelated requests are not accidentally blocked.
- Mocked tests are not counted as live E2E.
- Static fixtures must not contain private data.
- Mocks match the documented or observed schema.

## 16. Parallelism — P0

- Typical live CI run: at most 2 workers.
- The value is configurable.
- Start with 1 worker until isolation is verified.
- Prove the suite's independence on 1 and 2 workers.
- Run 4-worker checks in a controlled way, primarily for the mocked suite.
- Do not use `serial` to hide dependent tests.
- Enable `fullyParallel` for independent groups.
- Unique output paths for artifacts.
- Limit concurrent GitHub Actions runs via concurrency.
- Sharding — P1, after checking the total number of requests.

The number of workers is evaluated in total, taking the browser matrix and shards into account.

This is functional automation, not a stress test.

## 17. Projects and browsers — P0

Recommended projects:

- `api-live`
- `ui-chromium`
- `ui-firefox-smoke`
- `ui-webkit-smoke`
- `ui-mocked`

Requirements:

- Chromium: the main UI suite.
- Firefox/WebKit: critical smoke.
- API: a single run regardless of browsers.
- The mocked suite is separated from the live suite.
- Mobile viewport — P1.
- A mobile viewport is not described as real-device coverage.

## 18. Tags and suites — P0

Support:

- `@smoke`
- `@regression`
- `@ui`
- `@api`
- `@integration`
- `@live`
- `@mocked`

Tags must actually drive selection. Do not duplicate a test in different directories for the sake
of different suites.

## 19. Reporting and diagnostics — P0

- HTML report.
- JUnit report.
- Console reporter for CI.
- Screenshot on UI failure.
- Trace on the first retry.
- A separate debug command with trace and without retries.
- Meaningful `test.step`.
- Safe API request/response attachments.
- Logs of relevant page errors and network failures.
- Bounded buffers: do not accumulate an unbounded stream of live messages.
- Separate expected errors of negative tests from unexpected ones.
- Artifacts are kept after a failed CI run.
- A documented artifact retention period.
- Blob reporter and report merging — P1 for sharding.

Do not publish full cookies, tokens, session identifiers or irrelevant network traffic.

## 20. CI — P0

Primary platform: GitHub Actions.

### Pull request

- npm ci
- Formatting check
- ESLint
- TypeScript typecheck
- Mocked suite
- A small live API/UI smoke

### Push to main

- The full main API/UI suite in Chromium
- Upload reports

### Scheduled

- Cross-browser smoke
- An agreed regression selection
- The schedule accounts for the market dependence of checks

### Manual dispatch

- Choice of an allowed suite
- Choice of browser project
- A bounded workers value
- No arbitrary substitution of unverified hosts

### Workflow requirements

- Consistent Node.js version.
- Playwright browsers are installed with the required OS dependencies.
- No step that starts a Quantfury server.
- Minimal GitHub permissions.
- Job timeouts.
- Cancellation of stale PR runs.
- Upload of diagnostics after a failure.
- If there is a container runner, the image version matches the Playwright package.
- CI from fork PRs does not rely on private credentials.
- Unavailability of the external service is reported explicitly.

## 21. Quality gates — P0

A PR fails the gate on:

- Formatting errors.
- ESLint errors.
- TypeScript errors.
- Failed tests.
- Flaky tests in a blocking suite.

Retries:

- Local: 0.
- CI: at most 1 for the live suite.
- Mocked suite: 0 by default.
- A retry does not turn a flaky test into a fully successful result.
- For a blocking suite use the fail-on-flaky mechanism available in the chosen Playwright version,
  or an equivalent check.

Environment unavailability:

- A separate classification of the cause.
- A non-zero result of the blocking job.
- Do not mark the whole suite as passed or silently skipped.
- Do not conclude a product defect solely from the fact of an outage.

Quarantine:

- Only with an issue, a reason and a review date.
- The number of quarantined tests is visible.
- No indefinite `test.skip`.

## 22. Reliability — P0

For the stable smoke suite:

- Perform at least 5 consecutive controlled runs with 2 workers and no retries.
- For the mocked suite — 10 runs with 4 workers and no retries.
- Store the results in `docs/reliability.md`.
- Record the commit, environment, workers, number of tests, duration and first-attempt pass rate.
- Do not declare the whole framework stable based only on retry passes.
- For live failures distinguish test defect, product behavior, data condition and
  environment/network issue.
- Do not run repeated live runs as continuous load.

## 23. npm scripts — P0

Implement and describe:

```text
npm run lint
npm run typecheck
npm run format
npm run format:check

npm test
npm run test:smoke
npm run test:api
npm run test:ui
npm run test:integration
npm run test:mocked

npm run test:headed
npm run test:debug
npm run test:ui-mode
npm run test:trace

npm run report
```

A bare `npm test` must run a documented, moderately sized selection.

The full browser matrix must not run unexpectedly.

## 24. Initial setup — P0

The README must contain reproducible steps:

```bash
git clone <repository-url>
cd quantfury-demo-playwright

node --version
npm --version

npm ci
npx playwright install

npm run typecheck
npm run lint
npm run test:smoke
npm run report
```

For Linux CI:

```bash
npx playwright install --with-deps
```

Describe separately:

- Creating `.env` from `.env.example`.
- Running through the VS Code Playwright extension.
- Debugging a single test.
- Viewing a trace.
- Typical browser dependency problems.
- Troubleshooting network access without circumventing product restrictions.

## 25. BDD — P1

- A separate set of 3–5 scenarios on `playwright-bdd`.
- Feature files in English.
- Given/When/Then describe business behavior.
- Steps use the same fixtures, components and API clients.
- Generated files are not edited manually.
- No duplication of the main suite's implementation.
- The BDD suite is available through a separate command.
- Justify where BDD helps communication.

## 26. Additional capabilities

### P1

- Accessibility smoke via axe.
- Limited visual regression for stable components.
- WebSocket fault scenarios, if applicable.
- Sharding and report merging.
- Dependabot or Renovate.
- Dependency audit.

Visual regression:

- Dynamic quotes, time and charts are stabilized or masked.
- Do not mask the component under test.
- Baselines are created in a consistent environment.
- Baseline updates go through review.

### P2

- SonarCloud or Snyk for the repository code and dependencies.
- Allure reporting.
- An Azure DevOps pipeline with a confirmed run.
- A container runner.

Repository scanners are not described as security testing of Quantfury.

## 27. Documentation — P0

Code and public repository documentation are in English.

### README.md

- Goal and scope.
- Link to the product.
- Independent status of the project.
- Stack and prerequisites.
- Tool versions.
- Quick start.
- VS Code extensions.
- Run commands.
- CI badge.
- Reporting and debugging.
- Limitations of the live environment.
- Links to detailed documentation.

### Other documents

- `docs/product-discovery.md` — the behavior actually researched.
- `docs/architecture.md` — layers, fixtures, data flow.
- `docs/test-strategy.md` — risks, scope, suites, gates.
- `docs/coverage-map.md` — feature/risk → tests → type of check.
- `docs/reliability.md` — results and metrics.
- `docs/decisions/` — 3–5 ADRs.
- `CONTRIBUTING.md` — contribution rules.
- `.env.example` — safe configuration.

ADRs must explain the decision, alternatives and consequences. For example: APIRequestContext,
fixture scopes, live/mocked split, parallelism limits, BDD scope.

## 28. GitHub hygiene — P0

- A clear commit history.
- Changes via PRs with a description and validation.
- `.gitignore` for node_modules, .env, reports, traces, storage state.
- No secrets or corporate code.
- Publish only safe data examples.
- The CI badge points to a real workflow.
- Release `v1.0.0` with short release notes.
- The license covers only own code; it grants no rights to the Quantfury product or brand.
- Do not publish private work materials.
- Do not claim commercial TS experience based on this project.

## 29. Definition of Done for a test

A test is complete if it:

- Covers confirmed behavior or an explicitly marked hypothesis.
- Has a clear name and relevant assertions.
- Is independent of execution order.
- Has a controlled initial state.
- Does not use hardcoded waits.
- Does not hide exceptions.
- Is typed and passes lint/typecheck.
- Has the correct tags.
- Passed locally and in CI.
- Provides sufficient diagnostics on failure.
- Is added to the coverage map.
- Makes its live or mocked nature clear.

## 30. Readiness criteria for v1.0.0

- Discovery is complete.
- There is a reproducible Windows setup and Linux CI.
- Dependencies and versions are pinned.
- Typed fixtures, UI components/pages and API clients are implemented.
- There are live UI, live HTTP API and mocked tests.
- If the live HTTP API does not allow the planned coverage, this is explicitly reflected in the
  scope and release notes.
- There are at least two meaningful UI/API consistency scenarios, if the corresponding data is
  available.
- Isolation and parallelism are verified.
- Reports and traces are available after a failure.
- The quality gate actually blocks a controlled failure.
- A repeatability check has been performed.
- The README lets another engineer run the project.
- A tagged release is published.

The number of tests is not a standalone quality criterion. The scope is determined by the coverage
map and the available capabilities of the demo mode.

## 31. Implementation plan

1. Install Node.js, Git, VS Code and extensions.
2. Perform product/network discovery.
3. Agree on the test strategy and coverage map.
4. Initialize TypeScript, Playwright, lint and formatting.
5. Implement config and fixtures.
6. Implement API clients and the first contract tests.
7. Implement UI components/pages and smoke.
8. Add UI/API consistency scenarios.
9. Add mocked edge cases.
10. Verify isolation and parallel execution.
11. Set up reports and GitHub Actions.
12. Perform reliability verification.
13. Complete the documentation and release v1.0.0.
14. Add BDD and other P1 capabilities.

## 32. Official sources for implementation

Before choosing versions, check current compatibility:

- https://nodejs.org/
- https://code.visualstudio.com/
- https://git-scm.com/
- https://playwright.dev/docs/intro
- https://playwright.dev/docs/getting-started-vscode
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/api-testing
- https://playwright.dev/docs/test-parallel
- https://playwright.dev/docs/test-sharding
- https://playwright.dev/docs/ci
- https://www.typescriptlang.org/tsconfig/
- https://typescript-eslint.io/
- https://docs.github.com/en/actions

This document defines requirements for the future implementation. The actual research of Quantfury
and the version compatibility check are still to be performed.
