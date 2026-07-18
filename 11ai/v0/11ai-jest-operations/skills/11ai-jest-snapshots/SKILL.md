---
name: 11ai-jest-snapshots
description: "Review, update, and troubleshoot Jest snapshot tests with a narrow test scope and explicit approval for snapshot file changes. Use when snapshots fail, a snapshot needs intentional regeneration, or the user asks how to inspect snapshot differences."
---

# Jest snapshots

Treat a snapshot as a versioned assertion. A snapshot update is a file change,
not a harmless cleanup: inspect the diff and confirm that the new output is
intentional.

## Diagnose before updating

1. Run the smallest failing suite or test name without `-u`.
2. Read the received-versus-written diff and identify whether the change comes
   from behavior, data, ordering, environment, time, randomness, or formatting.
3. Inspect the test and the snapshot location (`__snapshots__` or inline).
4. Decide whether the expected behavior changed. If not, fix the test setup or
   product code rather than updating the snapshot.

## Update intentionally

Only after the user approves the expected change, run a scoped update:

```sh
<project-test-command> path/to/file.test.ts --updateSnapshot
<project-test-command> -t "specific test name" -u
```

Review every changed `.snap` file and inline snapshot diff. Then run the same
suite without `-u`, followed by the broader relevant suite. Keep unrelated
snapshot churn out of the change.

In CI, new or changed snapshots should be reviewed as a code change. Do not
make CI silently accept snapshots by adding `-u` to the normal CI command.

## Reduce noisy snapshots

Prefer explicit assertions for unstable or very large output. Use property
matchers for dynamic fields such as IDs or timestamps, and normalize data in
test setup when the normalized form is the intended contract. Do not mask real
behavior changes with broad serializers or indiscriminate replacement.

## Guardrails

- Never run `--updateSnapshot` as a first response to a failure.
- Never update all snapshots when one test or file is enough.
- Check for time, locale, timezone, random seed, and unordered collection
  differences before blaming Jest.
- Preserve the repository's snapshot formatting and serializer configuration.

## References

- [Jest snapshot testing](https://jestjs.io/docs/snapshot-testing)
- [Jest CLI options](https://jestjs.io/docs/cli)
