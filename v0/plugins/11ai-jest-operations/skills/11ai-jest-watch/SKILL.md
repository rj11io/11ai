---
name: 11ai-jest-watch
description: "Start and control Jest watch mode for fast local feedback, selecting changed tests, all tests, a file, or a test name while preserving an interactive terminal workflow. Use when the user wants Jest to rerun tests as files change or needs help with watch-mode controls."
---

# Jest watch mode

Use watch mode for an interactive local terminal, not for CI or a detached
background process. Inspect the project's test script and repository state
first so watch mode uses the same config as normal tests.

## Start the right mode

```sh
# rerun tests related to changed files
<project-test-command> --watch

# rerun the full suite on every change
<project-test-command> --watchAll
```

When forwarding through npm, include the separator:

```sh
npm test -- --watch
```

To narrow the initial run, combine watch mode with a quoted test-name or file
selector. Prefer Jest's interactive filtering once the process is running.
The exact single-key controls can vary by Jest version; press `w` to display
the available watch help rather than relying on memory.

## Workflow

1. Confirm the terminal is interactive and the user wants a long-running
   process.
2. Start with `--watch` unless the user explicitly needs every test.
3. Record the initial result and the active watch mode.
4. When the user changes a file, report the rerun result rather than assuming
   a green watch process means every test is green.
5. Stop with `q` or Ctrl-C when the task is complete. Do not leave a watcher
   running invisibly.

## Watch-mode pitfalls

- `--watch` relies on repository change detection and normally works best in a
  Git repository; `--watchAll` is the fallback when changed-file selection is
  not meaningful.
- A changed source file can produce no rerun when the dependency graph is
  dynamic or the file is outside `roots`.
- Watch mode uses fewer workers by default than a single run. Do not diagnose a
  worker-capacity issue from watch performance alone.
- CI environments should use a terminating command such as `--ci`, not
  `--watch` or `--watchAll`.

## Guardrails

- Never use watch mode as a background service without explicit user approval.
- Never change `watchPathIgnorePatterns`, file watchers, or dependencies just
  because a first run is slow; inspect the resolved config first.
- If the watcher hangs or misses a file, stop it cleanly and hand off to
  `11ai-jest-troubleshooting`.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest configuration](https://jestjs.io/docs/configuration)
