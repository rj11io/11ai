# 11ai Jest operator

Fourteen standalone skills for setting up Jest, inspecting Jest projects, running
focused tests, connecting Jest to the tools around it, and diagnosing common test
failures across JavaScript and TypeScript repositories.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-jest-setup`](./skills/11ai-operator-jest-setup/SKILL.md) | Installing Jest and choosing the transform, module system, environment, module mapping, and scripts |
| [`11ai-operator-jest-environment`](./skills/11ai-operator-jest-environment/SKILL.md) | Inspecting the package manager, Jest version, test scripts, config, and test environment |
| [`11ai-operator-jest-integrations`](./skills/11ai-operator-jest-integrations/SKILL.md) | Connecting Jest to Testing Library, request interception, containers, reporters, coverage services, and the debugger |
| [`11ai-operator-jest-runner`](./skills/11ai-operator-jest-runner/SKILL.md) | Running all, selected, related, changed, or named tests with the right argument forwarding |
| [`11ai-operator-jest-watch`](./skills/11ai-operator-jest-watch/SKILL.md) | Using interactive watch mode without accidentally turning it into a CI command |
| [`11ai-operator-jest-coverage`](./skills/11ai-operator-jest-coverage/SKILL.md) | Collecting, reading, and improving Jest coverage reports and thresholds |
| [`11ai-operator-jest-snapshots`](./skills/11ai-operator-jest-snapshots/SKILL.md) | Reviewing, updating, and diagnosing snapshot tests |
| [`11ai-operator-jest-mocks`](./skills/11ai-operator-jest-mocks/SKILL.md) | Creating spies and mocks, controlling implementations, and cleaning mock state |
| [`11ai-operator-jest-async`](./skills/11ai-operator-jest-async/SKILL.md) | Writing and repairing promise, callback, rejection, and timeout-aware tests |
| [`11ai-operator-jest-timers`](./skills/11ai-operator-jest-timers/SKILL.md) | Controlling fake timers and finding timer-related leaks or hangs |
| [`11ai-operator-jest-config`](./skills/11ai-operator-jest-config/SKILL.md) | Inspecting or making deliberate changes to Jest configuration |
| [`11ai-operator-jest-ci`](./skills/11ai-operator-jest-ci/SKILL.md) | Designing deterministic Jest commands for CI, reports, workers, and sharding |
| [`11ai-operator-jest-cheatsheet`](./skills/11ai-operator-jest-cheatsheet/SKILL.md) | Looking up common Jest commands, flags, APIs, and decision rules |
| [`11ai-operator-jest-troubleshooting`](./skills/11ai-operator-jest-troubleshooting/SKILL.md) | Diagnosing discovery, transform, environment, mock, timeout, coverage, and exit failures |

## Operating contract

Start by reading the repository's `package.json`, lockfile, Jest config, and
existing test scripts. Prefer the existing package-manager script so its
environment and config are preserved. Use `npm test -- <jest args>`,
`yarn test <jest args>`, `pnpm test <jest args>`, or `bun run test <jest args>`
as appropriate; do not silently install packages.

Run read-only inspection before changing files. Updating snapshots, changing
configuration, adding setup files, deleting coverage output, or adding a
dependency requires that the user explicitly requested that change. Treat
`--forceExit` as an escape hatch for an identified cleanup problem, not as the
default solution to a hanging test. When a command is version-sensitive, check
`jest --help` or `jest --version` in the target project first.

The skills are intentionally narrow. Combine them when a task crosses a
boundary, such as inspecting the environment before fixing a transform error,
or running a focused test before collecting coverage.

## Follow-on skills worth adding

- `11ai-jest-test-authoring` for adding focused unit tests from an existing behavior contract.
- `11ai-jest-flaky-tests` for repeat runs, seeds, isolation, open handles, and order-dependent failures.
- `11ai-jest-performance` for worker sizing, memory pressure, cache behavior, and slow-test triage.

The transform and module-resolution choices once listed here now live in
`11ai-operator-jest-setup`; jsdom gaps, Testing Library, reporters, and monorepo project
selection live in `11ai-operator-jest-integrations`.
