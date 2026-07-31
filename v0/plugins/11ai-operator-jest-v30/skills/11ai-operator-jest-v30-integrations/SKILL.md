---
name: 11ai-operator-jest-v30-integrations
description: "Connect Jest to the tools around it, covering Testing Library and component rendering, request interception with Mock Service Worker, real databases and containers in integration tests, coverage reporting to a pipeline or coverage service, JUnit and JSON reporters for build artifacts, editor and debugger integration, and monorepo project selection. Use when tests must exercise a component, a stubbed network call, or a real dependency, or when the pipeline needs machine-readable results and coverage."
---

# Jest integrations

Version baseline: Jest 30.x, with 30.4.2 as the current stable release at this review. Inspect the installed patch, Node.js support, module system, test environment, and transformer compatibility before changing configuration.

Each of these seams answers one question: how far does a test reach before something stands in for the real thing. Decide that boundary first, then wire the single tool that owns it, because two tools stubbing the same layer produce failures that contradict each other.

## Name the seam

- **Component rendering** — Testing Library queries the DOM Jest rendered, and user interaction runs through its event helpers.
- **Network** — Mock Service Worker intercepts requests at the network layer, so the code under test uses its real client.
- **Real dependencies** — a database or broker runs in a container for the tests that genuinely need one.
- **Coverage reporting** — a pipeline reads a coverage file and a coverage service tracks the trend.
- **Machine-readable results** — a JUnit or JSON reporter turns failures into annotations on a build.
- **Editor and debugger** — a single test runs and breaks on a breakpoint without leaving the editor.
- **Monorepo selection** — one runner, several project configurations, and a way to run only the affected one.

## Wire one deliberately

1. Inspect what already exists: the setup files, existing mocks and `__mocks__` directories, the pipeline's test step, and any reporter or coverage configuration.
2. Choose one owner per layer. If Mock Service Worker intercepts requests, stop mocking the HTTP client module as well; keeping both means a test can pass against a stub that no longer matches the handler.
3. Stub at the boundary the code does not own. The network, the clock, and the filesystem are boundaries; the module next door usually is not.
4. Keep the integration in a setup file rather than repeated in each suite, and make it reset between tests so state cannot leak.
5. For real dependencies, start the container once per suite run, and give each test its own schema or its own rows rather than relying on ordering.
6. For reporting, write artifacts to a path the pipeline collects and keep the file out of version control. Read [references/integrations.md](references/integrations.md) for the Testing Library setup, the Mock Service Worker handler and lifecycle, the container pattern, and the reporter and coverage configuration.

## Verify end to end

- Render one component, interact with it, and confirm the assertion fails when the component is wrong — a test that cannot fail proves nothing.
- Break one Mock Service Worker handler on purpose and confirm the test notices, then confirm an unhandled request is reported rather than silently passing through.
- Run the suite twice in a row and with `--randomize` to catch state leaking between tests.
- Run the pipeline and confirm the coverage file and result artifact actually appear, and that a failing test shows up as a failure rather than a green run with no tests.

## Guardrails

- Do not commit coverage output, JUnit files, or a downloaded Mock Service Worker service worker script; add them to the ignore file.
- Do not point integration tests at a shared or production database. A container or a per-run schema is the boundary.
- Do not raise a coverage threshold to pass a build, and do not add a file to the coverage ignore list to lift a percentage.
- Do not add `--forceExit` to make a container-backed suite terminate. An open handle is a teardown bug; hand it to `11ai-operator-jest-v30-troubleshooting`.
- Report the seam wired, the files changed, what now runs in setup and teardown, the artifact paths, and the verification evidence including a deliberate failure.
