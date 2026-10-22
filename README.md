# Quantfury Demo — Playwright + TypeScript

[![Main](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/main.yml)
[![Scheduled](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/scheduled.yml/badge.svg)](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/scheduled.yml)

Independent portfolio project: a test-automation framework for the public demo mode of
[Quantfury](https://trading.quantfury.com/), built with Playwright Test and strict TypeScript.

> **Independent project.** This is not an official Quantfury test framework and is not affiliated
> with or endorsed by Quantfury. It only exercises the publicly available demo mode, without
> accounts, credentials or real financial operations.

**Status:** work in progress — M3 done (suites, GitHub Actions, quality gates, reporting).
Repeatability results, ADRs and the v1.0.0 release follow in M4.

## Stack

| Tool             | Version                          |
| ---------------- | -------------------------------- |
| Node.js          | 24.13.0 LTS (see `.nvmrc`)       |
| npm              | 11.x                             |
| @playwright/test | 1.64.0                           |
| TypeScript       | 6.0.3                            |
| ESLint           | 10.11.0 (with typescript-eslint) |
| Prettier         | 3.9.9                            |
| Ajv              | 8.20.0 (+ ajv-formats 3.0.1)     |
| zod / dotenv     | 4.6.5 / 18.0.5                   |

## Quick start

```bash
git clone https://github.com/roman-olshevskiy/quantfury-demo-playwright.git
cd quantfury-demo-playwright
node --version
npm --version
npm ci
npx playwright install
npm run typecheck
npm run lint
npm run test:api
npm run report
```

On Linux CI runners install browser OS dependencies as well:

```bash
npx playwright install --with-deps
```

## Configuration

Copy `.env.example` to `.env` to override defaults. Every variable is validated (zod) before a run;
an invalid value stops the run with a message naming the variable.

| Variable             | Default                          | Notes                          |
| -------------------- | -------------------------------- | ------------------------------ |
| `BASE_URL`           | `https://trading.quantfury.com/` | Web app; HTTPS only            |
| `DEMO_BOOTSTRAP_URL` | `https://b1.trdngbcknd.com/`     | Demo bootstrap host (observed) |
| `API_BASE_URL`       | `https://n1.trdngbcknd.com/`     | Demo REST API host (observed)  |
| `WORKERS`            | `1`                              | 1–4; live runs use at most 2   |
| `CI`                 | `false`                          | Set by GitHub Actions          |

### Timeouts

Defined per kind in [src/config/timeouts.ts](src/config/timeouts.ts) instead of one global value:

| Kind                      | Value |
| ------------------------- | ----- |
| Test (including fixtures) | 60 s  |
| Web-first assertion       | 10 s  |
| UI action                 | 15 s  |
| Navigation                | 30 s  |
| App start (layout ready)  | 30 s  |
| Single API request        | 30 s  |

## Running tests

| Command                                                              | What runs                                         |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `npm test`                                                           | `@smoke` API/Chromium tests plus the mocked suite |
| `npm run test:smoke`                                                 | `@smoke` tests, API and Chromium                  |
| `npm run test:api`                                                   | Live HTTP API suite (`api-live`, no browser)      |
| `npm run test:ui`                                                    | Live UI suite, Chromium                           |
| `npm run test:integration`                                           | UI/API consistency tests, Chromium                |
| `npm run test:mocked`                                                | Mocked UI suite                                   |
| `npm run test:regression`                                            | `@regression` tests, API and Chromium             |
| `npm run test:cross-browser`                                         | `@smoke` UI tests in Chromium, Firefox and WebKit |
| `npm run test:full`                                                  | API, Chromium UI + integration, mocked            |
| `npm run test:select -- <args>`                                      | Plain `playwright test` (used by manual CI runs)  |
| `npm run test:headed` / `test:debug` / `test:ui-mode` / `test:trace` | Debugging variants                                |
| `npm run report`                                                     | Opens the last HTML report                        |

Select by tag with `--grep`, for example `npx playwright test --project=api-live --grep @regression`.
The full browser matrix runs only through `test:cross-browser`, never by default.

Every run starts with a pre-flight availability check of the three demo hosts. If the demo cannot
be used from your machine or runner, the run stops with `ENVIRONMENT UNAVAILABLE (<reason>)`
before any test runs; details are in `reports/environment.json`. A short summary (counts, flaky,
quarantined, slow starts, environment) is printed at the end of every run.

## CI (GitHub Actions)

| Workflow                                               | Trigger                | Runs                                                              |
| ------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------- |
| [pull-request.yml](.github/workflows/pull-request.yml) | Pull request to `main` | Static checks → mocked suite (4 workers) + live smoke (2 workers) |
| [main.yml](.github/workflows/main.yml)                 | Push to `main`         | Static checks → `test:full` (2 workers)                           |
| [scheduled.yml](.github/workflows/scheduled.yml)       | Weekdays 14:30 UTC     | Cross-browser smoke, then regression                              |
| [manual.yml](.github/workflows/manual.yml)             | Manual dispatch        | Suite, browser and workers from fixed choices                     |

- Node.js comes from `.nvmrc`, dependencies from `npm ci`, browsers from
  `npx playwright install --with-deps` matching the locked Playwright version.
- Token permissions are `contents: read`; no secrets are used, so fork PRs run the same way.
- Every job has a timeout. Stale PR runs are cancelled; runs on `main`, scheduled and manual
  runs queue instead.
- Retries: 0 locally and for the mocked suite, at most 1 for live suites in CI. A test that passes
  only on retry is reported as flaky and **fails** the run.
- Artifacts (kept **14 days**): `report-<suite>-<attempt>` with the HTML report, JUnit XML and the
  environment check, always; `test-results-<suite>-<attempt>` with traces, screenshots and error
  context, on failure. The run summary is also written to the GitHub job summary.

### Quarantine

A test with a known, tracked problem may be quarantined — never with a bare `test.skip`:

```ts
import { quarantine } from '../../src/quality/quarantine';

test('…', async ({ tradePage }) => {
  quarantine({
    issue: 'https://github.com/roman-olshevskiy/quantfury-demo-playwright/issues/42',
    reason: 'Momentum widget empty outside trading hours',
    reviewBy: '2026-11-15', // at most 30 days ahead; after this date the test fails
  });
  // …
});
```

The run summary lists every quarantined test with its issue and review date.

## Framework layout

```text
src/
  config/      env.ts (validated configuration), timeouts.ts
  api/
    http/      ApiTransport (records redacted exchanges), demo headers, JSON reading
    clients/   one client per resource group: bootstrap, instruments, market data, news
    models/    compile-time types of the API payloads
    schemas/   JSON Schemas + compiled Ajv validators (runtime validation)
  assertions/  expectToMatchSchema (narrows unknown → model), HTTP helpers
  fixtures/    typed fixtures: API (device id, request context, clients) and UI (page, mocks,
               diagnostics), merged into one `test`
  environment/ pre-flight availability check (globalSetup)
  reporting/   run summary reporter (console + GitHub job summary)
  quality/     quarantine helper
  ui/
    pages/       TradePage (the demo entry point)
    components/  AssetSearch, InstrumentListWidget, InstrumentPanel
    network/     MockApi, PageDiagnostics, RealtimeHubMonitor, page response capture
    formatting.ts  currency glyphs used by the app's font
  data/
    builders/    schema-validated mock payloads
    known-instruments.ts
tests/
  api/          live API suite
  ui/           live UI suite
  integration/  UI vs. the API payload the page received
  mocked/       UI with one endpoint mocked per test
```

Isolation and diagnostics:

- Every API test gets a fresh demo identity (`custom-deviceid`) and its own `APIRequestContext`,
  disposed after the test. On failure, the redacted request/response history is attached as
  `api-exchanges.json` (last 50 exchanges, bodies truncated, session-like values masked).
- Every UI test gets a new browser context, so a fresh demo identity. Third-party hosts
  (analytics, ads, chat, crash reporting) are aborted; only the app's three hosts are reachable.
  On failure, `page-diagnostics.json` lists page and console errors, failed requests, HTTP errors,
  requests still in flight and WebSocket frame counts (bounded, redacted; failures provoked by a
  mock are labelled as expected). Mocked tests also attach `mocked-requests.json`.

## Documentation

- [Requirements](docs/requirements.md)
- [Product discovery](docs/product-discovery.md)
- [Test strategy](docs/test-strategy.md)
- [Coverage map](docs/coverage-map.md)
- [Reliability](docs/reliability.md)

## License

[MIT](LICENSE) for the code in this repository only. No rights to the Quantfury product or brand
are granted.
