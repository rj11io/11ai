---
name: 11ai-jest-timers
description: "Control Jest fake timers and diagnose timer-driven tests, intervals, polling, debounced work, and timer leaks. Use when time-dependent tests are slow, flaky, stuck, or need deterministic advancement without sleeping."
---

# Jest fake timers

Use fake timers to make scheduled work deterministic, and always restore real
timers. Match the timer API to the test's contract rather than advancing an
arbitrary amount of time.

## Basic pattern

```ts
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test("debounces a search", () => {
  const callback = jest.fn();
  scheduleDebounced(callback, 300);

  expect(callback).not.toHaveBeenCalled();
  jest.advanceTimersByTime(299);
  expect(callback).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
});
```

## Choose the clock operation

- `jest.advanceTimersByTime(ms)` advances a known duration.
- `jest.runOnlyPendingTimers()` drains currently scheduled work without
  recursively creating an infinite timer chain.
- `jest.runAllTimers()` drains all reachable timers; use carefully with
  intervals or recursive scheduling.
- `jest.runAllTicks()` handles queued microtasks when the installed Jest
  version and test need it.
- `jest.useRealTimers()` restores the native clock and timer APIs.

For async timer APIs, use the corresponding async timer helpers supported by
the installed version and `await` them. Do not insert `setTimeout` sleeps to
wait for code that the test can drive directly.

## Diagnose timer failures

1. Confirm fake timers are enabled before the code schedules the timer.
2. Identify whether the work is a timeout, interval, microtask, animation
   frame, or a library-specific scheduler.
3. Advance exactly enough time to trigger the behavior.
4. Flush pending work and restore real timers in teardown.
5. Run the test alone and in the suite; a timer leak often appears only after
   another test changes the global clock.

Some libraries capture timer functions at import time. If fake timers appear
ineffective, inspect import order and the library's documented Jest setup
before changing the implementation.

## Guardrails

- Do not mix real and fake time in one test without an explicit transition.
- Do not call `runAllTimers` against an intentionally infinite interval.
- Do not leave fake timers enabled across tests.
- Do not raise Jest's timeout to compensate for code that never advances its
  fake clock.

## References

- [Jest timer mocks](https://jestjs.io/docs/timer-mocks)
- [Jest object timer APIs](https://jestjs.io/docs/jest-object)
