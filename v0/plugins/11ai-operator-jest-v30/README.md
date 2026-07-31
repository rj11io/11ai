# 11ai Jest v30 operator

Seventeen standalone Jest 30 skills (current stable baseline `30.4.2`) for setting up Jest, inspecting Jest projects, running
focused tests, connecting Jest to the tools around it, and diagnosing common test
failures across JavaScript and TypeScript repositories.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-jest-v30-setup`](./skills/11ai-operator-jest-v30-setup/SKILL.md) | Installing Jest and choosing the transform, module system, environment, module mapping, and scripts |
| [`11ai-operator-jest-v30-environment`](./skills/11ai-operator-jest-v30-environment/SKILL.md) | Inspecting the package manager, Jest version, test scripts, config, and test environment |
| [`11ai-operator-jest-v30-integrations`](./skills/11ai-operator-jest-v30-integrations/SKILL.md) | Connecting Jest to Testing Library, request interception, containers, reporters, coverage services, and the debugger |
| [`11ai-operator-jest-v30-runner`](./skills/11ai-operator-jest-v30-runner/SKILL.md) | Running all, selected, related, changed, or named tests with the right argument forwarding |
| [`11ai-operator-jest-v30-watch`](./skills/11ai-operator-jest-v30-watch/SKILL.md) | Using interactive watch mode without accidentally turning it into a CI command |
| [`11ai-operator-jest-v30-coverage`](./skills/11ai-operator-jest-v30-coverage/SKILL.md) | Collecting, reading, and improving Jest coverage reports and thresholds |
| [`11ai-operator-jest-v30-snapshots`](./skills/11ai-operator-jest-v30-snapshots/SKILL.md) | Reviewing, updating, and diagnosing snapshot tests |
| [`11ai-operator-jest-v30-mocks`](./skills/11ai-operator-jest-v30-mocks/SKILL.md) | Creating spies and mocks, controlling implementations, and cleaning mock state |
| [`11ai-operator-jest-v30-async`](./skills/11ai-operator-jest-v30-async/SKILL.md) | Writing and repairing promise, callback, rejection, and timeout-aware tests |
| [`11ai-operator-jest-v30-timers`](./skills/11ai-operator-jest-v30-timers/SKILL.md) | Controlling fake timers and finding timer-related leaks or hangs |
| [`11ai-operator-jest-v30-config`](./skills/11ai-operator-jest-v30-config/SKILL.md) | Inspecting or making deliberate changes to Jest configuration |
| [`11ai-operator-jest-v30-ci`](./skills/11ai-operator-jest-v30-ci/SKILL.md) | Designing deterministic Jest commands for CI, reports, workers, and sharding |
| [`11ai-operator-jest-v30-test-authoring`](./skills/11ai-operator-jest-v30-test-authoring/SKILL.md) | Writing focused tests from a behavior contract and proving each one can fail |
| [`11ai-operator-jest-v30-flaky-tests`](./skills/11ai-operator-jest-v30-flaky-tests/SKILL.md) | Reproducing and fixing order-dependent, timing, and open-handle flakiness |
| [`11ai-operator-jest-v30-performance`](./skills/11ai-operator-jest-v30-performance/SKILL.md) | Measuring and reducing suite runtime, worker cost, and memory growth |
| [`11ai-operator-jest-v30-cheatsheet`](./skills/11ai-operator-jest-v30-cheatsheet/SKILL.md) | Looking up common Jest commands, flags, APIs, and decision rules |
| [`11ai-operator-jest-v30-troubleshooting`](./skills/11ai-operator-jest-v30-troubleshooting/SKILL.md) | Diagnosing discovery, transform, environment, mock, timeout, coverage, and exit failures |

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
