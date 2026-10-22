# Quantfury Demo — Playwright + TypeScript

Independent portfolio project: a test-automation framework for the public demo mode of
[Quantfury](https://trading.quantfury.com/), built with Playwright Test and strict TypeScript.

> **Independent project.** This is not an official Quantfury test framework and is not affiliated
> with or endorsed by Quantfury. It only exercises the publicly available demo mode, without
> accounts, credentials or real financial operations.

**Status:** work in progress (milestone M0 — tooling scaffold and product discovery).

## Stack

| Tool             | Version                          |
| ---------------- | -------------------------------- |
| Node.js          | 24.13.0 LTS (see `.nvmrc`)       |
| npm              | 11.x                             |
| @playwright/test | 1.64.0                           |
| TypeScript       | 6.0.3                            |
| ESLint           | 10.11.0 (with typescript-eslint) |
| Prettier         | 3.9.9                            |

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
```

On Linux CI runners install browser OS dependencies as well:

```bash
npx playwright install --with-deps
```

Optional local configuration: copy `.env.example` to `.env`. All variables have documented
defaults and are validated before a run.

## Documentation

- [Requirements](docs/requirements.md)
- [Product discovery](docs/product-discovery.md)
- [Test strategy](docs/test-strategy.md)
- [Coverage map](docs/coverage-map.md)

## License

[MIT](LICENSE) for the code in this repository only. No rights to the Quantfury product or brand
are granted.
