# ADR 0004 — Separate live and mocked suites; narrow, schema-validated mocks

- Status: accepted
- Date: 2026-10-22
- Requirements: §13, §14, §15, §17, §18

## Context

Live data changes constantly (prices, gainers, news), markets open and close, and some states —
empty lists, HTTP errors, business errors, slow responses, exact formatting — cannot be produced
on demand against the real backend. At the same time, mocks that drift from the real contract give
false confidence.

## Decision

- **Live suites** (`tests/api`, `tests/ui`, `tests/integration`, tags `@live`) assert only rules
  that hold for any live value, and compare the UI with the response **the same page received**
  (`page.waitForResponse`), never with an independent snapshot.
- **Mocked suite** (`tests/mocked`, project `ui-mocked`, tag `@mocked`, retries 0) mocks **one
  endpoint per test** with exact host + path matchers registered before navigation; every other
  request reaches the real backend. The real-time hub is stubbed only where live quotes would
  overwrite mocked values.
- **Mock payloads come from builders** and pass the **same JSON Schemas** as live responses;
  partial-data mocks start from real (snapshot) data and strip fields.
- **Expected UI reactions were observed before tests were written** (exploratory mocks), not
  assumed.
- Failures provoked by a mock are labelled as expected in the page diagnostics.

## Alternatives considered

| Alternative                          | Why not                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| Recorded HAR replay of the whole app | Large, quickly outdated, and contains session-like data.             |
| Global `page.route('**/*')` mocks    | Blocks unrelated requests by accident (§15) and hides real behavior. |
| Fully synthetic backend              | Out of scope: the product is not run or emulated by this project.    |
| Mixing mocked checks into live tests | Mocked results would be counted as live E2E coverage (§15).          |

## Consequences

- Mocked tests are deterministic about what they mock but still need the live web app and the
  unmocked endpoints; on GitHub-hosted runners they are blocked like the live UI (ADR 0001).
- A contract change shows up as a failing live schema check and as invalid builder output, not as
  silently stale mocks.
