---
name: 11ai-operator-jest-v30-flaky-tests
description: "Reproduce and fix nondeterministic Jest tests, covering repeat and randomized runs, order dependence from shared state and leaked mocks, real timers and unawaited promises, open handles that hang a suite, time zone and locale assumptions, concurrency between workers, and why retries hide a defect rather than fixing it. Use when a test passes locally and fails in the pipeline, when a suite fails only in a particular order, or when a run hangs or times out intermittently."
---
# 11ai Jest flaky tests

Version baseline: Jest 30.x, with 30.4.2 as the current stable release at this review. Inspect the installed patch, Node.js support, module system, test environment, and transformer compatibility before changing configuration.

A flaky test is a real defect — in the test, or in the code it exercises. The temptation is to retry it, which converts a visible problem into an invisible one and eventually hides a genuine race in production code. Reproduce it deliberately first; a bug you cannot reproduce, you cannot claim to have fixed.

## Reproduce deliberately

```bash
npx jest path/to/file.test.ts --runTestsByPath
for i in $(seq 1 20); do npx jest path/to/file.test.ts --silent || echo "FAILED on run $i"; done
npx jest --randomize
npx jest --randomize --seed=12345
npx jest --runInBand
npx jest --maxWorkers=1
```

Work through these to classify it:

- **Fails alone, repeatedly** — a genuine nondeterminism inside the test: real time, randomness, or an unawaited promise.
- **Passes alone, fails in the suite** — order dependence or shared state. `--randomize` with a recorded `--seed` makes the failing order repeatable.
- **Fails only with several workers** — a shared external resource: the same database rows, the same port, the same temporary path.
- **Fails only in the pipeline** — environment: a different time zone, locale, Node version, or a slower machine exposing a timing assumption.

Record the seed that reproduces it. Without a reproduction you are guessing.

## Fix order dependence and leaked state

```ts
afterEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
})
```

The usual sources, and what each looks like:

- **Module-level mutable state.** A cache or counter at module scope persists across tests in a file. Reset it in `beforeEach`, or restructure so it is created per test.
- **Leaked mock state.** Call history or a `mockImplementationOnce` from a previous test still queued. Use the project's configured cleanup rather than adding a second, competing one.
- **Shared fixtures.** One object mutated by several tests. Build it per test with a factory.
- **The module registry.** `jest.resetModules()` when a test depends on a fresh import.
- **Database or filesystem state.** Give each worker its own namespace using `process.env.JEST_WORKER_ID`, and clean up in `afterEach` rather than relying on the next test to overwrite.

```ts
const schema = `test_${process.env.JEST_WORKER_ID ?? "1"}`
const tmpdir = path.join(os.tmpdir(), `suite-${process.env.JEST_WORKER_ID}`)
```

Never fix order dependence by pinning the order. That preserves the coupling and it will break again when a test is added.

## Fix timing and asynchrony

```ts
await expect(promise).resolves.toEqual(expected)
expect(await getUser(id)).toMatchObject({ id })
await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument())
```

Rules that remove most timing flakiness:

- **Await everything.** An unawaited promise lets the test end before the assertion runs, so it passes — until the machine is slow enough that the rejection surfaces in the next test.
- **Never sleep a fixed duration.** `await new Promise(r => setTimeout(r, 100))` is a bet on machine speed. Wait for the condition instead.
- **Fake the clock** for anything time-dependent, and set a fixed system time so a date boundary cannot change the result.
- **Fix the time zone and locale** rather than asserting on local formatting. A test asserting a formatted date passes in one region and fails in another; set `TZ=UTC` and `LC_ALL=C` in the test environment.
- **Do not assert on wall-clock duration.** A shared runner is not a stopwatch.

```ts
jest.useFakeTimers().setSystemTime(new Date("2026-07-30T12:00:00Z"))
```

## Fix hangs and open handles

```bash
npx jest --detectOpenHandles --runInBand path/to/file.test.ts
npx jest --logHeapUsage
```

`--detectOpenHandles` names what is still holding the event loop: a server not closed, a database pool still open, an interval never cleared, a subscription still live. Close each one in `afterAll`, and prefer a teardown that returns a promise so the close is awaited.

```ts
afterAll(async () => {
  clearInterval(timer)
  await server.close()
  await pool.end()
})
```

`--forceExit` makes the symptom disappear while leaving the leak. Use it only as a temporary measure with the real cause recorded, never as the default.

## Do not paper over it

Adding a retry, raising a timeout, or marking the test `skip` each convert a signal into silence. A test that only passes on the second attempt is telling you the code under test has a race, and that race exists in production too.

If a test must be quarantined to unblock a release, say so explicitly: mark it, link the cause, and treat it as owed work rather than done work.

## Verify

```bash
for i in $(seq 1 50); do npx jest path/to/file.test.ts --silent || echo "FAILED on $i"; done
npx jest --randomize --seed=RECORDED_SEED
npx jest
```

The fix is proven when the previously failing seed passes, fifty consecutive runs pass, and the full suite passes with randomized order. One passing run proves nothing about a test that failed one time in twenty.

## Report

State the failing test, the reproduction — how many runs, which seed, how many workers, which environment — and the classification. Give the root cause in one sentence, the fix and why it removes the nondeterminism rather than hiding it, and the verification: consecutive runs, the recorded seed, and randomized order. Name anything quarantined and what remains owed. Say plainly if the flakiness revealed a race in production code rather than only in the test.
