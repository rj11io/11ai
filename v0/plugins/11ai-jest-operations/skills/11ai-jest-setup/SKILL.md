---
name: 11ai-jest-setup
description: "Install and configure Jest in a repository from zero, choosing a TypeScript transform such as ts-jest, Babel, or SWC, deciding between CommonJS and native ECMAScript modules, selecting the node or jsdom test environment, wiring setup files, module name mapping, and package scripts. Use when a project has no test runner yet, when Jest is installed but cannot parse or resolve the project's files, or when the user asks how to add Jest to an application or library."
---

# Jest setup

Jest's configuration is mostly a set of answers about the project it runs in: which module system, which transform, which environment, and which paths. Read those answers out of the repository before writing any config, because a guessed transform produces a syntax error on the first import rather than a helpful message.

## Read the project first

```bash
cat package.json
node -p "require('./package.json').type ?? 'commonjs'"
ls jest.config.* babel.config.* tsconfig.json .swcrc 2>/dev/null
npx tsc --showConfig 2>/dev/null | head -40
```

Record, because each one changes the configuration:

- the package manager, from the lockfile;
- whether `package.json` sets `"type": "module"`, which makes `.js` files native modules;
- TypeScript's `module`, `target`, `jsx`, `paths`, and `verbatimModuleSyntax` settings;
- whether the project already has Babel or SWC, which the transform should reuse rather than duplicate;
- whether tests touch the DOM, which decides the environment;
- the framework, since Next.js and similar tools ship their own Jest configuration helper.

## Choose the transform

One decision, and the rest follows:

- **The project already has Babel or SWC** — reuse it with `babel-jest` or `@swc/jest`. Fast, and there is one place where syntax is configured.
- **TypeScript with no existing transform, and type errors should fail tests** — use `ts-jest`.
- **TypeScript where speed matters more than type checking in tests** — use `@swc/jest`. Types are stripped, not checked, so keep `tsc --noEmit` in the pipeline.
- **The project is a framework app** — use that framework's Jest helper, which sets the transform, environment, and module mapping together.

Do not stack two transforms for the same file extension. Read [references/setup.md](references/setup.md) for the install commands and complete configuration for each of these paths, the native module setup, and the module-mapping patterns for path aliases and static assets.

## Configure and wire scripts

Write the smallest configuration that runs, then add to it only when something fails:

1. Set `testEnvironment` — `node` for a library or server, `jsdom` for anything rendering components. Install `jest-environment-jsdom` separately; it is no longer bundled.
2. Add the transform for the project's file types.
3. Map path aliases from `tsconfig.json` into `moduleNameMapper`, and map static asset imports to a stub.
4. Add a setup file only when something must run before every suite, such as Testing Library matchers.
5. Add scripts that the pipeline and contributors both use:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Keep the continuous integration flags out of `test` itself so `npm test` stays useful locally; `11ai-jest-ci` owns the pipeline command.

## Verify

```bash
npx jest --showConfig
npx jest --listTests
npm test
```

`--showConfig` prints the resolved configuration, which is how to confirm the transform and environment actually took effect rather than being overridden. `--listTests` proves the test match pattern finds the intended files — an empty list is a discovery problem, not a passing suite.

Then add one trivial passing test and one deliberately failing test, and confirm both behave, before writing real ones. A suite that reports success while matching zero files is the failure this step catches.

## Guardrails

- Do not install a dependency without saying which and why, and use the project's own package manager.
- Do not add a second config file when one already exists; `jest.config.js` and a `jest` key in `package.json` together are a silent conflict.
- Do not set `transformIgnorePatterns` to an empty array to fix one untransformed dependency. Name that dependency; transforming all of `node_modules` makes every run slow.
- Do not add `--forceExit` or `--detectOpenHandles` to the default script to make a hang go away. That is `11ai-jest-troubleshooting` work.
- Do not enable coverage thresholds during setup. Get the suite running first.
- Report the transform chosen and why, the environment, files created, dependencies added, and the output of `--listTests`. If tests run but fail on module resolution or syntax, hand off to `11ai-jest-troubleshooting`.
