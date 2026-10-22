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

The pre-flight reported `available` because it probed only `searchCategories`, so the block was
not classified. Follow-up changes (M3): the pre-flight also probes the instrument-list path;
CDN block and challenge pages are recognized in the pre-flight, the API exchange log, the page
diagnostics and the instrument snapshot; a failed test that saw one is annotated `environment`,
and the run summary counts and lists those failures with path, status, cf-ray and page title.
Verified locally with simulated block pages: a challenged main document stalls start-up and is
reported as "Failed because of the environment", exit code 1; blocked API or bootstrap
responses alone do not stop the app from rendering.

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

## Repeatability runs (M4)

Pending: 5 sequential live smoke runs (2 workers, no retries) and 10 mocked runs (4 workers, no
retries), with commit, environment, test count, duration and first-attempt pass rate.
