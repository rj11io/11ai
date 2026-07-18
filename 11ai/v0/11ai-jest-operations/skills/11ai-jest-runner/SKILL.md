---
name: 11ai-jest-runner
description: "Run Jest tests at the right scope: the full suite, an exact file, a file pattern, a test name, changed files, related tests, or only previous failures. Use when the user wants to execute, narrow, reproduce, or verify Jest tests without changing test code."
---

# Jest test runner

Choose the smallest test scope that answers the user's question, then run it
through the repository's package-manager script or local Jest binary.

## Choose the command

First inspect `package.json`, the lockfile, and the relevant Jest config. Use
the project's existing test script whenever it sets environment variables,
projects, transforms, or setup. Forward Jest arguments correctly:

```sh
npm test -- <jest args>
yarn test <jest args>
pnpm test <jest args>
bun run test <jest args>
```

If there is no suitable script, use the local binary with the detected package
manager, such as `npm exec -- jest` or `pnpm exec jest`.

| Need | Jest selector |
| --- | --- |
| Full suite | no selector |
| Known exact test file | `--runTestsByPath path/to/file.test.ts` |
| File path pattern | quote a file regex, or use the configured test path option |
| Tests by `describe`/`test` name | `--testNamePattern="name"` or `-t "name"` |
| Tests related to changed source files | `--findRelatedTests src/a.ts src/b.ts` |
| Tests affected by repository changes | `--onlyChanged` or `-o` |
| Tests from the previous failing run | `--onlyFailures` or `-f` |
| See files without executing them | `--listTests` |
| See registered tests without running test bodies | `--collectTests` when supported |

Use `--runInBand` only when debugging shared state, worker behavior, or a
resource that cannot be used concurrently. Prefer `--maxWorkers=<n>` or a
percentage when the issue is machine capacity.

## Run and verify

1. State the exact command and scope before running it.
2. Run the command without unrelated flags first.
3. If it fails, preserve the first meaningful failure and classify it as
   discovery, transform, assertion, environment, timeout, or process cleanup.
4. For a focused run that passes, run the broader relevant suite when the user
   asked for regression confidence.
5. Report pass/fail, files and tests executed, duration if useful, and any
   warnings such as open handles or skipped tests.

## Common forwarding mistakes

- `npm test -- -t "name"` passes `-t` to Jest; `npm test -t "name"` may not.
- A path argument without `--runTestsByPath` is treated as a regex and may
  match more or fewer files than expected.
- `--testNamePattern` matches the full name, including surrounding `describe`
  blocks.
- A script can select a different Jest project than a direct `jest` command;
  keep the script when that distinction matters.

## Guardrails

- Do not edit tests, snapshots, config, or dependencies while running tests.
- Do not add `--forceExit` to make a failure look green. Diagnose open handles
  with the troubleshooting skill first.
- Do not call a zero-test run successful unless the repository intentionally
  allows no tests or the user explicitly requested discovery only.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest getting started](https://jestjs.io/docs/getting-started)
