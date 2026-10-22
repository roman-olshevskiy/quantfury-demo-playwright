# Coverage map

Feature / risk → planned tests → kind of check. Risk IDs refer to
[test-strategy.md §3](test-strategy.md#3-risks-and-how-they-are-covered). Only behavior confirmed
in [product-discovery.md](product-discovery.md) is listed. Status is updated as tests land.

Legend — **Kind:** contract (schema/envelope), invariant (business rule), negative, behavior (UI),
consistency (UI vs. same payload), resilience (mocked failure modes).

## Live API (`tests/api`, project `api-live`)

| ID     | Feature               | Risk | Check                                                                                          | Kind                          | Tags                     | Status  |
| ------ | --------------------- | ---- | ---------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------ | ------- |
| API-01 | Demo bootstrap        | R1   | `users/demoapi` returns the demo API URL; headers required                                     | contract                      | `@api @live @smoke`      | planned |
| API-02 | Instrument list       | R2   | Schema, unique `sn`, required keys, popular lists reference existing instruments               | contract, invariant           | `@api @live @smoke`      | planned |
| API-03 | Instrument delta sync | R2   | `afterDate` in the future returns an empty `updated` list                                      | invariant                     | `@api @live @regression` | planned |
| API-04 | Search categories     | R3   | Schema; every instrument's `sc` ids exist in the category list                                 | contract, invariant           | `@api @live @regression` | planned |
| API-05 | Quotes                | R5   | Schema; `n` echoes the request; `b ≤ a`                                                        | contract, invariant           | `@api @live @smoke`      | planned |
| API-06 | Quotes — negative     | R6   | Unknown name omitted; empty list → `ValidationFailed`                                          | negative                      | `@api @live @regression` | planned |
| API-07 | Instrument details    | R4   | Known instrument returns details; unknown → `TradingInstrumentDetailsNotFound`                 | contract, negative            | `@api @live @regression` | planned |
| API-08 | Historical bars       | R5   | Schema; OHLC invariants; bar period; bars within range; count bound; unknown → empty           | contract, invariant, negative | `@api @live @regression` | planned |
| API-09 | Markets / schedules   | R5   | Schema; `startWork < endWork`; working interval consistent                                     | contract, invariant           | `@api @live @regression` | planned |
| API-10 | News — validation     | R6   | Invalid `instrumentType` / non-numeric `newsAmount` → 400 problem details naming the parameter | negative                      | `@api @live @regression` | planned |
| API-11 | Required headers      | R6   | Missing `custom-*` headers → 400 problem details                                               | negative                      | `@api @live @regression` | planned |

## Live UI (`tests/ui`, project `ui-chromium`; `@smoke` also Firefox/WebKit)

| ID    | Feature             | Risk | Check                                                                                | Kind     | Tags                    | Status  |
| ----- | ------------------- | ---- | ------------------------------------------------------------------------------------ | -------- | ----------------------- | ------- |
| UI-01 | Demo opens          | R1   | Trade screen ready; Watchlist enabled; Portfolio and Limit Orders disabled           | behavior | `@ui @live @smoke`      | planned |
| UI-02 | Widgets render data | R1   | Momentum and Most Traded show instrument rows with prices                            | behavior | `@ui @live @smoke`      | planned |
| UI-03 | Search and select   | R3   | Searching a known instrument shows it; selecting opens the instrument panel          | behavior | `@ui @live @smoke`      | planned |
| UI-04 | Empty search        | R3   | Unknown query shows "No Results Matched" and Popular Searches                        | behavior | `@ui @live @regression` | planned |
| UI-05 | Widget filters      | R1   | Top Gainers ↔ Top Losers switch changes the list                                     | behavior | `@ui @live @regression` | planned |
| UI-06 | Reload state        | R8   | After reload the panel is closed, the default layout is shown, the device id is kept | behavior | `@ui @live @regression` | planned |
| UI-07 | Real-time channel   | R9   | SignalR connection opens with the MessagePack handshake and receives frames          | behavior | `@ui @live @regression` | planned |

## Integration (`tests/integration`, project `ui-chromium`)

| ID     | Feature                         | Risk | Check                                                                                 | Kind        | Tags                 | Status  |
| ------ | ------------------------------- | ---- | ------------------------------------------------------------------------------------- | ----------- | -------------------- | ------- |
| INT-01 | API instrument is searchable    | R3   | An instrument from the `/instruments` payload the page received is found by search    | consistency | `@integration @live` | planned |
| INT-02 | Panel matches instrument record | R4   | Name, short name and exchange in the panel match the captured record                  | consistency | `@integration @live` | planned |
| INT-03 | Popular searches                | R3   | Empty-search Popular Searches equal `popularBySearchCategory.all` of the same payload | consistency | `@integration @live` | planned |

## Mocked UI (`tests/mocked`, project `ui-mocked`)

| ID     | Feature                  | Risk | Check                                                                          | Kind       | Tags          | Status  |
| ------ | ------------------------ | ---- | ------------------------------------------------------------------------------ | ---------- | ------------- | ------- |
| MOC-01 | Empty widget data        | R7   | Empty `topGainers` response → widget shows no rows without breaking the page   | resilience | `@mocked @ui` | planned |
| MOC-02 | HTTP error               | R7   | 500 from a widget endpoint → other widgets still render                        | resilience | `@mocked @ui` | planned |
| MOC-03 | Business error envelope  | R7   | `isSuccess: false` from a widget endpoint is handled                           | resilience | `@mocked @ui` | planned |
| MOC-04 | Slow response            | R7   | Delayed widget data → loading state, then data                                 | resilience | `@mocked @ui` | planned |
| MOC-05 | Deterministic formatting | R4   | Fixed quote values render with the expected currency symbol, rounding and sign | behavior   | `@mocked @ui` | planned |
| MOC-06 | Partial instrument data  | R7   | Instrument without optional keys still renders in search results               | resilience | `@mocked @ui` | planned |

Exact expected UI reactions for MOC-01…04 are hypotheses until observed; each test documents the
behavior it confirmed.

## Not covered (and why)

| Area                                      | Reason                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| Trading, portfolio, limit orders          | Disabled in demo mode                                                       |
| Watchlist editing, device registration    | State-changing endpoints; not needed for read-only coverage (discovery §10) |
| WebSocket message content                 | Binary MessagePack; decoder dependency not approved (P1 candidate)          |
| Chart canvas rendering                    | Canvas in an iframe; data verified through `chart/web` instead              |
| Other routes (`/account`, `/settings`, …) | Out of scope (requirements §3)                                              |
