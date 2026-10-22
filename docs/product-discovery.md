# Product discovery — Quantfury public demo mode

| Item        | Value                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Date        | 2026-10-22 (approx. 08:30–09:00 UTC)                                                                               |
| Target      | https://trading.quantfury.com/ (no login)                                                                          |
| Tooling     | Playwright 1.64.0 (Chromium, headless and headed), browser DevTools                                                |
| Method      | Network capture of first open and reload, UI aria snapshots, a bounded number of direct `APIRequestContext` probes |
| Requirement | [requirements.md §6](requirements.md#6-product-discovery--p0)                                                      |

Everything below was **observed**, unless it is listed under
[Uncertainties and assumptions](#12-uncertainties-and-assumptions). No endpoint was guessed: every
path listed here was either called by the web app itself or probed with parameters the app uses.
No credentials were used. Session-like values (device IDs, cookies) were recorded by name only.

## 1. Screens and components

The public entry point is the **Trade** screen (`/`). Header navigation also links to `/account`,
`/start_trading`, `/trading_history`, `/settings`, `/help_center`, `/rewards`, `/auth/login` and
`/auth/registration`; only the Trade screen is in scope (requirements §3).

| Area                 | What it shows                                                                                                                                                                                  | Stable hooks observed                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header               | Logo, nav links, Log In / Sign Up, settings menu (widgets, layout, theme, language)                                                                                                            | `navigation_login_button`, `navigation_sign_up_button`, `change_language_button`, `theme_*_mode`                                                                    |
| Account strip        | P&L, Cash Account, Trading Account — all `0.00` for the demo                                                                                                                                   | `#total_pnl`, `account_ballance`, `account_margin`                                                                                                                  |
| Asset search         | Textbox "Search asset to trade" with a results dropdown                                                                                                                                        | `search` (input), `instrument_information_<shortName>`, `search_category_button_<category>_number`                                                                  |
| Tabs                 | Watchlist (enabled), Portfolio and Limit Orders (**disabled** for the demo)                                                                                                                    | `watchlist_tab`, `positions_tab`, `limit_orders_tab`                                                                                                                |
| Trade The Momentum   | Top Gainers / Top Losers, filter by instrument type                                                                                                                                            | `widget_momentum`, `1_top_gainers`, `2_top_losers`, `trades_instrument_{name,price,percent_change}_<shortName>`                                                     |
| Trade The News       | News headlines (external links) by instrument type                                                                                                                                             | Headlines are links; ids are news ids                                                                                                                               |
| Most Traded          | Last 24 Hours / 7 Days / 14 Days, filter by type                                                                                                                                               | Same row ids as Momentum                                                                                                                                            |
| Global Economic Data | Economic calendar entries in UTC                                                                                                                                                               | —                                                                                                                                                                   |
| Earnings Calendar    | Upcoming / weekly filters                                                                                                                                                                      | `widget_company_earnings_collapsed`                                                                                                                                 |
| Dividends Calendar   | Upcoming / weekly filters                                                                                                                                                                      | `widget_dividends_collapsed`                                                                                                                                        |
| Instrument panel     | Opens after selecting a search result: name, exchange, Last Price, market status, SELL/BUY (disabled when the market is closed), Trading Power, Summary, Dividends, Earnings, Analyst Opinions | `instrument_panel`, `last_price_header`, `sell_data`, `buy_data`, `market_cap_value`, `earnings_date_<shortName>`, `eps_forecast_<shortName>`, `analysts_opinion_*` |
| Chart                | TradingView chart in a `blob:` iframe; timeframe (`5m`), indicators, date range                                                                                                                | `widget_chart_active`                                                                                                                                               |

Locator notes:

- The app ships many `data-testid` attributes, often suffixed with the instrument **short name**
  (for example `instrument_information_AAPL.OQ`). They are preferred over generated
  `styled-components` class names (`sc-xxxx`), which are unstable.
- The settings menu contains hidden copies of widget titles ("Trade The Momentum", …), and hidden
  lists contain instrument names. Plain `getByText(...)` is therefore ambiguous; locators must be
  scoped to a widget or test id.
- **Currency symbols are font glyphs.** Prices are rendered from text such as `Χ343.99` (U+03A7)
  for `$343.99` and `Ϊ240.50` (U+03AA) for `€240.50`; a custom web font draws the symbol. Text
  assertions on prices must normalize these code points or assert only the numeric part.
- The chart is canvas-based inside an iframe; its candles cannot be checked through DOM text
  (requirements §11). Chart data can be checked through the `chart/web` HTTP payload instead.

## 2. Entering demo mode

Opening `/` without login enters demo mode directly. No consent banner or interstitial was shown
in the EU/UA region used for discovery. Readiness signal used in discovery: the `watchlist_tab`
button is visible and a widget (`widget_momentum`) has rows. `networkidle` is **not** a usable
signal: analytics beacons and the WebSocket keep the page busy.

## 3. First vs. repeat opening

| Aspect                 | First open (fresh context)                                           | Reload (same context)                                                                          |
| ---------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Instrument list        | `GET /v13/instruments` without parameters, ~1 MB, ~3,500 instruments | `GET /v13/instruments?afterDate=<ms>` returns only the delta (~0.5 KB)                         |
| Instrument detail sync | `GET /v13/instrumentDetails/updated`                                 | Same with `?afterDate=<ms>`                                                                    |
| Device registration    | `POST /v13/userDevices/add`, `POST /v13/userDevices/activate`        | Repeated on every load                                                                         |
| Selected instrument    | —                                                                    | **Not persisted**: after reload the default layout is shown and the instrument panel is closed |
| URL                    | `/`                                                                  | `/` (selecting an instrument does not change the URL)                                          |

Initial load time to the Watchlist tab: ~2 s with third-party requests blocked, ~5–7.5 s with them
allowed (Chromium, headless, local Windows machine). One out of ~8 loads stayed on a spinner for
more than 10 s; it was not reproduced in 5 subsequent runs (see §12).

## 4. Browser storage

| Store          | Keys observed                                                                                                                                              | Notes                                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| localStorage   | `persist:storage`, `deviceId`, `i18nextLng`, `isInstrumentsListUpdated`, `marketStatusInfo`, plus analytics keys (`AF_SESSION`, `_gcl_ls`, Intercom state) | `persist:storage` is a redux-persist root with slices such as `auth`, `settings`, `staticData` (~1 MB instrument cache), `tradeHoldedItems`, `portfolio`, `layout`, `recentSearches`. The `auth` slice exists with `isAuthenticated: false` in demo mode. |
| sessionStorage | `AF_BANNERS_SESSION_ID` (AppsFlyer)                                                                                                                        | Analytics only.                                                                                                                                                                                                                                           |
| IndexedDB      | `firebase-installations-database`                                                                                                                          | Created by Firebase; not needed by the app's own data flow (see §5).                                                                                                                                                                                      |
| Cookies        | First-party: `__cf_bm`, `cf_clearance` (Cloudflare), `ARRAffinitySameSite` (Azure affinity, on `n1.trdngbcknd.com`). The rest are analytics/ads cookies.   | All httpOnly first-party cookies are infrastructure cookies, not application sessions.                                                                                                                                                                    |

Consequence: **a fresh browser context is a fresh demo identity.** Reusing a saved storage state
would share `deviceId` and the instrument cache between tests, so it is not used for the live
suites (requirements §10).

## 5. Network hosts

| Host                                                                                                                                                                        | Role                                                                                     | Needed by the demo                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `trading.quantfury.com`                                                                                                                                                     | SPA, static assets, locales, Cloudflare JS detection (`/cdn-cgi/challenge-platform/...`) | Yes                                                                                  |
| `b1.trdngbcknd.com`                                                                                                                                                         | Bootstrap: `GET /v13/users/demoapi` returns the demo API base URL                        | Yes                                                                                  |
| `n1.trdngbcknd.com`                                                                                                                                                         | Demo REST API (`/v13/*`) and SignalR hub                                                 | Yes                                                                                  |
| GA / GTM / DoubleClick / google.com, AppsFlyer (`appsflyersdk.com`, `onelink.me`), Firebase (`firebase*.googleapis.com`), Sentry, Intercom, Twitter (`twitter.com`, `t.co`) | Analytics, ads, crash reporting, support chat                                            | **No.** With all of them aborted the Trade screen loads and widgets fill (5/5 runs). |

The Cloudflare layer did not challenge headless Chromium during discovery. Bypassing any bot
detection is out of bounds for this project; if CI runners are challenged, that is reported as an
environment condition.

## 6. HTTP endpoints

### Conventions (all `/v13/*` endpoints)

- **Required request headers:** `custom-deviceid` (a client-generated UUID, also stored in
  `localStorage.deviceId`), `custom-language` (`0` = English), `custom-platform` (`3` = web).
  Without them the API answers `400` with `application/problem+json`. A **random, never
  registered** device id is accepted by every read endpoint below.
- No `Authorization` header, bearer token or API key is used by the demo.
- **Response envelope:** `{ "code": string, "isSuccess": boolean, "data"?: …, "error"?: string }`.
  Business errors are returned as **HTTP 200** with `isSuccess: false`, a machine code and a
  generic message (for example `TradingInstrumentDetailsNotFound`, `ValidationFailed`,
  `NotSupportedApi`).
- **Model-binding errors** (wrong query parameter type or enum) are **HTTP 400**
  `application/json` in RFC 9110 problem-details shape with an `errors` map per parameter.
- Unknown paths return **404** with an empty body.
- Headers: `content-type: application/json; charset=utf-8`, `api-supported-versions: 13.0, 14.0`,
  `api-deprecated-versions: 12.0`, CORS `access-control-allow-origin: https://trading.quantfury.com`,
  `strict-transport-security`, `x-content-type-options: nosniff`.
- Timestamps are Unix epoch **milliseconds**. Many payloads use abbreviated keys.

### Bootstrap

| Method | Path                    | Params | Response `data`                                |
| ------ | ----------------------- | ------ | ---------------------------------------------- |
| GET    | `b1:/v13/users/demoapi` | —      | `{ demoApiUrl: "https://n1.trdngbcknd.com/" }` |

### Reference and instrument data (read-only, used by the tests)

| Method | Path                                | Params / body                               | Response `data` (abridged)                                                                                                                                                                                                                                                                                                                   |
| ------ | ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/v13/instruments`                  | optional `afterDate` (ms)                   | `{ updated: Instrument[], deleted: [], reseted: [], afterDate: ms, popularBySearchCategory: { all, crypto, etfs, forex, futures, stock: shortName[] } }`                                                                                                                                                                                     |
| GET    | `/v13/searchCategories`             | —                                           | `{ searchCategories: { id: number, value: "comma-separated multilingual synonyms" }[] }` (7 items)                                                                                                                                                                                                                                           |
| GET    | `/v13/instrumentDetails`            | `shortName`                                 | `{ shortName, description, … }`; unknown → 200 `TradingInstrumentDetailsNotFound`                                                                                                                                                                                                                                                            |
| GET    | `/v13/instrumentDetails/updated`    | optional `afterDate`                        | `{ shortNames: string[], afterDate: ms }`                                                                                                                                                                                                                                                                                                    |
| POST   | `/v13/price`                        | `{ shortNames: string[] }`                  | Quote per known instrument: `i` id, `n` shortName, `p` last, `b` bid, `a` ask, `c` change %, `d`/`pd` timestamps, `o`/`h`/`l`/`v` session OHLCV, `bb`/`ab` order-book maps, `s` status letter. Unknown names are **omitted** (`data: []`); empty list → `ValidationFailed`; a string instead of an array → `StringContainsNotAllowedSymbols` |
| POST   | `/v13/details`                      | `{ shortNames: string[] }`                  | Daily stats per instrument: `n`, `d`, `o`, `h`, `l`, `v`, `av`, `wh`/`wl`, `pe`, `pb`, `eb`, `bv`, `am`, `dy`; unknown → `data: []`                                                                                                                                                                                                          |
| POST   | `/v13/offMarketPrice`               | `{ shortNames: string[] }`                  | `{ n, b, a, d }[]` pre/after-market quote                                                                                                                                                                                                                                                                                                    |
| POST   | `/v13/chart/web`                    | `{ shortName, barPeriod, from, to, count }` | `{ s: shortName, p: barPeriod, b: Bar[], l?, c? }`; `Bar = { s, e, o, h, l, c, v, p, t? }`, newest first. `barPeriod: 1` = 5-minute bars (`e - s = 300000`). Unknown instrument → `b: []`                                                                                                                                                    |
| GET    | `/v13/markets`                      | —                                           | 24 exchanges: `exchangeMic`, `timezoneOffset`, `timezoneCode`, `startWork`, `endWork`, `workingInterval`, previous/next session fields, optional pre/after-market and break fields, `offMarketEnabled`, `dataDisplayMode`                                                                                                                    |
| GET    | `/v13/markets/schedule/tradingView` | —                                           | `{ exchangeMic, schedule: "HHMM-HHMM" }[]`                                                                                                                                                                                                                                                                                                   |
| GET    | `/v13/systemSettings`               | `currentTimeMilliseconds`                   | Trading limits and client tuning values (`roundDigits`, `priceRequestInstrumentsCount`, `chartUpdateMinDelay`, …)                                                                                                                                                                                                                            |
| GET    | `/v13/depositCurrencies/all`        | —                                           | Currency list (`currency`, `displayName`, `round`, `type`, `isActive`, …)                                                                                                                                                                                                                                                                    |
| GET    | `/v13/goods`                        | —                                           | Subscription/fee tiers (`id`, `name`, `order`, `fee`, `shoulder`, `availableToBuy`)                                                                                                                                                                                                                                                          |
| GET    | `/v13/telemetry/ipInfo`             | —                                           | `{ countryCode }` — depends on the caller's IP                                                                                                                                                                                                                                                                                               |

### Market insights and news (read-only)

| Method | Path                                                                              | Params / body                                     | Response `data` (abridged)                                                                                                |
| ------ | --------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/v13/tradeHolded/topGainers`, `/topLoosers`                                      | `amount`                                          | `{ shortName, showForAllShortcut? }[]` — the list is longer than `amount` (≈30–50); the UI filters it                     |
| GET    | `/v13/tradeHolded/mostTraded`                                                     | `period` (10/20/30), `amount`                     | Same shape                                                                                                                |
| GET    | `/v13/news`                                                                       | `newsAmount`, `instrumentType` **or** `shortName` | `{ id, revisionTime, title, story (URL), source, shortName }[]`; invalid enum or non-numeric amount → 400 problem details |
| GET    | `/v13/marketInsights/calendarEconomic`                                            | —                                                 | `{ id, country, countryCodeIso, event, date, unit, actual?, estimate?, prev? }[]`                                         |
| POST   | `/v13/marketInsights/calendarEarnings`                                            | `{ fromDate, toDate }`                            | `{ id, shortName, date, currency, epsActual?, epsEstimate?, hour }[]` (~1,700 rows, ~250 KB)                              |
| POST   | `/v13/marketInsights/calendarDividends`                                           | `{ fromDate, toDate, includeEtfs }`               | `{ id, shortName, amount, date, yield, currency }[]`                                                                      |
| POST   | `/v13/marketInsights/relevantCalendarDividend`, `relevantCalendarEarning`         | `{ shortName }`                                   | Per-instrument calendar entries (observed on selection, shape not yet profiled)                                           |
| POST   | `/v13/marketInsights/expertAnalystsOpinion/new/new`, `expertAnalystsForecast/new` | `{ shortName }`                                   | Analyst data (observed on selection, shape not yet profiled)                                                              |
| POST   | `/v13/trades/lastTrades`                                                          | `{ shortNames }`                                  | "Trades by Quantfurians" feed (observed on selection, shape not yet profiled)                                             |

### Device and preference calls (state-changing, see §10)

| Method | Path                        | Body / params                                                                  |
| ------ | --------------------------- | ------------------------------------------------------------------------------ |
| POST   | `/v13/userDevices/add`      | `{ deviceId, registrationKey, appsFlyerId, version }`                          |
| POST   | `/v13/userDevices/activate` | `{ deviceId, version }`                                                        |
| POST   | `/v13/watchlist/change`     | `{ deviceId, added: [], removed: [], updateSorting: [] }` — sent empty on load |
| POST   | `/v13/influencer/watchlist` | `{}` → `{ keywordsInstrumentDictionary: {} }`                                  |
| GET    | `/v13/settings/push`        | `deviceId` → push-notification preferences                                     |

### Instrument record (`/v13/instruments` → `updated[]`)

Profiled over 3,527 records. Keys present in **every** record: `t` (type, number), `n` (name),
`sn` (short name, unique key used everywhere else), `snd` (display short name), `hn`, `en`
(exchange name), `eci` (exchange country ISO), `em` (exchange MIC), `ic` (instrument currency),
`s` (asset class string, e.g. `share`), `r` (rounding digits), `sc` (search category ids), `aot`,
`los`, `sos`, `tos`, `lopgp`, `f`, `auss`. Optional keys (present for a subset): `sy` (search
synonyms, 96%), `ed` (38%), `tn` (24%), `ig` (9%), futures/crypto specific keys `e`, `e2`,
`ecI2`, `bc`, `mtp`, `smd`, `smas`, `sad` (2–4%). Schemas must therefore mark these optional and
must not set `additionalProperties: false` (requirements §12).

## 7. WebSocket

- One connection per page: `wss://n1.trdngbcknd.com/signalr/v13/QuantfuryHub` (ASP.NET SignalR,
  no query parameters).
- Handshake frame: `{"protocol":"messagepack","version":1}`; all further frames are **binary
  MessagePack**. ~100–350 frames are received in the first 10–15 s.
- Selecting an instrument sends additional frames (subscription); typing in search sends one.
- Decoding requires a MessagePack decoder, which is not part of the approved dependency list
  (requirements §5). P0 coverage is limited to: the connection opens, the handshake requests
  MessagePack, frames are received. Message-level checks are a P1 candidate (requires an ADR for
  a decoder dependency).
- Live quotes visible in the UI are updated through this channel; the HTTP `price` endpoint gives
  the initial snapshot.

## 8. Market sessions and live data

- Exchange schedules come from `GET /v13/markets` (24 exchanges, epoch ms with timezone offsets).
  At discovery time Nasdaq (`NSQ`) was closed (pre-market), Eurex (`XEUR`) and Cboe were open.
- When an instrument's market is closed, the panel shows `MARKET CLOSED`, SELL/BUY show `N/A`,
  and a pre/after-market quote may be shown (`offMarketPrice`).
- Crypto pairs (e.g. `BTC/USDT`) trade 24/7 and are the only instruments where a moving price can
  be expected at any time — even then, an unchanged price is not a defect (requirements §13).
- The UI states that stock, ETF, commodity and index-futures prices are **delayed by 15 minutes**
  for unregistered users.

## 9. Session identifiers and bootstrap tokens

- No login, no bearer token, no API key.
- The demo identity is the **client-generated `custom-deviceid` UUID**, persisted in
  `localStorage.deviceId` and registered with `userDevices/add` + `activate` on every load.
- `userDevices/add` carries a `registrationKey` field (push-notification registration). Its value
  is treated as sensitive and is never logged or attached.
- Infrastructure cookies (`__cf_bm`, `cf_clearance`, `ARRAffinitySameSite`) are set but are not
  required by the API: `APIRequestContext` without any cookies receives the same responses.

## 10. State-changing operations and isolation

| Operation                                            | Effect                                | Isolation                                                                     |
| ---------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Device registration (`add`, `activate`)              | Server-side record keyed by device id | Fresh context → fresh random device id. API tests never call these endpoints. |
| `watchlist/change`                                   | Sent with empty diffs on load (no-op) | Watchlist editing (`+` buttons) is not exercised in P0.                       |
| Portfolio, Limit Orders, SELL/BUY                    | Disabled in demo mode                 | Nothing to isolate; not exercised.                                            |
| Client-side layout, theme, language, recent searches | `localStorage` only                   | New browser context per test.                                                 |

The live suites therefore only perform **read** operations against the backend; every test owns
its own device identity.

## 11. Stable test oracles

| Oracle                                                                                                | Why it is stable                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Response envelope (`isSuccess`, `code`) and JSON Schema per endpoint                                  | Contract, independent of market data         |
| `sn` uniqueness, required keys, `sc` ⊂ search category ids                                            | Structural invariants of the instrument list |
| `popularBySearchCategory.*` ⊂ `updated[].sn`                                                          | Referential integrity within one response    |
| Delta sync: `instruments?afterDate=<future>` returns an empty `updated` list and echoes `afterDate`   | Deterministic                                |
| Price quote invariants: `b ≤ a`, `l ≤ p ≤ h` (when the session has trades), `n` echoes the request    | Holds for any live value                     |
| Chart bars: `l ≤ o,c ≤ h`, `e − s` equals the bar period, bars within `[from, to]`, count ≤ requested | Holds for any live value                     |
| Unknown instrument → empty `data` (price, details, chart) or `TradingInstrumentDetailsNotFound`       | Deterministic                                |
| Invalid enum / type → 400 problem details naming the parameter                                        | Deterministic                                |
| UI search result for an instrument from the **same** `/instruments` payload the page received         | Synchronized, not an independent snapshot    |
| Instrument panel name, exchange and short name vs. the captured instrument record                     | Static attributes                            |
| Empty search shows "No Results Matched" and the Popular Searches from `popularBySearchCategory.all`   | Same-payload comparison                      |
| Disabled Portfolio / Limit Orders tabs in demo mode                                                   | Documented demo behavior                     |

## 12. Uncertainties and assumptions

1. **One stuck initial load** (spinner > 10 s) was observed once in ~8 loads and not reproduced.
   Treated as an environment/product timing condition to watch in `docs/reliability.md`.
2. **Cloudflare** did not challenge headless Chromium from a residential IP. GitHub-hosted runners
   use datacenter IPs and may be challenged; this can only be confirmed in CI.
3. **Rate limits** are unknown. Every fresh UI test downloads the ~1 MB instrument list; the
   suites keep request volume low (workers ≤ 2 for live runs).
4. The meaning of several abbreviated keys (`aot`, `los`, `sos`, `tos`, `lopgp`, `auss`, `s` in
   quotes) is inferred, not documented; tests assert types and presence only.
5. `instrumentType` values: 1, 2, 3, 5, 6 were observed for news; the mapping to asset classes
   (stocks, futures, forex, crypto, ETFs) is inferred from the widget filters.
6. `topGainers`/`topLoosers` ignore `amount` for the returned list length; the UI shows
   `amount` rows. The API behavior is recorded, not judged as a defect.
7. The WebSocket message content is not decoded (MessagePack); no claims are made about it.
8. `telemetry/ipInfo` and the economic calendar content depend on the caller's region and time.
9. Observations are from one day and one region; API version `v13` may be deprecated later
   (`v14` is advertised as supported).
