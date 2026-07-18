---
name: 11ai-jest-cheatsheet
description: "Answer quick Jest command, flag, API, configuration, and test-isolation questions from a version-aware reference. Use when the user asks how to run, target, mock, snapshot, time, cover, configure, or troubleshoot a common Jest operation."
---

# Jest cheatsheet

Use this as a quick lookup, but inspect the project's Jest version and script
before presenting a command as executable. Prefer the project's package
manager and test script; replace `<test>` with that script.

## Commands

```sh
<test>                         # full suite
<test> -- --runInBand          # serial execution
<test> -- path/to/a.test.ts    # path or regex selection
<test> -- --runTestsByPath path/to/a.test.ts
<test> -- -t "name"            # test name, including describe names
<test> -- --findRelatedTests src/a.ts
<test> -- --onlyChanged         # changed-file dependency graph
<test> -- --onlyFailures        # failures from the previous run
<test> -- --listTests           # discovered test files only
<test> -- --showConfig          # resolved config only
<test> -- --watch               # interactive changed-test watch
<test> -- --watchAll            # interactive full-suite watch
<test> -- --coverage            # coverage report
<test> -- --ci                  # non-interactive CI semantics
<test> -- --clearCache          # clear Jest cache, then exit
<test> -- --detectOpenHandles   # focused hang diagnosis
```

The `--` separator is required by npm and may be unnecessary for other
package managers. Use `jest --help` for flags introduced or renamed in the
installed version.

## Test APIs

```ts
test("works", () => {
  expect(value).toBe(expected);
  expect(object).toEqual(expectedShape);
  expect(fn).toHaveBeenCalledWith(arg);
});

test("async result", async () => {
  await expect(promise).resolves.toEqual(value);
  await expect(rejectedPromise).rejects.toThrow("message");
});

const mock = jest.fn().mockResolvedValue(value);
const spy = jest.spyOn(object, "method");
```

For async tests, return or await the promise. For rejection tests, use
`expect.assertions` when a missing rejection could otherwise skip assertions.

## Mock cleanup

```ts
jest.clearAllMocks();    // calls/results, keeps implementation
jest.resetAllMocks();    // clears and removes mock implementations
jest.restoreAllMocks();  // restores spies/replaced properties
```

Use `afterEach` or the matching config flag, not an unexplained mixture.

## Timers and snapshots

```ts
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.runOnlyPendingTimers();
jest.useRealTimers();
```

```sh
<test> -- -u                 # update snapshots only after reviewing a diff
<test> -- -t "one test" -u   # keep the update narrow
```

## Fast decision rules

- “No tests found” → inspect `--showConfig`, `--listTests`, `rootDir`, and
  `testMatch` before changing patterns.
- “Cannot use import” → inspect module type and transform; do not add a random
  transformer.
- “document is not defined” → verify the intended `testEnvironment` and its
  installed package.
- Test hangs → verify returned/awaited work, pending timers, servers, sockets,
  workers, and open handles before considering `--forceExit`.
- Snapshot diff → run without `-u`, classify the change, then update only with
  explicit intent.
- Flaky order → isolate the test, use a seed when supported, and find leaked
  state rather than adding retries.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest expect](https://jestjs.io/docs/expect)
- [Jest mock functions](https://jestjs.io/docs/mock-functions)
- [Jest snapshot testing](https://jestjs.io/docs/snapshot-testing)
