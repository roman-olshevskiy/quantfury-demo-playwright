# ADR 0002 — Playwright APIRequestContext with a thin recording transport for HTTP tests

- Status: accepted
- Date: 2026-10-22
- Requirements: §5.2, §12, §19

## Context

The live API suite calls the demo backend directly (bootstrap host and demo REST API). It needs
per-test isolation (each test is its own demo identity, `custom-deviceid`), the same runner,
reports and fixtures as the UI suites, and safe request/response diagnostics on failure. External
data must stay `unknown` until a schema validates it.

## Decision

- Use **Playwright `APIRequestContext`** for every HTTP call. Each test gets its own context
  (created by a fixture, disposed in teardown) with the demo headers and a fresh random device id.
- Put a **thin `ApiTransport`** in front of it. Its only job is to record each exchange into a
  bounded, redacted log that is attached to the report when a test fails; it never retries and
  never interprets status codes.
- **One client per resource group** (bootstrap, instruments, market data, news) exposes only
  observed endpoints and returns the raw `APIResponse`; tests assert status and headers, then
  narrow the body with `expectToMatchSchema` (Ajv) into the compile-time model.
- Schemas are plain JSON Schema compiled by Ajv; they do not use `additionalProperties: false`.

## Alternatives considered

| Alternative                                       | Why not                                                                                                                 |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Axios / got / fetch with a separate test runner   | A second HTTP stack and runner, no shared fixtures or reports; §5.2 asks not to add Axios without a reason.             |
| Calling `APIRequestContext` directly in tests     | Works, but every test would need its own diagnostics; the transport gives one place for redaction and the exchange log. |
| A generic "API wrapper" that parses and validates | Hides status and headers from tests and duplicates Playwright's API (§7.2).                                             |
| Ajv `JSONSchemaType<T>` to link schemas and types | Forces `nullable: true` on optional properties, which would accept nulls the API never sends.                           |
| HTTP retries in the client                        | Would hide product errors (§12).                                                                                        |

## Consequences

- API tests are fast (≈ 6 s for 18 tests on 2 workers) and run in CI without a browser
  (ADR 0001).
- Schema and model can drift apart at compile time; the live suite catches a schema that no longer
  matches, and mocked payloads are validated against the same schemas.
- Negative tests use `api.raw` or `apiWithoutDemoHeaders` for malformed or header-less requests,
  so the clients stay typed for normal use.
