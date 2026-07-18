---
name: 11ai-jest-async
description: "Write and repair Jest tests for promises, async functions, callbacks, rejected errors, assertion counts, and test timeouts. Use when an async test passes too early, hangs, reports an unhandled rejection, or needs a reliable success and failure path."
---

# Jest asynchronous tests

Make the test return or await the asynchronous work and assert the failure
path explicitly. A test that finishes before its promise or callback runs is a
false positive even when Jest reports it as passed.

## Promise and async/await forms

```ts
test("resolves with a user", async () => {
  await expect(loadUser()).resolves.toMatchObject({ id: "u1" });
});

test("rejects for an unknown user", async () => {
  await expect(loadUser("missing")).rejects.toThrow("not found");
});
```

Equivalent direct assertions must `return` the promise:

```ts
test("returns data", () => {
  return fetchData().then((data) => expect(data).toEqual(expected));
});
```

When a test expects a rejection or callback assertion, use
`expect.assertions(1)` or `expect.hasAssertions()` so a missing error path
cannot pass without running the assertion.

## Callback form

Use the `done` callback only for APIs that genuinely use callbacks:

```ts
test("reads a file", (done) => {
  readFile((error, value) => {
    try {
      expect(error).toBeNull();
      expect(value).toBe("ok");
      done();
    } catch (assertionError) {
      done(assertionError);
    }
  });
});
```

Do not combine `done` with `async` or a returned promise. That creates two
completion signals and often causes a timeout or confusing failure.

## Diagnose a hang or false pass

1. Find the first async boundary and check that the test awaits, returns, or
   calls `done` exactly once.
2. Check rejected promises and callback errors are asserted.
3. Check fake timers, polling, retries, and network mocks; hand timer work to
   `11ai-jest-timers`.
4. Run the focused test with a useful timeout only while diagnosing. Fix the
   missing completion or cleanup instead of raising the global timeout.
5. Run the test twice and then the relevant suite to catch leaked state.

## Guardrails

- Do not add `--forceExit` to hide unfinished async work.
- Do not increase `testTimeout` globally for one slow or stuck test.
- Do not leave real network requests, servers, files, or timers open after the
  test; clean them in the appropriate lifecycle hook.

## References

- [Testing asynchronous code](https://jestjs.io/docs/asynchronous)
- [Jest timer mocks](https://jestjs.io/docs/timer-mocks)
