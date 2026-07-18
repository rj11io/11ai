# Performance Playbook

Load only the sections relevant to the project. Confirm available scripts and tooling locally before running commands.

## Contents

- [Cross-cutting diagnosis](#cross-cutting-diagnosis)
- [Web and browser applications](#web-and-browser-applications)
- [APIs and server runtimes](#apis-and-server-runtimes)
- [Databases and data access](#databases-and-data-access)
- [Builds and test suites](#builds-and-test-suites)
- [Measurement quality](#measurement-quality)

## Cross-cutting Diagnosis

Start from the user-visible or system-visible symptom and decompose total time or resource usage. Ask which term dominates, which work scales with input size or concurrency, and which work is repeated unnecessarily.

Check for:

- Accidental sequential execution of independent operations
- N+1 requests or queries, duplicate fetching, retry amplification, and missing cancellation
- Unbounded lists, queues, caches, logs, payloads, recursion, concurrency, or retained objects
- Expensive work repeated per request, render, iteration, file, test, or build module
- Poor algorithmic complexity and unnecessary copies, parsing, serialization, or compression
- Over-fetching, over-rendering, over-hydration, and large transitive dependencies
- Cold-start-only work placed in hot paths
- Missing timeouts, backpressure, batching, pooling, and resource cleanup
- Debug instrumentation, source maps, or development behavior leaking into production builds

Use profilers and traces to distinguish CPU, I/O wait, lock contention, garbage collection, network, database, rendering, and startup cost.

## Web and Browser Applications

### Loading and delivery

- Inspect the request waterfall, redirects, connection reuse, compression, cache headers, and critical request chains.
- Measure route-level JavaScript and CSS, transferred bytes, parsed bytes, and unused code. Identify the modules that dominate bundles.
- Remove duplicate dependencies and unnecessary polyfills. Prefer direct, tree-shakeable imports when supported.
- Load route- or feature-specific code on demand without delaying the primary above-the-fold experience.
- Optimize images by rendered dimensions, format, quality, responsive sources, priority, and lazy-loading behavior. Never lazy-load the primary hero or likely LCP image merely to reduce initial request count.
- Subset and preload fonts sparingly. Avoid font choices that create long blocking chains or layout shifts.
- Use CDN and browser caching with correct versioning and invalidation.

### Rendering and interaction

- Profile main-thread tasks, hydration, scripting, style calculation, layout, paint, and input delay.
- Minimize client component boundaries and serialized props in server-capable frameworks.
- Stabilize component inputs only where profiling proves rerender cost. Avoid blanket memoization.
- Virtualize genuinely large visible collections; paginate or window data before it reaches the UI when possible.
- Batch DOM reads and writes, avoid forced synchronous layout, and keep animations on composited properties where practical.
- Defer nonessential third-party scripts and measure their full CPU and network cost.

### Useful evidence

- Production build output and route manifests
- Browser performance traces and network waterfalls
- Core Web Vitals field data when legitimately available; lab metrics otherwise
- Bundle analyzer output, coverage, React/framework profiler output, and server timing
- Cold and repeat navigation at representative mobile and desktop conditions

## APIs and Server Runtimes

- Break latency into queueing, middleware, authentication, application work, dependencies, database, serialization, and network transfer.
- Profile representative requests under realistic payloads and concurrency. Keep load local or in an approved environment.
- Parallelize independent I/O with bounded concurrency. Preserve ordering and failure semantics.
- Batch chatty downstream calls and reuse connections or clients safely.
- Stream large responses only when consumers benefit and error behavior remains sound.
- Bound request bodies, result sizes, queues, caches, worker counts, retries, and concurrency.
- Avoid synchronous CPU-heavy work on event loops or request threads. Measure worker or background-job overhead before moving it.
- Inspect allocations and heap retention for sustained memory growth; verify cleanup on success, failure, timeout, and cancellation.
- Cache only data with explicit freshness, tenancy, authorization, and invalidation rules. Do not share user-specific results across identities.

Useful evidence includes CPU profiles, flame graphs, allocation or heap profiles, event-loop lag, request traces, dependency timings, throughput curves, and latency percentiles.

## Databases and Data Access

- Count queries per operation before tuning individual queries.
- Capture the real query shape, parameter distribution, result cardinality, and execution plan.
- Eliminate N+1 access with joins, eager loading, batching, or bulk operations appropriate to the data model.
- Return only needed columns and rows. Add stable pagination for growing collections.
- Add or change indexes only after checking filter, join, sort, selectivity, write cost, storage cost, and existing index coverage.
- Avoid functions or casts that prevent useful index access when an equivalent query is possible.
- Shorten transactions, keep external I/O outside them, and inspect lock waits and pool saturation.
- Bound connection pools against database limits and application concurrency.
- Test with representative data volume; tiny fixtures hide scan, sort, cardinality, and memory failures.
- Verify migrations and query changes safely. Do not run write-heavy experiments on production.

## Builds and Test Suites

- Time clean and incremental runs separately. Capture per-step, per-package, per-test, or per-module timings.
- Identify cache misses, invalid cache keys, broad dependency edges, repeated generation, and unnecessary transpilation or bundling.
- Limit work to relevant files or packages without weakening correctness gates.
- Reuse deterministic artifacts through the build system rather than ad hoc stale caches.
- Remove serial bottlenecks before increasing parallelism. Bound parallelism to avoid memory pressure and contention.
- Split or shard tests only after locating slow tests, global setup, I/O, isolation leaks, retries, and duplicated fixtures.
- Replace arbitrary sleeps with condition-based waits. Keep real integration coverage where it provides value.
- Audit watch-mode and development startup separately from clean continuous-integration builds.

## Measurement Quality

- Pin the runtime, dependency lockfile, build mode, dataset, request shape, and machine or runner when comparing changes.
- Warm up JITs, caches, pools, and application state when measuring warm behavior; measure cold behavior separately.
- Run enough samples to see variance. Prefer a distribution or median plus tail percentile over the fastest run.
- Alternate before and after revisions when environmental drift is likely.
- Watch CPU frequency, thermal throttling, background processes, network variability, and shared-runner contention.
- Report units, sample count, command, environment, and whether values are cold, warm, local, lab, or field data.
- Require changes larger than normal noise before claiming success. Use statistical tests when sample size and decision cost justify them.
- Track adjacent metrics so latency is not improved by unacceptable memory, CPU, bandwidth, error rate, or quality regressions.
