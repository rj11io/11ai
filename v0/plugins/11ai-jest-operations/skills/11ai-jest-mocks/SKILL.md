---
name: 11ai-jest-mocks
description: "Create and diagnose Jest mock functions, spies, module mocks, manual mocks, implementations, return values, and mock cleanup. Use when a test needs to isolate a dependency or fails because mock state or restoration is wrong."
---

# Jest mocks and spies

Mock the smallest boundary needed to test the behavior. Keep the real module
or implementation in play unless the dependency is slow, nondeterministic,
external, or outside the unit's contract.

## Choose the tool

```ts
const fn = jest.fn();
const spy = jest.spyOn(object, "method");
jest.mock("../client");
```

- `jest.fn()` creates a callable mock and records calls, results, instances,
  contexts, and last call.
- `jest.spyOn()` wraps an existing method and can be restored to the original.
- `jest.mock()` replaces a module according to Jest's module-mocking rules;
  inspect import order and module system when it does not take effect.
- A manual mock lives in a `__mocks__` directory and should represent the
  stable boundary, not a second copy of the implementation.

Configure behavior narrowly:

```ts
fn.mockReturnValue(value);
fn.mockResolvedValue(value);
fn.mockRejectedValue(error);
fn.mockImplementationOnce(() => first).mockImplementationOnce(() => second);
spy.mockRestore();
```

## Keep state isolated

Know the difference before choosing cleanup:

| Operation | Effect |
| --- | --- |
| `jest.clearAllMocks()` / `clearMocks` | clears calls, instances, contexts, and results; keeps implementation |
| `jest.resetAllMocks()` / `resetMocks` | clears state and replaces mocks with empty implementations |
| `jest.restoreAllMocks()` / `restoreMocks` | restores original implementations for spies/replaced properties |

Use `afterEach` cleanup when the repository does not already configure it.
Never add both global flags and duplicate cleanup without understanding the
project's convention.

## Diagnose a mock failure

1. Verify the mock path is the same module specifier the code imports.
2. Check whether the mock is declared before the import under the project's
   module system and hoisting rules.
3. Confirm the test is asserting the correct call, argument, result, or
   rejection, rather than an implementation detail.
4. Check for leaked call history or a mock implementation from a prior test.
5. Restore spies and real implementations in teardown.

For TypeScript, use the repository's established Jest typing pattern. In Jest
30 examples, explicit imports such as
`import {expect, jest, test} from '@jest/globals'` are needed when globals are
not injected.

## Guardrails

- Do not mock the module under test.
- Do not use `mockReset` when the test still needs the configured implementation.
- Do not use `mockRestore` as a general reset for a bare `jest.fn()`; it only
  restores original implementations for spies/replaced properties.
- Do not add a manual mock, module-mapper rule, or global auto-mock setting
  without showing its project-wide effect.

## References

- [Jest mock functions](https://jestjs.io/docs/mock-functions)
- [Jest mock function API](https://jestjs.io/docs/mock-function-api)
- [Jest manual mocks](https://jestjs.io/docs/manual-mocks)
