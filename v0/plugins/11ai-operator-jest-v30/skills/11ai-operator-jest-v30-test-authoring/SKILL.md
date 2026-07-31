---
name: 11ai-operator-jest-v30-test-authoring
description: "Write focused Jest tests from an existing behavior contract, covering deriving cases from the contract rather than the implementation, naming and arranging a test, table-driven cases, choosing the right assertion, boundary and error paths, what to stub and what to leave real, and proving a test can fail. Use when new tests must be added for existing behavior, when a bug needs a regression test, or when a suite passes without actually checking anything."
---
# 11ai Jest test authoring

Version baseline: Jest 30.x, with 30.4.2 as the current stable release at this review. Inspect the installed patch, Node.js support, module system, test environment, and transformer compatibility before changing configuration.

A test earns its place by failing when the behavior breaks. The most common defect in a test suite is not a wrong assertion — it is a test that cannot fail: it asserts on a stub, it awaits nothing, or it checks a value it just set. Derive cases from the contract, then prove each one fails against broken code.

## Derive cases from the contract, not the code

```bash
npx jest --listTests
ls **/__tests__ **/*.test.* 2>/dev/null | head
```

Read the function's signature, its documented behavior, and its callers. Write the case list before opening the implementation, because a list derived from the code tests what the code does — including its bugs — rather than what it should do.

For each unit, cover:

- **The happy path**, with realistic values rather than `"foo"`.
- **Boundaries** — empty, one, many; zero and negative; the first and last valid value.
- **Invalid input** — wrong type, missing required field, malformed string.
- **Error paths** — what it throws or returns when a dependency fails.
- **Documented edge cases**, including anything a comment warns about.

Skip cases the type system already prevents. A test asserting that a TypeScript function rejects a number where it takes a string tests the compiler.

For a regression test, write the failing case first, confirm it fails for the reported reason, then fix the code. A regression test written after the fix often passes for the wrong reason.

## Arrange, act, assert

```ts
import { describe, expect, test } from "@jest/globals"
import { parseDuration } from "../parse-duration"

describe("parseDuration", () => {
  test("converts a minutes value to milliseconds", () => {
    const result = parseDuration("5m")
    expect(result).toBe(300_000)
  })

  test("throws on a missing unit", () => {
    expect(() => parseDuration("5")).toThrow(/unit/i)
  })
})
```

Name the test after the behavior, not the function: "converts a minutes value to milliseconds" tells a reader what broke when it fails; "parseDuration works" does not.

Keep one behavior per test. A test asserting six unrelated things reports only the first failure and hides the rest.

Build fixtures inside the test or a factory rather than sharing mutable state across tests. Shared state is where order dependence comes from.

## Use table-driven cases for variations

```ts
test.each([
  ["5m", 300_000],
  ["1h", 3_600_000],
  ["90s", 90_000],
  ["0m", 0],
])("parses %s as %i ms", (input, expected) => {
  expect(parseDuration(input)).toBe(expected)
})

test.each([
  ["", /empty/i],
  ["5", /unit/i],
  ["-5m", /negative/i],
  ["abc", /invalid/i],
])("rejects %p", (input, message) => {
  expect(() => parseDuration(input)).toThrow(message)
})
```

A table keeps the cases visible and makes an added case one line. Each row reports as its own test, so a failure names the exact input.

## Choose assertions that can fail meaningfully

```ts
expect(value).toBe(3)
expect(object).toEqual({ id: "1", name: "Ada" })
expect(object).toMatchObject({ name: "Ada" })
expect(list).toHaveLength(2)
expect(list).toContainEqual({ id: "1" })
expect(fn).toHaveBeenCalledWith("expected-arg")
await expect(promise).rejects.toThrow(/not found/)
await expect(promise).resolves.toEqual({ ok: true })
```

Points that decide whether an assertion is worth anything:

- `toBe` for primitives and identity; `toEqual` for structural equality. `toBe` on two equivalent objects always fails.
- `toEqual` over `toMatchObject` when the whole shape matters — `toMatchObject` passes while ignoring extra fields, which lets an accidentally leaked field through.
- Assert on the *value*, not on truthiness. `expect(result).toBeTruthy()` passes for almost anything.
- `await` every promise assertion, and use `rejects`/`resolves`. A forgotten `await` makes the test pass regardless.
- Match errors by message pattern or type, not by asserting merely that something threw.
- Avoid a snapshot as the only assertion for logic. A snapshot records what happened, not what should.

## Stub the boundary, not the neighbour

Stub what the unit does not own: the network, the clock, randomness, the filesystem. Leave real anything that is part of the behavior under test — stubbing the module next door means the test passes while the two disagree.

```ts
jest.useFakeTimers().setSystemTime(new Date("2026-07-30T12:00:00Z"))
```

Fix time rather than asserting on `Date.now()`, or the test fails at a month boundary.

If a unit is hard to test without stubbing half the codebase, that is a design signal. Say so rather than building an elaborate stub scaffold.

## Prove each test can fail

```bash
npx jest path/to/file.test.ts
npx jest path/to/file.test.ts --coverage --collectCoverageFrom='src/parse-duration.ts'
```

For every new test, break the implementation once — flip a comparison, return early, remove the validation — and confirm the test fails with a message that names the problem. Then restore it. A test that passes against broken code is worse than no test, because it reports safety that is not there.

Run the file twice in a row, and with `--randomize`, to catch state leaking between tests.

## Report

State the unit under test and where its contract came from, the case list with which cases cover happy path, boundaries, invalid input, and errors; what was stubbed and why each is a real boundary; the assertions chosen; the deliberate-failure check for each test with the message it produced; and the repeat and randomized run results. Name any behavior you chose not to test and why.
