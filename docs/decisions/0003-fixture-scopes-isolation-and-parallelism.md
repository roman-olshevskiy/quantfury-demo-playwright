# ADR 0003 — Fixture scopes, test isolation and parallelism limits

- Status: accepted
- Date: 2026-10-22
- Requirements: §10, §16

## Context

The demo has no accounts, but it is not stateless: every fresh browser registers a device id
(`userDevices/add`, `activate`) and caches ~1 MB of instruments in `localStorage`
(docs/product-discovery.md §4, §9–10). Tests run against a shared public environment, so both
isolation and request volume matter. Discovery also showed a client-side start-up stall in about
1 of 15–20 fresh loads.

## Decision

- **Test scope for everything that carries identity or state:** a new browser context per UI test
  (fresh `localStorage`, fresh device id), a new `APIRequestContext` per API test with a random
  device id, per-test diagnostics, network expectations and route mocks (`page.unrouteAll` in
  teardown).
- **Worker scope only for immutable reference data:** the instrument-list snapshot used by the
  mocked suite, fetched once per worker, validated and frozen.
- **No saved storage state** for live suites: it would share a device id and cache between tests.
- **Read-only against the backend:** no test calls device-registration or watchlist write
  endpoints.
- **Parallelism:** `fullyParallel: true` for all projects (tests are independent). Workers are
  configured through `WORKERS` (validated 1–4): live suites run with **at most 2**, the mocked
  suite with up to 4. Manual CI runs reject 4 workers for live suites. Scheduled CI jobs run one
  after another, so the public demo never sees two live jobs from this project at once.
- **No `test.describe.serial`** and no ordering between tests.

## Alternatives considered

| Alternative                                               | Why not                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| One logged-in or seeded storage state shared by all tests | Shares mutable demo state; hides isolation problems.                  |
| Worker-scoped browser contexts                            | Faster, but leaks `localStorage`, device id and routes between tests. |
| Unlimited workers                                         | Turns functional tests into load on a public service (§16).           |
| Serial mode to get stable runs                            | Hides dependencies instead of removing them.                          |

## Consequences

- Each UI test pays one ~1 MB instrument download (live suites); the mocked suite avoids it with
  the snapshot.
- Isolation was verified on 1, 2 and 4 workers with repeats (docs/reliability.md).
- Start-up time is measured per test; slow starts are annotated, not retried
  (docs/product-discovery.md §12).
