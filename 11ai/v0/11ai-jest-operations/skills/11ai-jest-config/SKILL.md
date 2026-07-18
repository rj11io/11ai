---
name: 11ai-jest-config
description: "Inspect and make deliberate, minimal changes to Jest configuration for discovery, environments, transforms, module mapping, setup files, projects, coverage, and mock isolation. Use when Jest cannot find tests or modules, uses the wrong environment, or needs an explicit config change."
---

# Jest configuration

Resolve the active configuration before editing it. Jest can receive options
from a config file, a `jest` field in `package.json`, a workspace project, a
test script, or CLI flags; CLI options take precedence over configuration.

## Inspect first

Locate `jest.config.js`, `.cjs`, `.mjs`, `.ts`, or a `jest` package field, then
check package scripts for `--config`, `--projects`, environment variables, and
inline flags. Run:

```sh
<project-test-command> --showConfig
```

Record the effective values relevant to the problem:

- `rootDir`, `roots`, `projects`, `testMatch`, `testRegex`, and ignore patterns;
- `testEnvironment` and `testEnvironmentOptions`;
- `transform`, `transformIgnorePatterns`, and module format;
- `moduleNameMapper`, `moduleDirectories`, and `modulePaths`;
- `setupFiles`, `setupFilesAfterEnv`, and `globalSetup`/`globalTeardown`;
- `clearMocks`, `resetMocks`, `restoreMocks`, and `testTimeout`;
- coverage provider, collection globs, thresholds, and reporters.

Use `--listTests` after discovery changes to prove which files Jest selects.

## Minimal change workflow

1. State the observed failure and the config value that controls it.
2. Make the smallest change in the repository's established config format.
3. Preserve CommonJS/ESM/TypeScript conventions and existing comments.
4. Run `--showConfig`, `--listTests`, the focused failing test, and the relevant
   suite.
5. Show the diff and explain why the change is scoped correctly.

Common mapping rules:

- Test discovery problems: check `rootDir`, `roots`, `testMatch`, and ignores
  before adding a second test pattern.
- `document is not defined`: verify whether `jsdom` is actually installed and
  whether the test should use `node` or a file-level environment override.
- `Cannot use import statement outside a module`: inspect the package module
  type, transform, and Jest's ESM setup; do not add a random Babel preset.
- Path aliases: align `moduleNameMapper` with the compiler/bundler aliases and
  test the mapping with a real import.
- Shared setup: prefer `setupFilesAfterEnv` for matcher/lifecycle extensions;
  do not put test code that needs mocks in a setup file without checking Jest's
  setup import behavior.

## Guardrails

- Never replace the whole config with a minimal example when the repository has
  existing projects, reporters, transforms, or setup.
- Never add a package or change module format without explicit user approval.
- Do not use `--config` in a one-off command as a permanent fix unless the user
  requested a command-only workaround.
- Do not weaken `testPathIgnorePatterns` or coverage thresholds to hide a
  discovery or quality problem.

## References

- [Jest configuration](https://jestjs.io/docs/configuration)
- [Jest code transformation](https://jestjs.io/docs/code-transformation)
- [Jest ECMAScript modules](https://jestjs.io/docs/ecmascript-modules)
