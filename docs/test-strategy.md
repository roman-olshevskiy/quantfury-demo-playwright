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

## 3. Risks and how they are covered

| ID  | Risk                                                                     | Primary coverage                                         | Secondary coverage                |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------- |
| R1  | Trade screen does not load or core widgets stay empty                    | Live UI smoke (3 browsers)                               | Mocked HTTP error / slow response |
| R2  | Instrument list contract drifts (missing keys, type changes, duplicates) | Live API contract + invariants                           | Mocked malformed payload          |
| R3  | Search cannot find an instrument the API offers                          | UI/API integration                                       | Mocked deterministic list         |
| R4  | Instrument panel shows attributes inconsistent with the API              | UI/API integration                                       | Mocked formatting checks          |
| R5  | Quotes / chart data violate basic market invariants                      | Live API invariants                                      | —                                 |
| R6  | Error handling of the API changes (status codes, envelope, messages)     | Live API negative tests                                  | —                                 |
| R7  | UI breaks on empty, failing, slow or partial backend responses           | Mocked UI suite                                          | —                                 |
| R8  | Demo session leaks between tests (shared device id or cache)             | Fixture design (fresh context)                           | Isolation runs on 1/2/4 workers   |
| R9  | Real-time channel not established                                        | Live UI check of WebSocket handshake                     | —                                 |
| R10 | External outage is reported as a product defect                          | Pre-flight availability check and failure classification | —                                 |

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
  are built by typed builders and validated against the same schemas as the live API.

## 6. Quality gates

| Gate                                        | Blocks a PR | Notes                                           |
| ------------------------------------------- | ----------- | ----------------------------------------------- |
| `format:check`, `lint`, `typecheck`         | Yes         | Zero errors                                     |
| Mocked suite                                | Yes         | Retries 0                                       |
| Live API + UI smoke                         | Yes         | Retries ≤ 1 in CI; a flaky result fails the job |
| Full Chromium suite (main)                  | Post-merge  | Reports uploaded                                |
| Cross-browser smoke, regression (scheduled) | No (signal) | Scheduled around market hours                   |

Availability: a pre-flight check against the web app and the API distinguishes "environment
unavailable" from test failures; the job still fails with a non-zero exit code.

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
- WebSocket coverage is transport-level only (handshake and frame flow).
- Market-dependent behavior (open/closed) is asserted conditionally, based on `/v13/markets` for
  the same run, never on wall-clock assumptions.
