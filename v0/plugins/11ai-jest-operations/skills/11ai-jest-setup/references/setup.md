# Jest setup reference

Check versions before copying anything here. Jest 28 removed bundled jsdom, Jest 29 changed the default snapshot format, and Jest 30 tightened module resolution.

```bash
npx jest --version
node -p "require('./package.json').type ?? 'commonjs'"
```

## Base install

```bash
npm install --save-dev jest
```

For a browser-like environment, the package is separate:

```bash
npm install --save-dev jest-environment-jsdom
```

## Path A: reuse existing Babel

Best when the project already has a Babel configuration.

```bash
npm install --save-dev babel-jest @babel/preset-env
```

```js
// babel.config.js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
}
```

`targets: { node: "current" }` compiles for the Node version running the tests rather than for browsers, which keeps output close to the real runtime.

`babel-jest` is applied by default when a Babel config exists, so no `transform` entry is needed.

## Path B: ts-jest, with type errors failing tests

```bash
npm install --save-dev ts-jest @types/jest
```

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
}
```

Type errors surface as test failures, which is the point. It is also the slowest option, since each file is type-checked. To keep the speed and lose the checking, set `isolatedModules` through the transform options, or move to SWC.

## Path C: SWC, fast, types stripped not checked

```bash
npm install --save-dev @swc/core @swc/jest
```

```js
// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true, decorators: true },
          transform: { react: { runtime: "automatic" } },
          target: "es2022",
        },
      },
    ],
  },
}
```

Types are erased without being checked, so keep a separate gate:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

## Path D: framework helper

Next.js supplies a helper that reads the project's config and sets the transform, environment, and asset handling:

```js
// jest.config.js
const nextJest = require("next/jest")

const createJestConfig = nextJest({ dir: "./" })

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
})
```

Use the helper rather than hand-writing an equivalent. It tracks the framework's own build settings across versions.

## Native ECMAScript modules

Needed when `package.json` has `"type": "module"` and no transform converts to CommonJS.

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  }
}
```

```js
// jest.config.js
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
}
```

Two consequences worth knowing before choosing this path:

- `jest.mock` is not available for native modules. Use `jest.unstable_mockModule` with a dynamic `import` after the mock is declared.
- The `moduleNameMapper` entry above strips the `.js` extension that TypeScript requires in relative import paths under `NodeNext` resolution.

Transforming to CommonJS is the lower-friction option unless the project genuinely needs native modules at test time.

## Environment

```js
module.exports = {
  testEnvironment: "node",
}
```

Use `node` for libraries, servers, and anything without DOM access. Use `jsdom` when a test renders components or touches `window`, `document`, or `localStorage`.

Per file, when only a few tests need the DOM:

```ts
/**
 * @jest-environment jsdom
 */
```

jsdom does not implement everything a browser does. `matchMedia`, `ResizeObserver`, `IntersectionObserver`, and `scrollTo` are the usual gaps, and they belong in a setup file rather than in each test:

```ts
// jest.setup.ts
import "@testing-library/jest-dom"

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
})

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```

```js
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}
```

`setupFiles` runs before the test framework is installed; `setupFilesAfterEnv` runs after, and is what matcher libraries need.

## Module name mapping

Path aliases from `tsconfig.json` must be repeated for Jest — it does not read them.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```js
module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg|webp|woff2?)$": "<rootDir>/test/file-mock.js",
  },
}
```

```js
// test/file-mock.js
module.exports = "test-file-stub"
```

```bash
npm install --save-dev identity-obj-proxy
```

A style import that is not mapped throws a syntax error on the CSS itself, which reads as a Jest bug and is a missing mapping.

For a project with many aliases, generate the mapping from `tsconfig.json` instead of maintaining two lists:

```js
const { pathsToModuleNameMapper } = require("ts-jest")
const { compilerOptions } = require("./tsconfig.json")

module.exports = {
  roots: ["<rootDir>"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
}
```

## Untransformed dependencies

A package published as native modules and not transformed produces `SyntaxError: Cannot use import statement outside a module` from inside `node_modules`.

By default Jest ignores `node_modules` for transforms. Name the exception rather than removing the rule:

```js
module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!(package-a|package-b|@scope/package-c)/)",
  ],
}
```

Setting `transformIgnorePatterns: []` transforms every dependency and makes every run several times slower. Add packages one at a time as errors name them.

## Test discovery

```js
module.exports = {
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{ts,tsx}",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],
}
```

Use either `testMatch` or `testRegex`, never both — Jest errors if both are set. Ignoring build output matters: a compiled copy of a test in `dist` runs as a second, stale suite.

## Monorepo projects

One runner, several configurations:

```js
// jest.config.js at the repository root
module.exports = {
  projects: [
    "<rootDir>/packages/api/jest.config.js",
    "<rootDir>/packages/web/jest.config.js",
  ],
}
```

```bash
npx jest --selectProjects api
```

Each project keeps its own environment and transform, so a server package can use `node` while a web package uses `jsdom`. Coverage aggregates across all of them.

## Verify

```bash
npx jest --showConfig
npx jest --listTests
npx jest --clearCache
npm test
```

`--showConfig` prints the resolved configuration, including the values Jest defaulted. `--listTests` prints the files that will run; an empty list means `testMatch` and the real file layout disagree.

Write two throwaway tests before real ones, and confirm each behaves:

```ts
// smoke.test.ts
test("passes", () => {
  expect(1 + 1).toBe(2)
})

test.skip("fails on purpose", () => {
  expect(true).toBe(false)
})
```

Remove `.skip` once, confirm the failure is reported, then delete the file. A suite that matches zero files reports success, and this is the check that catches it.
