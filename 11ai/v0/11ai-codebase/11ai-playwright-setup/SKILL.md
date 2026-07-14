---
name: 11ai-playwright-setup
description: "Add or maintain Playwright testing for web applications, including unit-style Playwright tests, browser E2E tests, separate Playwright configs, npm scripts, GitHub Actions CI wiring, browser installation, localhost web server setup, mock environment variables for auth-dependent apps, ignored test artifacts, and troubleshooting CI failures."
---

# Playwright Setup

## Overview

Use this skill to add a small, reliable Playwright test surface to a web app and wire it into CI.

Prefer one fast unit-style sanity test plus one browser E2E test before expanding coverage. Keep E2E tests focused on user-visible behavior and make CI provide any local mock env vars required for the app to boot.

## Workflow

1. Inspect the repo.
   Read `package.json`, app framework config, existing tests, existing CI workflows, `.gitignore`, and any env-dependent app startup code.

2. Install Playwright.
   Add `@playwright/test` as a dev dependency.
   Add npm scripts for `test`, `test:unit`, and `test:e2e`.

3. Add separate configs.
   Use a unit config for tests that do not launch a browser.
   Use an E2E config with a local web server, localhost base URL, browser project, retries, and CI-safe workers.

4. Add sample tests.
   Add one unit-style test for a stable helper or pure function.
   Add one E2E test for the first screen or signed-out flow.
   Avoid real third-party auth or payment calls in CI E2E tests unless explicitly required.

5. Update ignored artifacts.
   Ignore `/playwright-report` and `/test-results`.
   Add those paths to ESLint global ignores if ESLint walks ignored directories.

6. Wire CI.
   Run typecheck, lint, build, unit tests, install Playwright browsers, and E2E tests.
   Use `npx playwright install --with-deps chromium` in Ubuntu CI.
   Scope mock env vars to the E2E step when the app needs local auth/database config just to boot.

7. Verify.
   Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:e2e`, and `npm test`.

## GitHub Actions Rules

- Run CI on pull requests to the target branch.
- If the same workflow also releases, only release on pushes to the release branch.
- Prefer `pull_request` default events unless custom `types` are needed. GitHub defaults to `opened`, `synchronize`, and `reopened`.
- Put mock test env vars on the E2E test step, not global workflow scope.
- Do not hardcode real secrets in workflow files.

## Troubleshooting

- Browser missing in CI: add `npx playwright install --with-deps chromium` before E2E tests.
- App cannot start in CI: add local mock env vars required for startup to the E2E step.
- AuthKit redirect URI missing: set `NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback` on the E2E step.
- AuthKit cookie password missing: set a 32+ character mock `WORKOS_COOKIE_PASSWORD` on the E2E step.
- Tests pass locally but fail in CI: check workers, base URL, web server port, retries, and missing env vars.
- ESLint errors on `test-results`: add `test-results/**` and `playwright-report/**` to ESLint global ignores.

## References

Read [references/setup.md](./references/setup.md) for recommended configs, package scripts, sample tests, CI snippets, and mock env examples.
