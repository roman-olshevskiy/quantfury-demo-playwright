# ADR 0005 — Abort third-party requests in UI tests

- Status: accepted
- Date: 2026-10-22
- Requirements: §15, §19

## Context

The Trade screen loads analytics, ads, attribution, crash reporting, push and chat scripts from
about 17 third-party hosts (Google Tag Manager/Analytics, DoubleClick, AppsFlyer, Firebase,
Sentry, Intercom, Twitter). They are not needed for the demo's behavior, add network noise to
diagnostics, add external dependencies to every test, and record test traffic as real user
sessions in the product's analytics.

## Decision

Every UI test's browser context aborts requests to any host other than the three the demo needs:
the web app (`BASE_URL`), the bootstrap host and the demo API host (all from validated
configuration). Aborts use `blockedbyclient` and are filtered out of diagnostics as expected.

## Evidence

Controlled loads on 2026-10-22 (docs/product-discovery.md §5, §12):

- with all third-party hosts aborted, the Trade screen and widgets render (5/5 runs);
- start-up takes ~2 s with blocking vs. ~5–7.5 s without;
- the rare 11–17 s start-up stall occurs at the same rate with and without blocking (1/15, 1/15
  with only Firebase allowed, 1/20 without any blocking), so blocking does not cause it.

## Alternatives considered

| Alternative                          | Why not                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Allow everything                     | Slower, noisier, pollutes product analytics with test sessions.                                         |
| Block a fixed list of known trackers | Breaks silently when the product adds a new third party; an allow-list of the app's own hosts does not. |
| Mock third-party endpoints           | Simulates services the project does not own, for no test value.                                         |

## Consequences

- UI tests verify the demo's own behavior, not third-party availability.
- Features that depend on a third party (for example the Intercom chat widget) are out of scope.
- If the product ever makes a third party mandatory for start-up, the first symptom is a
  start-up failure with a blocked-request trail in `page-diagnostics.json`; the allow-list is the
  single place to change.
