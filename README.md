# Quantfury Demo — Playwright + TypeScript

Independent portfolio project: a test-automation framework for the public demo mode of
[Quantfury](https://trading.quantfury.com/), built with Playwright Test and strict TypeScript.

> **Independent project.** This is not an official Quantfury test framework and is not affiliated
> with or endorsed by Quantfury. It only exercises the publicly available demo mode, without
> accounts, credentials or real financial operations.

**Status:** work in progress — M1 done (config, fixtures, API clients, live API suite). UI,
integration and mocked suites, CI and reliability results follow in later milestones.

## Stack

| Tool             | Version                          |
| ---------------- | -------------------------------- |
| Node.js          | 24.13.0 LTS (see `.nvmrc`)       |
| npm              | 11.x                             |
| @playwright/test | 1.64.0                           |
| TypeScript       | 6.0.3                            |
| ESLint           | 10.11.0 (with typescript-eslint) |
| Prettier         | 3.9.9                            |
| Ajv              | 8.20.0 (+ ajv-formats 3.0.1)     |
| zod / dotenv     | 4.6.5 / 18.0.5                   |

## Quick start

```bash
git clone https://github.com/roman-olshevskiy/quantfury-demo-playwright.git
cd quantfury-demo-playwright
node --version
npm --version
npm ci
npx playwright install
npm run typecheck
npm run lint
npm run test:api
npm run report
```

On Linux CI runners install browser OS dependencies as well:

```bash
npx playwright install --with-deps
```

## Configuration

Copy `.env.example` to `.env` to override defaults. Every variable is validated (zod) before a run;
an invalid value stops the run with a message naming the variable.

| Variable             | Default                          | Notes                          |
| -------------------- | -------------------------------- | ------------------------------ |
| `BASE_URL`           | `https://trading.quantfury.com/` | Web app; HTTPS only            |
| `DEMO_BOOTSTRAP_URL` | `https://b1.trdngbcknd.com/`     | Demo bootstrap host (observed) |
| `API_BASE_URL`       | `https://n1.trdngbcknd.com/`     | Demo REST API host (observed)  |
| `WORKERS`            | `1`                              | 1–4; live runs use at most 2   |
| `CI`                 | `false`                          | Set by GitHub Actions          |

### Timeouts

Defined per kind in [src/config/timeouts.ts](src/config/timeouts.ts) instead of one global value:

| Kind                      | Value |
| ------------------------- | ----- |
| Test (including fixtures) | 60 s  |
| Web-first assertion       | 10 s  |
| UI action                 | 15 s  |
| Navigation                | 30 s  |
| Single API request        | 30 s  |

## Running tests

| Command                                                              | What runs                                         |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `npm test`                                                           | `@smoke` API/Chromium tests plus the mocked suite |
| `npm run test:smoke`                                                 | `@smoke` tests, API and Chromium                  |
| `npm run test:api`                                                   | Live HTTP API suite (`api-live`, no browser)      |
| `npm run test:ui`                                                    | Live UI suite, Chromium                           |
| `npm run test:integration`                                           | UI/API consistency tests, Chromium                |
| `npm run test:mocked`                                                | Mocked UI suite                                   |
| `npm run test:headed` / `test:debug` / `test:ui-mode` / `test:trace` | Debugging variants                                |
| `npm run report`                                                     | Opens the last HTML report                        |

Select by tag with `--grep`, for example `npx playwright test --project=api-live --grep @regression`.

## Framework layout

```text
src/
  config/      env.ts (validated configuration), timeouts.ts
  api/
    http/      ApiTransport (records redacted exchanges), demo headers, JSON reading
    clients/   one client per resource group: bootstrap, instruments, market data, news
    models/    compile-time types of the API payloads
    schemas/   JSON Schemas + compiled Ajv validators (runtime validation)
  assertions/  expectToMatchSchema (narrows unknown → model), HTTP helpers
  fixtures/    typed fixtures: fresh device id, isolated APIRequestContext, clients, diagnostics
  data/        known instruments used as test data
tests/
  api/         live API suite
```

Every API test gets a fresh demo identity (`custom-deviceid`) and its own `APIRequestContext`,
disposed after the test. On failure, the redacted request/response history of the test is attached
to the report as `api-exchanges.json` (bounded to the last 50 exchanges, bodies truncated, device
ids and other session-like values masked).

## Documentation

- [Requirements](docs/requirements.md)
- [Product discovery](docs/product-discovery.md)
- [Test strategy](docs/test-strategy.md)
- [Coverage map](docs/coverage-map.md)

## License

[MIT](LICENSE) for the code in this repository only. No rights to the Quantfury product or brand
are granted.
