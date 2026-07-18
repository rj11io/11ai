---
name: 11ai-jest-troubleshooting
description: "Diagnose Jest failures systematically across test discovery, transforms, ESM and TypeScript, environments, module mocks, async work, timers, snapshots, coverage, workers, and open handles. Use when a Jest command fails, hangs, flakes, or behaves differently locally and in CI."
---

# Jest troubleshooting

Reduce the failure to the smallest reproducible command, inspect the resolved
configuration, and change one cause at a time. Do not jump to a configuration
rewrite or `--forceExit`.

## Triage loop

1. Capture the exact command, working directory, package manager, Node version,
   Jest version, and whether the failure is local or CI-only.
2. Run the smallest affected file or test name without extra flags.
3. Inspect `--showConfig` and `--listTests` before changing discovery,
   transforms, environments, or aliases.
4. Classify the first meaningful failure using the table below.
5. Make the smallest justified fix, rerun the focused test, then rerun the
   relevant suite and the repository's normal gate.

## Symptom map

| Symptom | Inspect first | Typical next move |
| --- | --- | --- |
| `No tests found` | `rootDir`, `roots`, `testMatch`, ignores, path spelling | prove selection with `--listTests`; change patterns only if the intended layout is clear |
| `Cannot find module` | import specifier, `moduleNameMapper`, package boundary, transform | compare runtime and Jest aliases; verify the dependency is installed in this workspace |
| `Cannot use import statement` | package module type, ESM config, transform, file extension | align module mode and transformer; use the repository's documented ESM/TS path |
| `Unexpected token` | transformed file, `transformIgnorePatterns`, syntax target | identify which package/file is untransformed before editing the transform |
| `document is not defined` | effective `testEnvironment`, jsdom availability | use a file-level or project-level environment only when the test needs DOM APIs |
| mock not applied | module specifier, import order, hoisting, ESM behavior | inspect the mocking model and use the smallest stable boundary |
| test passes alone but fails in suite | leaked mocks, timers, globals, files, ports, order | isolate teardown; run the test around the suspected neighbor |
| async timeout | returned/awaited promise, `done`, rejection path, external resource | fix completion and cleanup; use a local timeout only as diagnosis |
| snapshot mismatch | data/time/locale/order/serializer and behavior diff | fix instability or behavior; update narrowly only when expected |
| coverage threshold failure | scope, `collectCoverageFrom`, exclusions, exact metric | inspect uncovered behavior and threshold policy |
| worker crash or memory pressure | worker count, heap, test isolation, native dependency | try a diagnostic serial run, then fix capacity or leaks rather than masking |
| Jest does not exit | timers, servers, sockets, child processes, handles | use `--detectOpenHandles`, inspect teardown, and remove the owner |

## Useful probes

```sh
<project-test-command> --showConfig
<project-test-command> --listTests
<project-test-command> --runInBand path/to/file.test.ts
<project-test-command> --detectOpenHandles path/to/file.test.ts
<project-test-command> --logHeapUsage --runInBand path/to/file.test.ts
```

Use `--detectOpenHandles` and `--logHeapUsage` only for focused diagnosis.
They alter runtime characteristics and can make a suite slower.

## Common false fixes

- `--forceExit` hides the resource owner and can lose asynchronous work.
- `--runInBand` can avoid a worker symptom without fixing shared state or
  memory pressure.
- Increasing `testTimeout` can hide a promise that is never completed.
- Adding `babel-jest`, `ts-jest`, or a mapper without checking the installed
  stack can create a second incompatible transform path.
- Updating snapshots can turn a behavior regression into an accepted fixture.
- Lowering coverage thresholds removes evidence rather than fixing coverage.

## Completion report

State the original symptom, the proven cause, the exact files or config
changed, the focused command, the broader verification command, and any
remaining caveat. If the cause is environmental or requires credentials,
report the blocker and the next human action instead of inventing a fix.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest configuration](https://jestjs.io/docs/configuration)
- [Jest code transformation](https://jestjs.io/docs/code-transformation)
- [Jest ECMAScript modules](https://jestjs.io/docs/ecmascript-modules)
- [Testing asynchronous code](https://jestjs.io/docs/asynchronous)
