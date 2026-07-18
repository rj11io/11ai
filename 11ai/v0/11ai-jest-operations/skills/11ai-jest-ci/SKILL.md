---
name: 11ai-jest-ci
description: "Design or verify deterministic Jest commands for CI, including non-interactive execution, coverage and JSON output, worker limits, project selection, retries, and sharding. Use when a Jest run behaves differently in CI or a pipeline needs a reliable test command."
---

# Jest in CI

Make CI terminate, use the repository's local dependencies, and produce enough
evidence to diagnose a failure. Start from the existing `test:ci` or pipeline
command; do not replace it with a generic `jest` command without checking its
config and environment.

## Baseline command

For a repository without a dedicated CI script, a common baseline is:

```sh
npm test -- --ci
```

Use the equivalent package-manager forwarding for Yarn, pnpm, or Bun. Add
`--coverage` only when coverage is part of the gate. Add `--json
--outputFile=<path>` when the pipeline consumes machine-readable results.

`--ci` changes snapshot behavior: new snapshots fail instead of being silently
written. Never add `--updateSnapshot` to the normal CI command.

## Resource and scale choices

- Prefer the default worker count first.
- Use `--maxWorkers=50%` or a repository-specific value when CI has limited
  CPU/memory or many jobs share a runner.
- Use `--runInBand` for a small suite or when debugging shared resources; it is
  slower and should not be a blanket fix.
- Use `--projects` or `--selectProjects` only when the repository config has
  named projects and the intended subset is explicit.
- Use `--shard=1/3`, `2/3`, and `3/3` only when the Jest version and configured
  test sequencer support sharding; each shard needs its own result and coverage
  handling.

## Failure evidence

Capture:

- Node, package manager, and Jest versions;
- the exact command, project, worker, and shard settings;
- test failure output and whether the failure is reproducible locally;
- coverage and reporter paths when enabled;
- open-handle, unhandled-rejection, or worker termination warnings.

Use `--detectOpenHandles` only as a focused diagnostic because it implies
serial execution and has a significant performance cost. Do not use
`--forceExit` to mask cleanup failures.

## Guardrails

- Do not add retries that turn a flaky test into a green but untrusted gate.
- Do not make CI interactive with `--watch` or `--watchAll`.
- Do not assume `CI=true` alone replaces Jest's `--ci` behavior in every
  version; check the project command and installed Jest help.
- Do not upload secrets, full environment dumps, or credential-helper output
  as test artifacts.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest configuration](https://jestjs.io/docs/configuration)
