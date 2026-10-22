# Quantfury Demo — Playwright + TypeScript

[![Main](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/main.yml)
[![Scheduled](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/scheduled.yml/badge.svg)](https://github.com/roman-olshevskiy/quantfury-demo-playwright/actions/workflows/scheduled.yml)

Independent portfolio project: a test-automation framework for the public demo mode of
[Quantfury](https://trading.quantfury.com/), built with Playwright Test and strict TypeScript.

> **Independent project.** This is not an official Quantfury test framework and is not affiliated
> with or endorsed by Quantfury. It only exercises the publicly available demo mode, without
> accounts, credentials or real financial operations.

**Status:** v1.0.0 — see the [release notes](docs/release-notes/v1.0.0.md).

## What it covers

| Suite                                    | Tests | What it checks                                                                                                                                                                       |
| ---------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live HTTP API (`tests/api`)              |    18 | Contracts (JSON Schema), business invariants and error handling of the demo API: bootstrap, instruments, search categories, quotes, historical bars, markets, news, required headers |
| Live UI (`tests/ui`)                     |     7 | Demo opens with restricted trading tabs, widgets, search and selection, empty search, list switching, reload state, real-time (SignalR) connection                                   |
| UI/API integration (`tests/integration`) |     3 | The UI against the API response the same page received: searchability, panel attributes, popular searches                                                                            |
| Mocked UI (`tests/mocked`)               |     6 | Empty, HTTP-error, business-error and slow responses, exact formatting, partial data — one endpoint mocked per test                                                                  |

Scope: the public demo mode only — no accounts, no real financial operations, no load or security
testing. Details: [test strategy](docs/test-strategy.md), [coverage map](docs/coverage-map.md).

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

On Linux (and in CI) install browser OS dependencies as well:

```bash
npx playwright install --with-deps
```

### Node.js version on Windows

The project needs Node.js 24.13.0 (`.nvmrc`; `engines` allows `>=24.13.0 <25`). With a version
manager:

```bash
fnm use
```

(fnm reads `.nvmrc`), or with nvm-windows:

```bash
nvm install 24.13.0
```

followed by `nvm use 24.13.0`. Without a version manager, install Node.js 24 LTS from
[nodejs.org](https://nodejs.org/).

## Configuration

Copy `.env.example` to `.env` to override defaults (`copy .env.example .env` on Windows,
`cp .env.example .env` elsewhere). Every variable is validated (zod) before a run;
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

### VS Code

Open the folder and accept the recommended extensions (`.vscode/extensions.json`): Playwright
Test for VS Code, ESLint, Prettier, EditorConfig. The Testing view then lists every project and
test; run or debug a single test from the gutter icon. Formatting on save and ESLint fixes are
configured in `.vscode/settings.json`. Nothing depends on VS Code: every check also runs from the
CLI.

### Debugging

```bash
npx playwright test tests/ui/asset-search.spec.ts --project=ui-chromium --debug
```

runs one file in the Playwright Inspector (`-g "UI-03"` narrows it to one test). `npm run
test:headed` shows the browser, `npm run test:ui-mode` opens UI mode, and `npm run test:trace`
records a trace for every test without retries. Open a trace with

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

or from the HTML report (`npm run report`). Failed tests also carry `api-exchanges.json`,
`page-diagnostics.json` and, for mocked tests, `mocked-requests.json` in the report.

Every run starts with a pre-flight availability check of the three demo hosts. If the demo cannot
be used from your machine or runner, the run stops with `ENVIRONMENT UNAVAILABLE (<reason>)`
before any test runs; details are in `reports/environment.json`. A short summary (counts, flaky,
quarantined, slow starts, environment) is printed at the end of every run.

## CI (GitHub Actions)

> **Limitation:** on GitHub-hosted runners the Cloudflare layer in front of the demo answers the
> web app's assets with HTTP 403 block pages, so browsers cannot render the app there. CI
> therefore **gates on static checks and the live HTTP API suite**; the live UI, integration and
> mocked suites run **locally** and in CI only as a **non-blocking scheduled signal**. The
> framework never tries to bypass the bot protection.
> See [ADR 0001](docs/decisions/0001-github-hosted-ci-gates-api-only.md).

| Workflow                                               | Trigger                | Runs                                                                                  |
| ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------- |
| [pull-request.yml](.github/workflows/pull-request.yml) | Pull request to `main` | Static checks → live API (gate)                                                       |
| [main.yml](.github/workflows/main.yml)                 | Push to `main`         | Static checks → live API (gate)                                                       |
| [scheduled.yml](.github/workflows/scheduled.yml)       | Weekdays 14:30 UTC     | Live API (gate) → mocked → cross-browser smoke → UI regression + integration (signal) |
| [manual.yml](.github/workflows/manual.yml)             | Manual dispatch        | Suite, browser and workers from fixed choices (API as gate, UI as signal)             |

- **gate**: any failure fails the job. **signal**: if every failure is caused by the environment
  (pre-flight stop, or each failed test saw a CDN block/challenge page) the job ends with a
  warning; a real failure or a flaky test still fails it. Signal jobs never block a merge.
- Before merging a UI change, run `npm run test:ui`, `npm run test:integration` and
  `npm run test:mocked` locally.
- Node.js comes from `.nvmrc`, dependencies from `npm ci`, browsers from
  `npx playwright install --with-deps` matching the locked Playwright version.
- Token permissions are `contents: read`; no secrets are used, so fork PRs run the same way.
- **Dependency audit** (`static / Dependency audit`, PR and `main`): `npm run audit:deps` fails on
  known vulnerabilities of severity high or critical and on packages whose registry signatures or
  provenance attestations do not verify.
- **Dependabot** ([dependabot.yml](.github/dependabot.yml)): weekly npm updates (minor and patch
  grouped in one PR) and monthly GitHub Actions updates (SHA pins kept), each only after a
  release has been public for 14 days. Major updates of `typescript` and `@types/node` are held
  back (typescript-eslint peer range, Node.js 24).
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
  environment/ pre-flight availability check (globalSetup), CDN block/challenge detection
  reporting/   run summary reporter (console, GitHub job summary, run verdict)
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

## Live environment limitations

- The demo is a shared public service: live runs use at most 2 workers and are never looped.
- Prices, gainers, news and calendars change constantly; tests assert rules that always hold,
  never live values. Some lists depend on trading hours.
- About 1 in 15–20 fresh loads takes 11–17 s to render (product behavior); such tests are
  annotated `slow-start`.
- From datacenter IPs (for example GitHub-hosted runners) Cloudflare blocks the web app's assets;
  UI suites therefore run locally ([ADR 0001](docs/decisions/0001-github-hosted-ci-gates-api-only.md)).
- WebSocket messages (binary MessagePack) are not decoded; the chart canvas is not checked
  visually.

## Troubleshooting

| Symptom                                                                                 | Cause and fix                                                                                                                                 |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Executable doesn't exist at …ms-playwright…`                                           | Browsers not installed for this Playwright version: `npx playwright install`                                                                  |
| Browser fails to start on Linux (missing `.so` libraries)                               | OS dependencies missing: `npx playwright install --with-deps`                                                                                 |
| `Invalid test configuration: … at WORKERS` (or another variable)                        | A value in `.env` or the environment is out of range; see `.env.example`                                                                      |
| `ENVIRONMENT UNAVAILABLE (unreachable)`                                                 | The demo hosts cannot be reached from this network (offline, proxy, firewall). Check access to the three hosts in `reports/environment.json`. |
| `ENVIRONMENT UNAVAILABLE (bot-protection)` or tests "Failed because of the environment" | Cloudflare blocks or challenges this network. Run from a regular network; do not try to work around the protection.                           |
| Trade screen sometimes takes > 10 s                                                     | Known start-up stall; see `slow-start` annotations and [discovery §12](docs/product-discovery.md#12-uncertainties-and-assumptions)            |

## Documentation

- [Requirements](docs/requirements.md)
- [Product discovery](docs/product-discovery.md)
- [Architecture](docs/architecture.md)
- [Test strategy](docs/test-strategy.md)
- [Coverage map](docs/coverage-map.md)
- [Reliability](docs/reliability.md)
- [Decisions (ADRs)](docs/decisions/README.md)
- [Release notes v1.0.0](docs/release-notes/v1.0.0.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE) for the code in this repository only. No rights to the Quantfury product or brand
are granted.
