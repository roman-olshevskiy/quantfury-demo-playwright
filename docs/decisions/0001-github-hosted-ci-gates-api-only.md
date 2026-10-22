# ADR 0001 — CI on GitHub-hosted runners gates on static checks and the live API suite only

- Status: accepted
- Date: 2026-10-22
- Requirements: §16, §20, §21, §30

## Context

The requirements ask for a pull-request gate with static checks, the mocked suite and a small
live API/UI smoke on GitHub-hosted runners (§20).

The first two CI runs on PR #6 (2026-10-22, see
[reliability.md](../reliability.md#ci-runs-on-github-hosted-runners)) showed that the Cloudflare
layer in front of the demo treats GitHub-hosted runners differently from a residential machine:

- the web app's own static assets on `trading.quantfury.com` (first seen: the font
  `/css/fonts/UniNeueRegular_v39.woff2`) were answered with an HTTP 403 Cloudflare block page
  (cf-ray `…-IAD`), so headless Chromium never rendered the Trade screen;
- one call to `n1.trdngbcknd.com/v13/instruments` was also answered with a 403 HTML page;
- plain HTTP requests through `APIRequestContext` — the whole live API suite, the pre-flight —
  passed.

Locally (residential IP) every suite passes. The mocked suite is affected as well: it mocks
individual API endpoints but still loads the real application and its assets.

Bypassing bot protection (stealth plugins, spoofed fingerprints, rotating IPs, challenge
solvers) is out of bounds for this project.

## Decision

- **Blocking gates on GitHub-hosted runners:** static checks (format, ESLint, TypeScript) and the
  live HTTP API suite — on every pull request and every push to `main`.
- **UI, integration and mocked suites** run **locally** (documented commands, reliability runs)
  and on GitHub-hosted runners only as a **non-blocking scheduled signal** (`scheduled.yml`) and
  on manual dispatch.
- In signal mode, a job ends with a warning when **every** failure is attributed to the
  environment (the pre-flight stopped the run, or each failed test saw a CDN block or challenge
  page); any other failure or a flaky test still fails the job
  ([evaluate-run.mjs](../../.github/scripts/evaluate-run.mjs)).
- Blocking suites keep failing on an environment problem (§21): a gate never passes without
  results.

## Alternatives considered

| Alternative                                                                  | Why not                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Self-hosted runner on a residential connection                               | Works today, but makes PR checks depend on one personal machine being online, and departs from the GitHub-hosted CI the requirements name. Can be added later without changing the suites (runner label only). |
| Keep UI jobs as PR gates                                                     | PRs would be permanently red for a reason the project cannot fix; a gate that always fails trains people to ignore it.                                                                                         |
| Retry or slow down UI jobs                                                   | The block is consistent, not transient; retries only add load.                                                                                                                                                 |
| Hide environment failures (skip, `continue-on-error` without classification) | Violates §21: no silent skips, outages are classified, not swallowed.                                                                                                                                          |
| Work around the bot protection                                               | Out of scope and not acceptable.                                                                                                                                                                               |

## Consequences

- PR and `main` CI give a fast, reliable signal for code quality and the API contract.
- UI regressions are not caught by CI before merge; they are caught by local runs (required in
  [CONTRIBUTING](../../CONTRIBUTING.md) for UI changes) and, if the block is lifted, by the
  scheduled signal, which then starts reporting real UI results without further changes.
- The scheduled workflow keeps measuring whether GitHub-hosted runners are still blocked; its job
  summary lists the blocked requests with cf-ray.
- The limitation is part of the documented scope ([test-strategy.md](../test-strategy.md)) and of
  the v1.0.0 release notes ([v1.0.0.md](../release-notes/v1.0.0.md)).
