---
name: 11ai-operator-jest-v30-performance
description: "Diagnose and reduce Jest suite runtime and memory use, covering per-file timing, worker count and its tradeoffs, transform and cache costs, the environment choice, module resolution and barrel imports, heavy setup files, memory growth between files, sharding across machines, and measuring before and after each change. Use when a suite takes too long, when a run exhausts memory, or when the pipeline test step dominates build time."
---
# 11ai Jest performance

Version baseline: Jest 30.x, with 30.4.2 as the current stable release at this review. Inspect the installed patch, Node.js support, module system, test environment, and transformer compatibility before changing configuration.

Measure before changing anything. Jest suites are slow for a handful of specific reasons, and each has a different fix — guessing usually leads to raising the worker count, which on a constrained machine makes it slower.

## Measure first

```bash
npx jest --silent 2>&1 | tail -5
time npx jest --silent
npx jest --listTests | wc -l
npx jest --silent --logHeapUsage 2>&1 | tail -20
node -e "console.log(require('node:os').cpus().length, 'cores')"
```

Find the slowest files rather than the slowest total:

```bash
npx jest --silent --json --outputFile=/tmp/jest-results.json >/dev/null 2>&1
node -e '
  const r = require("/tmp/jest-results.json");
  r.testResults
    .map(t => ({ file: t.name.split("/").slice(-2).join("/"), ms: t.endTime - t.startTime }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 15)
    .forEach(t => console.log(String(t.ms).padStart(7), t.file));
'
```

Read the distribution. A few files dominating means those files are the problem; every file taking a second or two means the per-file overhead is — transform, setup, or environment.

Separate the two costs:

```bash
npx jest --silent --onlyChanged
npx jest --clearCache && time npx jest --silent
time npx jest --silent
```

A cold run far slower than a warm one means transform cost. If both are equally slow, the time is in the tests themselves.

## Fix per-file overhead

This is usually the largest win, because it multiplies across every file.

- **Use the `node` environment where the DOM is not needed.** `jsdom` builds a document per file and costs meaningful time. Set `testEnvironment: "node"` as the default and opt into `jsdom` per file with a docblock.
- **Trim the setup file.** `setupFilesAfterEnv` runs before *every* file. Importing a matcher library is cheap; importing the application's whole module graph or connecting to a database is not. Move per-suite work into the suites that need it.
- **Reduce transform cost.** `ts-jest` type-checks every file; SWC or Babel strip types without checking. Moving to SWC and keeping `tsc --noEmit` as a separate step is often the single biggest improvement.
- **Do not transform all of `node_modules`.** `transformIgnorePatterns: []` transforms every dependency on every cold run. Name the specific packages that need it.
- **Avoid barrel imports in tests.** Importing from an `index.ts` that re-exports a hundred modules loads all of them. Import the module directly.

```js
module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.(t|j)sx?$": ["@swc/jest", {}] },
  transformIgnorePatterns: ["node_modules/(?!(package-a|package-b)/)"],
}
```

## Set the worker count deliberately

```bash
time npx jest --silent --maxWorkers=50%
time npx jest --silent --maxWorkers=4
time npx jest --silent --runInBand
```

Each worker is a Node process with its own module registry, so workers cost memory and startup time as well as providing parallelism. The right number depends on the machine:

- **Locally**, `--maxWorkers=50%` leaves cores for everything else.
- **In a pipeline container**, Jest often sees the host's core count rather than the container's limit and starts too many workers, which thrashes. Set it explicitly — commonly `--maxWorkers=2` on a two-core runner.
- **For a small suite**, `--runInBand` can be fastest because it skips worker startup entirely.

Measure all three rather than assuming more is faster.

## Fix memory growth

```bash
npx jest --silent --logHeapUsage 2>&1 | tail -20
npx jest --silent --workerIdleMemoryLimit=512MB
node --expose-gc node_modules/.bin/jest --silent --logHeapUsage --runInBand
```

Heap rising steadily across files in one worker is a leak: a module-level cache accumulating, listeners never removed, or a connection pool per file that is never closed. Close resources in `afterAll`, and reset module-level state between files.

`--workerIdleMemoryLimit` restarts a worker that grows past a bound. It keeps a run finishing and does not fix the leak — record the cause when using it.

An out-of-memory crash in the pipeline and not locally is usually the container's memory limit combined with too many workers. Reduce workers before raising memory.

## Split the work

```bash
npx jest --shard=1/4
npx jest --changedSince=origin/main
npx jest --selectProjects api
```

Sharding splits one suite across parallel machines and is the right answer when the suite is genuinely large and already efficient. Sharding an inefficient suite just pays the per-file overhead on more machines.

`--changedSince` runs only what a change affects, which is good for a pull-request check — but it relies on the import graph and misses a dependency expressed through configuration, so keep a full run on the default branch.

## Verify each change

```bash
time npx jest --silent
```

Change one thing, measure, keep it only if it helped. Record the before and after, and confirm the suite still passes and still reports the same number of tests — a "faster" run that silently matched fewer files is not faster.

```bash
npx jest --listTests | wc -l
npx jest --silent 2>&1 | grep -E 'Tests:|Suites:'
```

## Report

State the total runtime and test count before and after, the slowest files with their timings, whether the cost was per-file overhead or the tests themselves and the evidence for that, each change made with its measured effect, the worker count chosen and why for this machine or runner, any memory limit applied and the leak it is masking, and confirmation that the same number of tests still run and pass. Name the changes you tried and rejected because they did not help.
