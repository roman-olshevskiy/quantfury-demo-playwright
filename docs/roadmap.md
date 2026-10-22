# Roadmap after v1.0.0

Planned P1 work (requirements §25–26). One branch and one PR per item, each cut from the latest
`main`; squash merge. UI-related items must be verified locally (ADR 0001).

## Progress

| #   | Status                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Done (PR #9): `.github/dependabot.yml`, blocking `Dependency audit` job (`npm run audit:deps`)                                                                                                   |
| 2   | Done (PR #12): `@axe-core/playwright` 4.13.0, UI-08/UI-09, baseline of 3 known rules in `src/data/accessibility-baseline.ts`, `npm run test:a11y`                                                |
| 3   | Done (PR #13): `playwright-bdd` 9.2.1, 5 scenarios in 4 features, steps on the shared fixtures, project `bdd`, `npm run test:bdd`, scheduled signal job, ADR 0006                                |
| 4   | Done on `test/realtime-messages`: `@msgpack/msgpack` 3.1.3, SignalR envelope decoding, UI-07 extended, UI-10 (subscription on selection), MOC-07 (disconnect/reconnect via `HubProxy`), ADR 0007 |
| 5–7 | **TBD** — not planned for now (2026-10-22); see the reasons below                                                                                                                                |

### Why items 5–7 are on hold

- **5 Visual regression:** live, constantly changing data and a moving chart would need heavy
  masking; baselines differ between Windows and Linux, and CI cannot run UI suites to keep them
  consistent (ADR 0001). High maintenance for little signal on this product.
- **6 Sharding + merged reports:** the whole suite runs in ~35–45 s, so sharding saves nothing;
  it becomes useful only if the suite grows substantially.
- **7 Mobile viewport:** the app has a separate mobile layout (hidden duplicates seen in
  discovery) that needs its own locators, and emulation is not real-device coverage; low
  priority.

## Order and scope

| #   | Item                           | Branch                   | Scope                                                                                                                                                                                                                                                                      | Done when                                           | Size |
| --- | ------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---- |
| 1   | Dependabot + dependency audit  | `chore/dependabot-audit` | `.github/dependabot.yml` (npm weekly, actions monthly, grouped minor/patch); `npm audit --audit-level=high` job in `pull-request.yml`                                                                                                                                      | Config merged; audit job green and blocking         | S    |
| 2   | Accessibility smoke (axe)      | `test/a11y-smoke`        | Add `@axe-core/playwright`; `tests/ui/a11y.spec.ts` `@ui @live @regression` for the Trade screen and the instrument panel; baseline of known violations documented, new ones fail                                                                                          | 1–2 tests, documented exclusions, coverage map rows | S–M  |
| 3   | BDD suite                      | `test/bdd`               | `playwright-bdd`; 3–5 English feature files in `bdd/features` (open demo, search instrument, empty search, API instrument list, momentum switch); steps reuse fixtures, page objects and clients; `npm run test:bdd`; generated files ignored; ADR 0006 on where BDD helps | Suite passes locally; no duplicated logic           | M    |
| 4   | WebSocket decoding + reconnect | `test/realtime-messages` | ADR for a MessagePack decoder dependency; decode SignalR frames in `RealtimeHubMonitor` (counts/types only, no payload attachments); subscription check for a selected instrument; `routeWebSocket` disconnect/reconnect scenario in the mocked suite                      | UI-10/MOC-07 rows; no tokens in attachments         | M    |
| 5   | Limited visual regression      | `test/visual-baseline`   | `toHaveScreenshot` for stable parts only (header, empty search state, mocked momentum widget with fixed quotes); mask prices/time/chart; baselines created in one documented environment; update via reviewed PR                                                           | 3–4 snapshots stable over 10 local runs             | M    |
| 6   | Sharding + merged reports      | `ci/sharding`            | Blob reporter in CI, `--shard` matrix for the scheduled UI signal, `merge-reports` job; confirm total live request volume stays within the 2-worker limit                                                                                                                  | Merged HTML report artifact                         | S    |
| 7   | Mobile viewport (optional)     | `test/mobile-viewport`   | `ui-mobile-smoke` project (emulated, documented as not real-device coverage)                                                                                                                                                                                               | Smoke passes locally                                | S    |

## Housekeeping (any time)

- Re-run the reliability check (5 live smoke, 10 mocked) after items 2–4 and append to
  `docs/reliability.md`.
- Watch the scheduled workflow: if GitHub-hosted runners stop being blocked, revisit ADR 0001.
- Review quarantines (none today) and the `slow-start` rate in run summaries.
- Keep `docs/coverage-map.md`, README and release notes in sync; release as `v1.1.0` when
  items 1–4 are merged (tag on the squash-merged `main` commit).

## Session tips

- Start each session with: "Continue the roadmap in docs/roadmap.md, item N".
- Commit identity for this repo: `olshevskiy90@gmail.com` (repo-local config).
