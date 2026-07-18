# Playwright Setup Reference

## Install

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

In CI on Ubuntu, install browser dependencies:

```bash
npx playwright install --with-deps chromium
```

## Package Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "playwright test --config=playwright.unit.config.ts",
    "test:e2e": "playwright test --config=playwright.config.ts"
  }
}
```

## Unit Config

`playwright.unit.config.ts`:

```ts
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
})
```

## E2E Config

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PORT ?? 3000)
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
```

## Sample Unit Test

`tests/unit/cn.unit.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

import { cn } from "../../lib/utils"

test("merges conditional classes and resolves Tailwind conflicts", () => {
  expect(cn("px-2 text-sm", false && "hidden", ["px-4"])).toBe("text-sm px-4")
})
```

## Sample E2E Tests

Homepage:

```ts
import { expect, test } from "@playwright/test"

test("renders the starter page and toggles dark mode", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Project ready!" })
  ).toBeVisible()

  await page.keyboard.press("d")
  await expect(page.locator("html")).toHaveClass(/dark/)
})
```

Signed-out protected page:

```ts
import { expect, test } from "@playwright/test"

test("shows a sign-in message when dashboard is opened signed out", async ({
  page,
}) => {
  await page.goto("/dashboard")

  await expect(
    page.getByRole("heading", { name: "Sign in to open the demo" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Sign in with WorkOS" })
  ).toHaveAttribute("href", "/login")
})
```

## Ignore Generated Artifacts

`.gitignore`:

```gitignore
/coverage
/playwright-report
/test-results
```

`eslint.config.mjs` global ignores:

```js
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "playwright-report/**",
  "test-results/**",
])
```

## GitHub Actions

Recommended quality job shape:

```yaml
name: Release

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  contents: read

jobs:
  release:
    name: Quality and Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Unit tests
        run: npm run test:unit

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npm run test:e2e

      - name: Release
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npm run semantic-release
```

If the workflow should run only on PR updates plus main release pushes, make `push` branch-scoped and rely on `pull_request` default events:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

The default `pull_request` activity types are `opened`, `synchronize`, and `reopened`.

## E2E Mock Env Vars

If the app needs auth env vars to boot but the E2E tests do not call the hosted auth provider, scope mock values to the E2E step:

```yaml
- name: E2E tests
  env:
    WORKOS_CLIENT_ID: client_ci_mock
    WORKOS_API_KEY: sk_test_ci_mock
    WORKOS_COOKIE_PASSWORD: ci-only-authkit-cookie-password-32-chars
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: http://localhost:3000/callback
  run: npm run test:e2e
```

Rules:

- Mock values are allowed only for local bootstrapping and signed-out E2E flows.
- Do not call real WorkOS, Stripe, Convex admin, or other third-party APIs with mock credentials.
- Store real secrets in Vercel environment variables or GitHub secrets.
- Never hardcode production API keys, cookie passwords, deploy keys, or webhook secrets.

## Verification Commands

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:e2e
npm test
```

For CI-like local E2E with mock env:

```bash
WORKOS_CLIENT_ID=client_ci_mock \
WORKOS_API_KEY=sk_test_ci_mock \
WORKOS_COOKIE_PASSWORD=ci-only-authkit-cookie-password-32-chars \
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback \
npm run test:e2e
```

## Official References

- Playwright test runner: https://playwright.dev/docs/test-intro
- Playwright CI: https://playwright.dev/docs/ci
- GitHub Actions workflow syntax: https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
