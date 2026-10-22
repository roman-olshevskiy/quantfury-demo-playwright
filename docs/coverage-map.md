# Coverage map

Feature / risk → tests → kind of check. Where each suite runs (locally, CI gate, CI signal) is in
[test-strategy.md §2](test-strategy.md#2-scope). Risk IDs refer to
[test-strategy.md §3](test-strategy.md#3-risks-and-how-they-are-covered). Only behavior confirmed
in [product-discovery.md](product-discovery.md) is listed. Status is updated as tests land.

Legend — **Kind:** contract (schema/envelope), invariant (business rule), negative, behavior (UI),
consistency (UI vs. same payload), resilience (mocked failure modes), accessibility (axe-core).

## Live API (`tests/api`, project `api-live`)

All rows are automated (M1).

| ID     | Feature               | Risk | Check                                                                                                              | Kind                          | Tags                     | Test file                                                         |
| ------ | --------------------- | ---- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------ | ----------------------------------------------------------------- |
| API-01 | Demo bootstrap        | R1   | `users/demoapi` returns the configured demo API origin; version, CORS and nosniff headers                          | contract                      | `@api @live @smoke`      | [bootstrap.spec.ts](../tests/api/bootstrap.spec.ts)               |
| API-02 | Instrument list       | R2   | Schema, full snapshot (> 2000), unique `sn`, popular lists reference existing instruments                          | contract, invariant           | `@api @live @smoke`      | [instruments.spec.ts](../tests/api/instruments.spec.ts)           |
| API-03 | Instrument delta sync | R2   | `afterDate` in the future returns empty `updated`, `deleted`, `reseted`                                            | invariant                     | `@api @live @regression` | [instruments.spec.ts](../tests/api/instruments.spec.ts)           |
| API-04 | Search categories     | R3   | Schema; unique ids; every instrument's `sc` ids exist in the category list                                         | contract, invariant           | `@api @live @regression` | [instruments.spec.ts](../tests/api/instruments.spec.ts)           |
| API-05 | Quotes                | R5   | Schema; one quote per requested instrument; `p > 0`, `b ≤ a`, `l ≤ h`                                              | contract, invariant           | `@api @live @smoke`      | [market-data.spec.ts](../tests/api/market-data.spec.ts)           |
| API-06 | Quotes — negative     | R6   | Unknown name omitted; empty list → `ValidationFailed`; string list → `StringContainsNotAllowedSymbols`             | negative                      | `@api @live @regression` | [market-data.spec.ts](../tests/api/market-data.spec.ts)           |
| API-07 | Instrument details    | R4   | Known instrument returns details; unknown → `TradingInstrumentDetailsNotFound` (HTTP 200)                          | contract, negative            | `@api @live @regression` | [instruments.spec.ts](../tests/api/instruments.spec.ts)           |
| API-08 | Historical bars       | R5   | Schema; OHLC invariants; 5-minute duration; within range; count bound; newest first; unknown → empty               | contract, invariant, negative | `@api @live @regression` | [market-data.spec.ts](../tests/api/market-data.spec.ts)           |
| API-09 | Markets / schedules   | R5   | Schema; unique MICs; previous < current < next session; span ≥ working interval                                    | contract, invariant           | `@api @live @regression` | [market-data.spec.ts](../tests/api/market-data.spec.ts)           |
| API-10 | News                  | R6   | Count ≤ `newsAmount`, unique ids, newest first; invalid `instrumentType` / `newsAmount` → 400 naming the parameter | contract, invariant, negative | `@api @live @regression` | [news.spec.ts](../tests/api/news.spec.ts)                         |
| API-11 | Required headers      | R6   | Missing `custom-*` headers → 400 problem details (bootstrap and demo host)                                         | negative                      | `@api @live @regression` | [required-headers.spec.ts](../tests/api/required-headers.spec.ts) |

## Live UI (`tests/ui`, project `ui-chromium`; `@smoke` also Firefox/WebKit)

All rows are automated (M2).

| ID    | Feature                             | Risk | Check                                                                                                                                   | Kind          | Tags                          | Test file                                                  |
| ----- | ----------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------- | ---------------------------------------------------------- |
| UI-01 | Demo opens                          | R1   | Trade screen ready; Watchlist enabled; Portfolio and Limit Orders disabled; search editable                                             | behavior      | `@ui @live @smoke`            | [trade-screen.spec.ts](../tests/ui/trade-screen.spec.ts)   |
| UI-02 | Widgets render data                 | R1   | Momentum and Most Traded rows have price (glyph, grouping) and change (`0.00%`) text                                                    | behavior      | `@ui @live @smoke`            | [trade-screen.spec.ts](../tests/ui/trade-screen.spec.ts)   |
| UI-03 | Search and select                   | R3   | "Apple" finds `AAPL.OQ`; selecting opens the panel with name, Last Price and a numeric price                                            | behavior      | `@ui @live @smoke`            | [asset-search.spec.ts](../tests/ui/asset-search.spec.ts)   |
| UI-04 | Empty search                        | R3   | Unknown query shows "No Results Matched", echoes the query, lists Popular Searches                                                      | behavior      | `@ui @live @regression`       | [asset-search.spec.ts](../tests/ui/asset-search.spec.ts)   |
| UI-05 | Widget filters                      | R1   | Top Gainers → Top Losers changes the list; no instrument is in both                                                                     | behavior      | `@ui @live @regression`       | [trade-screen.spec.ts](../tests/ui/trade-screen.spec.ts)   |
| UI-06 | Reload state                        | R8   | After reload the panel is closed and search is empty; the device id is kept                                                             | behavior      | `@ui @live @regression`       | [trade-screen.spec.ts](../tests/ui/trade-screen.spec.ts)   |
| UI-07 | Real-time channel                   | R9   | One hub connection, MessagePack handshake, price-stream subscriptions sent, `OnNewPriceAsync` pushes received, every envelope decodable | behavior      | `@ui @live @regression`       | [realtime.spec.ts](../tests/ui/realtime.spec.ts)           |
| UI-10 | Real-time subscription on selection | R9   | Selecting `BTC/USDT` sends `SubscribeToDetailsStream` and `SubscribeToTradesStream` for it; `OnNewDetailsAsync` pushes arrive           | behavior      | `@ui @live @regression`       | [realtime.spec.ts](../tests/ui/realtime.spec.ts)           |
| UI-08 | Accessibility: Trade screen         | R11  | axe (WCAG 2.0/2.1 A, AA) on the populated screen: no rule outside the documented baseline                                               | accessibility | `@ui @live @regression @a11y` | [accessibility.spec.ts](../tests/ui/accessibility.spec.ts) |
| UI-09 | Accessibility: search and panel     | R11  | axe on the search results and on the instrument panel: no rule outside the baseline                                                     | accessibility | `@ui @live @regression @a11y` | [accessibility.spec.ts](../tests/ui/accessibility.spec.ts) |

Accessibility baseline (known product issues, [accessibility-baseline.ts](../src/data/accessibility-baseline.ts)):
`button-name` (critical), `scrollable-region-focusable` (serious), `color-contrast` (serious).
A new rule fails the test; a fixed rule should be removed from the baseline.

## Integration (`tests/integration`, project `ui-chromium`)

All rows are automated (M2). Each test compares the UI with the `/v13/instruments` response the
same page received.

| ID     | Feature                         | Risk | Check                                                                                        | Kind        | Tags                 | Test file                                                                             |
| ------ | ------------------------------- | ---- | -------------------------------------------------------------------------------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------- |
| INT-01 | API instrument is searchable    | R3   | Searching a record's `snd` shows a result for its `sn` with `snd` and `n` (stock and crypto) | consistency | `@integration @live` | [instrument-consistency.spec.ts](../tests/integration/instrument-consistency.spec.ts) |
| INT-02 | Panel matches instrument record | R4   | Panel name equals `n`; the price is drawn in the record's currency `ic`                      | consistency | `@integration @live` | [instrument-consistency.spec.ts](../tests/integration/instrument-consistency.spec.ts) |
| INT-03 | Popular searches                | R3   | Empty-search Popular Searches equal `popularBySearchCategory.all`, in order                  | consistency | `@integration @live` | [instrument-consistency.spec.ts](../tests/integration/instrument-consistency.spec.ts) |

## Mocked UI (`tests/mocked`, project `ui-mocked`)

All rows are automated (M2). Expected reactions were observed with exploratory mocks before the
tests were written; one endpoint is mocked per test, the rest is live.

| ID     | Feature                    | Risk | Check                                                                                                                                                 | Kind       | Tags          | Test file                                                                |
| ------ | -------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------- | ------------------------------------------------------------------------ |
| MOC-01 | Empty widget data          | R7   | Empty `topGainers` → "0 Gainers", no rows; Most Traded unaffected                                                                                     | resilience | `@mocked @ui` | [momentum-widget.spec.ts](../tests/mocked/momentum-widget.spec.ts)       |
| MOC-02 | HTTP error                 | R7   | HTTP 500 → "An error occurred, please try again"; Most Traded unaffected                                                                              | resilience | `@mocked @ui` | [momentum-widget.spec.ts](../tests/mocked/momentum-widget.spec.ts)       |
| MOC-03 | Business error envelope    | R7   | `isSuccess: false` → the envelope's `error` text is shown                                                                                             | resilience | `@mocked @ui` | [momentum-widget.spec.ts](../tests/mocked/momentum-widget.spec.ts)       |
| MOC-04 | Slow response              | R7   | Held response → no rows, no empty/error text while pending; rows after release                                                                        | resilience | `@mocked @ui` | [momentum-widget.spec.ts](../tests/mocked/momentum-widget.spec.ts)       |
| MOC-05 | Deterministic formatting   | R4   | Hub stubbed, fixed quotes: `Χ1,234.50` / `3.46%` (USD), `81,234.57` / `1.50%` (USDT, negative change)                                                 | behavior   | `@mocked @ui` | [momentum-widget.spec.ts](../tests/mocked/momentum-widget.spec.ts)       |
| MOC-06 | Partial instrument data    | R7   | `AAPL.OQ` without optional keys is still found and opens in the panel                                                                                 | resilience | `@mocked @ui` | [instrument-list.spec.ts](../tests/mocked/instrument-list.spec.ts)       |
| MOC-07 | Hub disconnect / reconnect | R9   | Hub dropped through a local proxy → new connection within the observed ~15 s (+10 s), handshake, prices re-subscribed and received, widgets keep data | resilience | `@mocked @ui` | [realtime-reconnect.spec.ts](../tests/mocked/realtime-reconnect.spec.ts) |

## BDD scenarios (`bdd/features`, project `bdd`)

Communication layer ([ADR 0006](decisions/0006-bdd-scope.md)): the scenarios restate behaviors
already covered above in business language; they are not counted as additional coverage.

| Feature file                                                                 | Scenario                                            | Mirrors | Tags                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | ------- | ------------------------ |
| [demo-access.feature](../bdd/features/demo-access.feature)                   | A visitor enters the demo without an account        | UI-01   | `@ui @live @smoke`       |
| [instrument-search.feature](../bdd/features/instrument-search.feature)       | Find a company by name and inspect it               | UI-03   | `@ui @live @regression`  |
| [instrument-search.feature](../bdd/features/instrument-search.feature)       | An unknown search term suggests popular instruments | UI-04   | `@ui @live @regression`  |
| [market-momentum.feature](../bdd/features/market-momentum.feature)           | Top losers are a different list from top gainers    | UI-05   | `@ui @live @regression`  |
| [instrument-catalogue.feature](../bdd/features/instrument-catalogue.feature) | The catalogue is complete and consistent            | API-02  | `@api @live @regression` |

## Not covered (and why)

| Area                                      | Reason                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| Trading, portfolio, limit orders          | Disabled in demo mode                                                          |
| Watchlist editing, device registration    | State-changing endpoints; not needed for read-only coverage (discovery §10)    |
| WebSocket push payloads (prices, details) | Opaque binary format, not MessagePack; only the envelope is decoded (ADR 0007) |
| Chart canvas rendering                    | Canvas in an iframe; data verified through `chart/web` instead                 |
| Other routes (`/account`, `/settings`, …) | Out of scope (requirements §3)                                                 |
