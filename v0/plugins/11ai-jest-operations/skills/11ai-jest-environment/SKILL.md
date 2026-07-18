---
name: 11ai-jest-environment
description: "Inspect a repository's Jest installation, package manager, test scripts, configuration, test environment, and project layout before another Jest operation. Use when Jest is missing, the active config is unclear, a command behaves differently from expectation, or you need a safe baseline without changing files."
---

# Jest environment inspection

Build a factual map of the project's Jest setup before changing or running
anything. This skill is read-only unless the user explicitly asks to repair the
environment.

## Inspection workflow

1. Establish the project root. Look for `package.json`, lockfiles, workspace
   declarations, and the nearest repository instructions. Do not assume the
   current directory is the package that owns the tests.
2. Identify the package manager from the lockfile and package metadata:
   `package-lock.json` → npm, `yarn.lock` → Yarn, `pnpm-lock.yaml` → pnpm,
   `bun.lock` or `bun.lockb` → Bun. In a workspace, identify the package that
   owns the test file and its root command.
3. Read the relevant `package.json` scripts and dev dependencies. Prefer the
   existing `test`, `test:watch`, `test:ci`, or package-specific script over an
   invented direct command.
4. Check the installed Jest version through the project runner:

   ```sh
   npm exec -- jest --version
   # or: yarn jest --version
   # or: pnpm exec jest --version
   # or: bunx jest --version
   ```

   If the command cannot resolve Jest, report the package and version evidence;
   do not install it unless asked.
5. Locate configuration without guessing which file wins. Check `jest.config.*`,
   a `jest` field in `package.json`, workspace project configs, and script-level
   `--config` flags. Then use `jest --showConfig` through the project runner to
   inspect the resolved configuration.
6. Record the effective `rootDir`, `testMatch` or `testRegex`, ignored paths,
   `testEnvironment`, `transform`, `moduleNameMapper`, setup files, projects,
   coverage settings, and mock-reset settings.
7. List likely test files and confirm discovery with:

   ```sh
   <project-jest-command> --listTests
   ```

   Use `--collectTests` when the installed Jest version supports it and test
   names, not only file paths, need to be inspected.

## Report format

Return a compact environment report containing:

- project/package root and package manager;
- Node and Jest versions;
- the script used to invoke tests;
- config source and effective values that affect the request;
- discovered test count or representative paths;
- the smallest next command for the user's task;
- any uncertainty, such as a workspace boundary or an unresolved transform.

## Guardrails

- Never edit `package.json`, lockfiles, Jest config, setup files, or test files
  as part of inspection.
- Never treat a missing local Jest binary as permission to use a global binary;
  global Jest can use a different version and config.
- If a script chains other tools, show the complete script and explain where
  Jest arguments must be inserted.

## References

- [Jest CLI options](https://jestjs.io/docs/cli)
- [Jest configuration](https://jestjs.io/docs/configuration)
