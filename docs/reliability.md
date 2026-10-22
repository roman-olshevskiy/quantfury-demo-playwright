# Reliability

Results of controlled runs (requirements §21–22). Live failures are classified as **test defect**,
**product behavior**, **data condition** or **environment/network**
([test-strategy.md §7](test-strategy.md#7-failure-classification)).

## Quality gate verification (M3)

Each gate was exercised with a deliberate, temporary failure that was removed afterwards.

| Date       | Environment                     | Controlled failure                                       | Command            | Exit code | Result                                                |
| ---------- | ------------------------------- | -------------------------------------------------------- | ------------------ | --------- | ----------------------------------------------------- |
| 2026-10-22 | Windows 11, Node 24.13.0, local | Misformatted file                                        | `prettier --check` | 1         | Blocks                                                |
| 2026-10-22 | same                            | Floating promise                                         | `eslint`           | 1         | Blocks (`no-floating-promises`)                       |
| 2026-10-22 | same                            | `string` assigned to `number`                            | `tsc`              | 2         | Blocks                                                |
| 2026-10-22 | same, `CI=true`                 | Failing assertion                                        | `playwright test`  | 1         | Blocks                                                |
| 2026-10-22 | same, `CI=true`                 | Fails on attempt 1, passes on retry                      | `playwright test`  | 1         | Reported `flaky`, blocks                              |
| 2026-10-22 | same, `CI=true`                 | Valid quarantine (issue, reason, review date)            | `playwright test`  | 0         | Skipped, counted in summary                           |
| 2026-10-22 | same, `CI=true`                 | Quarantine past its review date                          | `playwright test`  | 1         | Blocks                                                |
| 2026-10-22 | same                            | API host unreachable (`API_BASE_URL=https://….invalid/`) | `playwright test`  | 1         | `ENVIRONMENT UNAVAILABLE (unreachable)`, no tests run |

## CI runs on GitHub-hosted runners

| Date       | Run                        | Commit    | Job        | Result        | Classification                                                                                                                                                                                                                                          |
| ---------- | -------------------------- | --------- | ---------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-22 | PR #6, Pull request run #1 | `45eff9f` | static     | passed (28 s) | —                                                                                                                                                                                                                                                       |
| 2026-10-22 | same                       | `45eff9f` | mocked     | 0/6           | **environment** — the worker-scoped instrument snapshot received HTTP 403 with an HTML page (Cloudflare-style error template) from `n1.trdngbcknd.com/v13/instruments`                                                                                  |
| 2026-10-22 | same                       | `45eff9f` | live-smoke | 3/6           | API tests passed (incl. the full instrument list); the 3 UI tests never rendered the trade layout within 30 s, also on retry. **environment (suspected)** — the same block, or a challenge on the web app page for headless Chromium on a datacenter IP |

| 2026-10-22 | PR #6, Pull request run #2 | `acf3c61` | static | passed (29 s) | — |
| 2026-10-22 | same | `acf3c61` | live-smoke | 3/6 | **environment** — all 3 UI failures attributed automatically: `GET /css/fonts/UniNeueRegular_v39.woff2 → Cloudflare block page (HTTP 403, cf-ray …-IAD)` on `trading.quantfury.com`; API tests passed |
| 2026-10-22 | same | `acf3c61` | mocked | 0/6 (8 m 25 s, most of it a slow `apt` mirror during `playwright install --with-deps`) | **environment** — all 6 attributed automatically: `/v13/instruments → Cloudflare block page (HTTP 403, cf-ray …-LAX, title "Attention Required! \| Cloudflare")` |
| 2026-10-22 | PR #6, Pull request run #3 | `658d237` | static | passed (28 s) | — |
| 2026-10-22 | same | `658d237` | live-api | 18/18 (24 s), 0 flaky, environment available | — (first green PR run, total 1 m 0 s) |

Run #1: the pre-flight reported `available` because it probed only `searchCategories`, so the
block was not classified. Follow-up changes (M3): the pre-flight also probes the instrument-list path;
CDN block and challenge pages are recognized in the pre-flight, the API exchange log, the page
diagnostics and the instrument snapshot; a failed test that saw one is annotated `environment`,
and the run summary counts and lists those failures with path, status, cf-ray and page title.
Verified locally with simulated block pages: a challenged main document stalls start-up and is
reported as "Failed because of the environment", exit code 1; blocked API or bootstrap
responses alone do not stop the app from rendering.

Run #2 confirmed the block for the web app's assets on GitHub-hosted runners. Decision:
[ADR 0001](decisions/0001-github-hosted-ci-gates-api-only.md) — static checks and the live API
suite are the CI gates; UI suites run locally and as a scheduled signal. The signal/gate
evaluation ([evaluate-run.mjs](../.github/scripts/evaluate-run.mjs)) was checked locally against
seven verdicts: passed; environment-only failures as gate (exit 1) and as signal (exit 0, warning);
pre-flight stop as signal (exit 0, warning); one real failure as signal (exit 1); flaky as signal
(exit 1); missing verdict (exit 1).

## Isolation and parallelism (M1–M3)

| Date       | Suite                           | Workers | Repeats | Retries | Result         | Notes                                       |
| ---------- | ------------------------------- | ------- | ------- | ------- | -------------- | ------------------------------------------- |
| 2026-10-22 | Live API (18)                   | 1, 2    | 1       | 0       | 18/18 each     |                                             |
| 2026-10-22 | Live UI + integration (10)      | 1, 2    | 1       | 0       | 10/10 each     |                                             |
| 2026-10-22 | Firefox + WebKit smoke (6)      | 2       | 1       | 0       | 6/6            |                                             |
| 2026-10-22 | Mocked (6)                      | 4       | 3       | 0       | 18/18          | After the worker-scoped instrument snapshot |
| 2026-10-22 | `test:full` with `CI=true` (34) | 2       | 1       | ≤ 1     | 34/34, 0 flaky | 2 `slow-start` annotations (8.3 s, 8.8 s)   |

Earlier, before the snapshot and the `appStart` timeout, two mocked runs failed while the app was
still starting: classified **product behavior** (start-up stall, see
[product-discovery.md §12](product-discovery.md#12-uncertainties-and-assumptions)), not test
defects.

## Repeatability runs (v1.0.0)

Controlled, sequential runs as required by §22: no retries (`--retries=0`), spaced (60 s between
live smoke runs, 20 s between mocked runs) so they never form continuous load.

| Item        | Value                                                                                 |
| ----------- | ------------------------------------------------------------------------------------- |
| Date        | 2026-10-22, 11:56–12:08 UTC (US and EU markets: pre-market / open)                    |
| Commit      | `608acf3` (`main` after PR #6; v1.0.0 adds only documentation and the version number) |
| Environment | Windows 11 Pro 10.0.26300, Intel Core Ultra 7 255H, 31 GB RAM, residential network    |
| Tooling     | Node.js 24.13.0, Playwright 1.64.0, Chromium (headless)                               |
| Pre-flight  | `available` before every run                                                          |

| Suite                                             | Runs | Workers | Tests per run | Tests executed | First-attempt pass rate | Duration per run (min / mean / max) | Slow starts |
| ------------------------------------------------- | ---: | ------: | ------------: | -------------: | ----------------------- | ----------------------------------- | ----------: |
| Live smoke (`api-live` + `ui-chromium`, `@smoke`) |    5 |       2 |             6 |             30 | **30/30 (100 %)**       | 8.1 / 11.9 / 14.5 s                 |           0 |
| Mocked (`ui-mocked`)                              |   10 |       4 |             6 |             60 | **60/60 (100 %)**       | 7.9 / 10.9 / 20.6 s                 |   1 (run 9) |

Per run:

| Suite      | Run | Started (UTC) | Passed | Duration | Notes                                                      |
| ---------- | --: | ------------- | -----: | -------: | ---------------------------------------------------------- |
| live smoke |   1 | 11:56:09      |    6/6 |   12.8 s |                                                            |
| live smoke |   2 | 11:57:23      |    6/6 |   14.5 s |                                                            |
| live smoke |   3 | 11:58:39      |    6/6 |   11.2 s |                                                            |
| live smoke |   4 | 11:59:52      |    6/6 |   12.8 s |                                                            |
| live smoke |   5 | 12:01:17      |    6/6 |    8.1 s |                                                            |
| mocked     |   1 | 12:02:29      |    6/6 |   10.9 s |                                                            |
| mocked     |   2 | 12:03:01      |    6/6 |    9.6 s |                                                            |
| mocked     |   3 | 12:03:32      |    6/6 |   12.3 s |                                                            |
| mocked     |   4 | 12:04:06      |    6/6 |   11.8 s |                                                            |
| mocked     |   5 | 12:04:39      |    6/6 |    7.9 s |                                                            |
| mocked     |   6 | 12:05:08      |    6/6 |    8.0 s |                                                            |
| mocked     |   7 | 12:05:38      |    6/6 |   11.1 s |                                                            |
| mocked     |   8 | 12:06:10      |    6/6 |    8.9 s |                                                            |
| mocked     |   9 | 12:06:40      |    6/6 |   20.6 s | one `slow-start` (known start-up stall), test still passed |
| mocked     |  10 | 12:07:22      |    6/6 |    7.9 s |                                                            |

**Reading the numbers.** 90 of 90 test executions passed on the first attempt locally, with no
retries. This supports the smoke and mocked suites as stable on a regular network; it is not a
claim about the whole framework, and it does not cover GitHub-hosted runners, where the UI
suites are blocked by the CDN (ADR 0001) and only the live API suite runs as a gate
(18/18 in PR run #3). The one slow start (≈ 1 in 60 loads in this sample) is consistent with the
start-up stall documented in discovery §12 and was absorbed by the dedicated `appStart` timeout
without a retry.
