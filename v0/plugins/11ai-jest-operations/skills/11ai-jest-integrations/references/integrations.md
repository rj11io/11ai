# Jest integrations reference

## Testing Library

```bash
npm install --save-dev @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

```ts
// jest.setup.ts
import "@testing-library/jest-dom"
```

```js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}
```

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

test("submits the form", async () => {
  const onSubmit = jest.fn()
  render(<UserForm onSubmit={onSubmit} />)

  await userEvent.type(screen.getByLabelText("Email"), "ada@example.com")
  await userEvent.click(screen.getByRole("button", { name: "Save" }))

  expect(onSubmit).toHaveBeenCalledWith({ email: "ada@example.com" })
})
```

The parts that decide whether these tests are worth having:

- Query by role, label, and text. A query by class name or test id tests the implementation, and it keeps passing after the component becomes unusable.
- `userEvent` over `fireEvent`. It produces the full event sequence a real interaction does, including focus and keyboard behaviour.
- `await` every `userEvent` call. Without it, assertions run before React has re-rendered.
- Use `findBy` for anything asynchronous, `getBy` for what is already there, and `queryBy` only to assert absence.
- Cleanup is automatic in current versions. Do not add a manual `cleanup` call in `afterEach`.

## Mock Service Worker

Intercepts at the network layer, so the code under test keeps using its real HTTP client.

```bash
npm install --save-dev msw
```

```ts
// test/msw/handlers.ts
import { http, HttpResponse } from "msw"

export const handlers = [
  http.get("/api/users", () =>
    HttpResponse.json([{ id: "1", email: "ada@example.com" }])
  ),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: "2", ...body }, { status: 201 })
  }),
]
```

```ts
// test/msw/server.ts
import { setupServer } from "msw/node"
import { handlers } from "./handlers"

export const server = setupServer(...handlers)
```

```ts
// jest.setup.ts
import { server } from "./test/msw/server"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

`onUnhandledRequest: "error"` is the setting that makes this trustworthy. Its default lets an unmatched request through to the real network, so a test can pass by silently calling a live service.

`resetHandlers` in `afterEach` removes per-test overrides. Without it, a handler added for one test changes the next one.

Override for a single test rather than editing the shared handlers:

```ts
test("shows an error when the server fails", async () => {
  server.use(
    http.get("/api/users", () => new HttpResponse(null, { status: 500 }))
  )

  render(<UserList />)
  expect(await screen.findByText("Could not load users")).toBeInTheDocument()
})
```

Node 18 and later provide `fetch`, so no polyfill is needed. Under jsdom, `TextEncoder` and streams sometimes are:

```ts
// jest.setup-polyfills.ts
import { TextDecoder, TextEncoder } from "node:util"

Object.assign(global, { TextDecoder, TextEncoder })
```

```js
module.exports = {
  setupFiles: ["<rootDir>/jest.setup-polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}
```

Polyfills go in `setupFiles`, which runs before the test framework; the server lifecycle goes in `setupFilesAfterEnv`.

Pick one owner for the network. Once Mock Service Worker is in place, delete the `jest.mock` calls on the HTTP client — otherwise a test passes against a module stub whose shape no longer matches the handler.

## Real dependencies in containers

For the tests that genuinely need a database.

```bash
npm install --save-dev @testcontainers/postgresql
```

```ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"

let container: StartedPostgreSqlContainer

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start()
  process.env.DATABASE_URL = container.getConnectionUri()
  await runMigrations(process.env.DATABASE_URL)
}, 60_000)

afterAll(async () => {
  await container.stop()
})
```

Points that make this work:

- Raise the hook timeout. Pulling an image on a cold machine takes longer than the default five seconds, and the failure reads as an unrelated timeout.
- Start the container once per file, not per test.
- Give each test its own rows, or truncate between tests. Do not depend on execution order.
- Run these suites with `--runInBand` or a small `--maxWorkers`; one container per worker exhausts a laptop quickly.
- Keep them in a separate project or path so `npm test` stays fast and the container suite is opt-in.

The lighter alternative is a schema per run against a database the pipeline already provides:

```ts
const schema = `test_${process.env.JEST_WORKER_ID}`
```

That gives isolation per worker without a container, at the cost of needing a database service in the pipeline.

## Reporters

```js
module.exports = {
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "reports",
      outputName: "junit.xml",
      classNameTemplate: "{classname}",
      titleTemplate: "{title}",
      ancestorSeparator: " › ",
    }],
  ],
}
```

```bash
npm install --save-dev jest-junit
```

Keep `"default"` in the list. Replacing it entirely leaves the terminal with no output, which makes local runs unreadable.

For GitHub Actions, an annotation reporter puts failures on the diff:

```bash
npm install --save-dev jest-github-actions-reporter
```

Add report directories to the ignore file:

```text
reports/
coverage/
junit.xml
```

## Coverage in a pipeline

```js
module.exports = {
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageReporters: ["text-summary", "lcov"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/test/**",
  ],
}
```

Leave `collectCoverage` off by default and turn it on with a flag, since instrumentation slows every run. `lcov` is the format coverage services read; `text-summary` keeps the log short.

```yaml
      - run: npm test -- --ci --coverage --reporters=default --reporters=jest-junit
        env:
          JEST_JUNIT_OUTPUT_DIR: reports

      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: reports/
```

`if: always()` on the artifact upload is what makes a failing run still produce its report — without it the useful evidence is discarded exactly when it is needed.

Thresholds belong in configuration, not in a flag:

```js
module.exports = {
  coverageThreshold: {
    global: { branches: 70, functions: 75, lines: 80, statements: 80 },
    "./src/billing/": { lines: 95 },
  },
}
```

Set the global number at or just below where the project already is, and raise it deliberately. A threshold lowered to make a build pass is a threshold that no longer means anything, and adding a file to `collectCoverageFrom` exclusions to lift a percentage is the same move with extra steps.

## Editor and debugger

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: current file",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--watchAll=false", "${relativeFile}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

`--runInBand` is required for breakpoints; in worker processes they are not hit. `--watchAll=false` stops the debug session from hanging in watch mode.

From the terminal:

```bash
node --inspect-brk node_modules/jest/bin/jest.js --runInBand path/to/file.test.ts
```

## Monorepo selection

```js
// jest.config.js at the repository root
module.exports = {
  projects: ["<rootDir>/packages/*/jest.config.js"],
}
```

```bash
npx jest --selectProjects api
npx jest --listTests --selectProjects web
```

Each package keeps its own environment and transform, so a server package runs under `node` while a web package runs under `jsdom`, and coverage still aggregates across both.

To run only what a change affects:

```bash
npx jest --changedSince=origin/main
```

That relies on Git and on the dependency graph Jest can see through imports. It will miss a dependency expressed only through configuration or a generated file, so keep a full run on the main branch.
