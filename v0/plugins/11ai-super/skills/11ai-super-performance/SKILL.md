---
name: 11ai-super-performance
description: "Audit, profile, fix, and repeatedly optimize software project speed and resource efficiency. Use when Codex needs to investigate a slow application, API, page, query, build, test suite, startup path, or background job; eliminate critical and major performance problems; improve latency, throughput, responsiveness, bundle size, memory, CPU, network, or database efficiency; validate production-like performance; or continue performance work until the project meets a high evidence-based bar. Stops and reports when the change set becomes unmanageable or troubleshooting outweighs progress."
---

# 11ai Super Performance

## Objective

Make the project materially faster without sacrificing correctness, security, accessibility, maintainability, or user experience. Measure before changing code, fix critical and major bottlenecks first, and repeat the measure-fix-verify loop until further work has low expected value.

## Operating Rules

- Read repository instructions before editing.
- Treat measurements as evidence, not decoration. Compare the same workload, environment, build mode, data shape, and sampling method before and after a change.
- Prefer production builds and production-like data paths. Do not infer production performance from a development server when a production build can be exercised locally.
- Never run disruptive load tests, mutate production data, clear shared caches, or change live infrastructure without explicit authorization.
- Do not trade away correctness, security, accessibility, visual stability, observability, or important product behavior for a better metric.
- Keep optimizations simple enough to maintain. Remove obsolete code and dependencies exposed by the fix.
- Keep a session change manifest — every file this session creates, modifies, renames, or deletes — and reconcile it after every batch, distinguishing source changes from disposable benchmark, profile, build, coverage, cache, and log artifacts.
- If the user requests only an audit, stop after reporting findings. Otherwise implement safe in-scope fixes and verify them.
- Always end with the completion report defined below, including when stopping early or aborting.

## Workflow

### 1. Establish Scope and Success Criteria

1. Read `AGENTS.md`, `README*`, manifests, lockfiles, framework configuration, deployment configuration, and relevant tests.
2. Identify the system boundary and the most important user or machine journeys: initial load, navigation, interaction, API request, query, job, startup, build, or test path.
3. Derive concrete metrics and budgets from product needs and existing configuration. Examples include p50/p95 latency, throughput, Core Web Vitals, time to usable UI, request count, transferred bytes, JavaScript size, query count, CPU time, peak memory, build time, or test duration.
4. Record environmental constraints and the exact command or interaction used for each baseline.

When a production origin would materially improve confidence, search README files before asking the user:

```bash
rg -n -i 'https?://|production|prod(uction)?[[:space:]_-]*url|live[[:space:]_-]*url|deployed|vercel|netlify|render|fly\.io' --glob 'README*' .
```

Use a discovered origin for read-only inspection and light, normal-user navigation only. Treat authenticated, private, or ambiguous URLs cautiously.

### 2. Map the Performance Model

Trace each critical journey across its full path:

```text
input -> network -> server/middleware -> database/services -> serialization
      -> browser/runtime -> rendering/hydration -> interaction/background work
```

Inspect the actual code and configuration behind the path. Look for multiplicative cost first: repeated requests, N+1 queries, unbounded loops or data, duplicated work, sequential independent I/O, retry storms, excessive rerenders, large client boundaries, cache misses, memory retention, and oversized assets or bundles.

Read [references/performance-playbook.md](./references/performance-playbook.md) for the relevant stack-specific checks. Do not run every tool mechanically; select checks that can confirm or reject a concrete hypothesis.

### 3. Build a Reproducible Baseline

1. Verify the project can install, build, test, and run using its documented commands.
2. Warm up the system where appropriate, then collect multiple samples. Use medians for typical behavior and p95/p99 for tail behavior when enough samples exist.
3. Capture profiles, traces, bundle reports, query plans, request waterfalls, or timing breakdowns that locate cost rather than merely confirm slowness.
4. Separate pre-existing correctness failures from performance failures. Do not hide either.
5. Rank findings by severity, user reach, frequency, confidence, and expected improvement divided by implementation risk.

Classify a finding as:

- **Critical** when it can cause outages, resource exhaustion, unbounded cost, severe stalls or timeouts on a core path, or performance that makes the primary workflow effectively unusable.
- **Major** when it dominates a core-path budget, affects many users or requests, causes a failed user-facing performance target, or wastes substantial compute, memory, network, database, build, or test resources.
- **Moderate/minor** when its measured impact is limited, infrequent, or off the critical path.

Do not assign critical or major severity from a pattern alone. Require a reachable path and measurement, profile, query plan, bounded calculation, or strong code-level evidence.

### 4. Fix in Impact Order

Resolve every verified critical and major issue that can be fixed safely within the repository. Prefer root-cause changes in this order when applicable:

1. Eliminate unnecessary work, requests, queries, renders, allocations, dependencies, and data transfer.
2. Improve algorithms, data structures, query shapes, indexes, pagination, batching, and concurrency.
3. Move work off the critical path through streaming, deferral, precomputation, or background processing while preserving behavior.
4. Cache at the narrowest correct layer with explicit ownership, keys, invalidation, privacy, and staleness semantics.
5. Reduce client code, hydration, asset weight, parsing, serialization, and main-thread work.
6. Tune framework, compiler, runtime, connection-pool, and deployment settings only after code-path costs are understood.

For each fix:

1. State the bottleneck and expected metric movement.
2. Make the smallest coherent change that addresses the cause.
3. Add or update correctness and regression tests where practical.
4. Run focused validation, then the broader relevant suite.
5. Re-run the identical benchmark and compare distributions or repeated samples.
6. Review the batch's complete set of changes and update the session change manifest.
7. Keep the change only when evidence improves the target without material regressions elsewhere.

### 5. Continue the Improvement Loop

After each fix, re-profile because the dominant bottleneck may move. Repeat:

```text
measure -> rank -> hypothesize -> change -> verify correctness -> remeasure
```

Continue beyond the first passing result. Re-audit the full critical journey after major changes, check cold and warm behavior where relevant, and perform at least one final clean measurement pass from a fresh production build.

Stop only when all of these are true:

- No verified critical or major performance issue remains within the authorized scope.
- Representative correctness checks and production builds pass, apart from clearly reported pre-existing failures.
- Target metrics meet their budgets, or the achieved values are strongly justified against project constraints.
- Results reproduce across multiple samples and no important adjacent metric regresses materially.
- A fresh profile reveals no additional high-confidence, high-impact fix with reasonable cost and risk.
- Remaining opportunities are minor, speculative, externally blocked, or show diminishing returns.
- The complete change set is intentional, reviewable, and limited to the session manifest.

If a critical or major issue depends on credentials, infrastructure, production data, architecture outside the repository, or a risky product decision, exhaust safe local alternatives and report the blocker precisely. Do not describe the project as fully optimized while such an issue remains.

### 6. Abort When Work Becomes Unsafe

Abort the operation when any of these occurs:

- The project contains unexpected changes, generated-file sprawl, or changes that cannot be confidently attributed to the session.
- The change set expands materially beyond the active measured finding or can no longer be reviewed as a small set of coherent fixes.
- Two focused attempts at the same fix fail to produce a reliable diagnosis or verified improvement.
- Troubleshooting starts requiring speculative architecture changes, broad dependency churn, or repeated debugging without measurable progress.
- Correctness, security, accessibility, data integrity, or project safety becomes uncertain.
- Safe completion requires missing authority or an unapproved scope expansion.

On abort:

1. Stop processes started by the session and capture the failure evidence and abort reason for the report.
2. Compare the project's current state with the session change manifest. Preserve any path whose ownership is uncertain.
3. Stop the routine and return the required aborted-session report, listing exactly which session changes remain in place. Do not immediately restart the entire operation.

## Verification Matrix

Run the smallest relevant set during iteration and the broad set at completion:

- Existing unit, integration, end-to-end, and contract tests
- Lint, typecheck, static analysis, and production build
- Focused benchmark or profiler for each changed critical path
- Browser checks at representative viewport and network/CPU conditions for user-facing work
- Query count, query plan, and representative data-volume checks for database work
- Memory growth, cleanup, cancellation, timeout, and concurrency checks for long-lived processes
- Bundle, asset, request waterfall, cache, and rendering checks for web applications

Never claim an improvement from a single noisy run. If precise tooling is unavailable, use a controlled proxy, repeat it, disclose the limitation, and avoid false precision.

## Completion Report

Always end with a self-contained summary of the session. Lead with the outcome and include:

- Critical and major issues fixed, with their root causes
- Before/after metrics, sample counts, environment, and commands or journeys used
- Important files or subsystems changed
- Correctness and regression checks run
- Remaining lower-priority opportunities or external blockers
- Any production origin used and whether it was inspected read-only
- Final state of the session's changes: the complete manifest of paths created, modified, or deleted
- If aborted, the trigger, which session changes remain in place, and any path preserved because its ownership was uncertain

Distinguish measured improvements from expected improvements. Never invent benchmark results.
