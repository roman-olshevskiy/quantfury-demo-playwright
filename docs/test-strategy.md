# Test strategy

Scope and constraints come from [requirements.md](requirements.md); product facts come from
[product-discovery.md](product-discovery.md). This document explains **what** is tested, **how**,
and **which signals block a change**.

## 1. Objectives

1. Detect regressions in the behavior a demo user can observe: the Trade screen loads, instruments
   can be found and inspected, widgets show consistent data.
2. Detect contract drift in the HTTP API the demo actually uses.
3. Keep every result trustworthy: a red build means a test defect, a product behavior change, a
   data condition or an environment issue — and the report says which.

## 2. Scope

In scope: the public Trade screen, its read-only HTTP API (`n1.trdngbcknd.com/v13/*` and the
`b1` bootstrap), the SignalR connection at transport level, browser storage of a demo session,
deterministic UI behavior under mocked responses, cross-browser smoke.

Out of scope: login/registration, other routes (`/account`, `/settings`, …), trading actions (they
are disabled in demo mode), device-registration and watchlist write endpoints, WebSocket message
content (binary MessagePack, see discovery §7), load, security scanning, real devices.

**Where each suite runs.** The Cloudflare layer in front of the demo blocks the web app's assets
for GitHub-hosted runners, so browsers cannot render the app there
([ADR 0001](decisions/0001-github-hosted-ci-gates-api-only.md)):

| Suite                        | Local (residential network)   | GitHub-hosted CI                      |
| ---------------------------- | ----------------------------- | ------------------------------------- |
| Static checks                | yes                           | **gate** (PR, `main`)                 |
| Live API                     | yes                           | **gate** (PR, `main`, scheduled)      |
| Live UI, integration, mocked | yes (required for UI changes) | scheduled **signal**, manual dispatch |
| Cross-browser smoke          | yes                           | scheduled **signal**, manual dispatch |
| BDD scenarios                | yes (`npm run test:bdd`)      | scheduled **signal**                  |

## 3. Risks and how they are covered

| ID  | Risk                                                                     | Primary coverage                                                 | Secondary coverage                   |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------ |
| R1  | Trade screen does not load or core widgets stay empty                    | Live UI smoke (3 browsers)                                       | Mocked HTTP error / slow response    |
| R2  | Instrument list contract drifts (missing keys, type changes, duplicates) | Live API contract + invariants                                   | Mocked malformed payload             |
| R3  | Search cannot find an instrument the API offers                          | UI/API integration                                               | Mocked deterministic list            |
| R4  | Instrument panel shows attributes inconsistent with the API              | UI/API integration                                               | Mocked formatting checks             |
| R5  | Quotes / chart data violate basic market invariants                      | Live API invariants                                              | —                                    |
| R6  | Error handling of the API changes (status codes, envelope, messages)     | Live API negative tests                                          | —                                    |
| R7  | UI breaks on empty, failing, slow or partial backend responses           | Mocked UI suite                                                  | —                                    |
| R8  | Demo session leaks between tests (shared device id or cache)             | Fixture design (fresh context)                                   | Isolation runs on 1/2/4 workers      |
| R9  | Real-time channel not established, wrong subscriptions, no recovery      | Live hub checks: handshake, subscriptions, pushes (UI-07, UI-10) | Mocked disconnect/reconnect (MOC-07) |
| R10 | External outage is reported as a product defect                          | Pre-flight availability check and failure classification         | —                                    |
| R11 | New accessibility barriers (WCAG 2.0/2.1 A, AA) on core screens          | axe smoke against a documented baseline (UI-08, UI-09)           | —                                    |

## 4. Suites, projects and tags

| Suite       | Directory           | Playwright project(s)                                                        | Tags                                    | Network                                              |
| ----------- | ------------------- | ---------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Live API    | `tests/api`         | `api-live` (no browser, runs once)                                           | `@api @live` (+ `@smoke`/`@regression`) | Real                                                 |
| Live UI     | `tests/ui`          | `ui-chromium`; `@smoke` subset also on `ui-firefox-smoke`, `ui-webkit-smoke` | `@ui @live` (+ `@smoke`/`@regression`)  | Real; third-party hosts blocked                      |
| Integration | `tests/integration` | `ui-chromium`                                                                | `@integration @live`                    | Real; UI compared with the payload the page received |
| Mocked UI   | `tests/mocked`      | `ui-mocked`                                                                  | `@mocked @ui`                           | Targeted endpoints fulfilled locally; the rest real  |

Tags select suites through `--grep`; a test exists in exactly one directory.

## 5. Approach per suite

- **Live API** — `APIRequestContext` with the three required `custom-*` headers and a fresh random
  device id per test. Each test checks status, relevant headers, the envelope, a JSON Schema and
  business invariants. Live prices are never compared to constants. No HTTP retries.
- **Live UI** — a new browser context per test (fresh demo identity), locale `en-US`, timezone
  `UTC`, viewport 1440×900. Locators prefer `data-testid` and roles; readiness is a concrete UI
  condition, never `networkidle` or fixed waits. Analytics and other third-party hosts are aborted
  (they are not needed, see discovery §5).
- **Integration** — the test captures the response the page itself received
  (`page.waitForResponse`) and compares UI output with that payload, normalizing the currency
  glyphs and number formatting.
- **Mocked UI** — `page.route` on one endpoint at a time, registered before navigation; fixtures
  are built by typed builders and validated against the same schemas as the live API. The full
  instrument list is served from a worker-scoped snapshot (fetched once per worker, immutable), and
  the SignalR hub is stubbed where live quotes would overwrite mocked values.
- **Start-up latency** — about 1 in 15–20 fresh loads takes 11–17 s to render (product behavior,
  discovery §12). The readiness wait has its own 30 s timeout and slow starts are annotated
  `slow-start` in the report; they are neither retried nor hidden.

## 6. Quality gates

| Check                                                                   | Workflow                       | Mode                               | Notes                                                                   |
| ----------------------------------------------------------------------- | ------------------------------ | ---------------------------------- | ----------------------------------------------------------------------- |
| `format:check`, `lint`, `typecheck`                                     | `pull-request.yml`, `main.yml` | gate                               | Zero errors                                                             |
| Live API (`test:api`, 2 workers)                                        | `pull-request.yml`, `main.yml` | gate                               | Retries ≤ 1; a test passing only on retry fails the run                 |
| Live API, then mocked, cross-browser smoke, UI regression + integration | `scheduled.yml`                | API gate, UI signal                | Weekdays 14:30 UTC (EU and US markets open); jobs run one after another |
| Selected suite                                                          | `manual.yml`                   | API gate, UI signal                | Choice inputs only; live suites limited to 2 workers                    |
| Live UI, integration, mocked, cross-browser                             | local                          | required before merging UI changes | See [CONTRIBUTING](../CONTRIBUTING.md)                                  |

**gate** — any failure fails the job. **signal** — failures caused only by the environment (the
pre-flight stopped the run, or every failed test saw a CDN block or challenge page) end as a
warning; a real failure or a flaky test still fails the job. Signal jobs never block a merge.

Mechanisms (all verified with controlled failures, see [reliability.md](reliability.md)):

- **Flaky = failure.** `failOnFlakyTests` is on in CI, so a retry pass still exits non-zero; the
  run summary lists the flaky tests.
- **Availability.** `globalSetup` checks the web app, the bootstrap host and the API once (one
  extra attempt after 5 s). If the demo cannot be used — unreachable, HTTP error or Cloudflare
  challenge — no tests run, the run fails with `ENVIRONMENT UNAVAILABLE (<reason>)`, and
  `reports/environment.json` records the checks. It is never reported as passed or skipped, and
  never as a product defect.
- **Quarantine.** `quarantine({ issue, reason, reviewBy })` skips a test only with a GitHub issue
  URL, a reason and a review date at most 30 days ahead; after that date the test fails. The run
  summary shows the count and each entry.

## 7. Failure classification

Every live failure is classified in reports and `docs/reliability.md` as one of:
**test defect**, **product behavior** (changed or broken behavior), **data condition** (e.g. no
gainers today, market closed) or **environment/network** (outage, Cloudflare challenge, timeout
before the app responded). An outage alone is never reported as a product defect.

## 8. Parallelism and volume

Live suites start with 1 worker and run with at most 2 once isolation is proven; the mocked suite
may run with 4. The live smoke selection is kept small: every UI test downloads the ~1 MB
instrument list once. Repeated reliability runs are spaced out, not continuous.

## 9. Known limitations

- Chart rendering (canvas in an iframe) is not asserted visually; chart data is asserted through
  the `chart/web` payload.
- WebSocket coverage is at the SignalR envelope level (handshake, subscriptions, push counts,
  reconnect); push payloads are an opaque binary format and are not decoded (ADR 0007).
- Market-dependent behavior (open/closed) is asserted conditionally, based on `/v13/markets` for
  the same run, never on wall-clock assumptions.
- Accessibility coverage is an automated smoke check: axe-core finds only part of WCAG issues
  (no keyboard-flow, screen-reader or zoom testing). Known violations are tracked per rule, not
  per element, because element counts change with live data.
