---
name: 11ai-benchmark-sync
description: "Discover and idempotently refresh every stale derived benchmark domain across a repository tree—judge aggregates, accounting, reviews, cross-benchmark analysis, owned README sections, reports, hierarchy indexes, and existing or missing benchmark websites—without launching benchmark runs or judges. Use after new runs, judges, metadata, source documents, or reviewed cycles appear, or when code, design, content, and published projections must match the newest canonical benchmark artifacts."
---

# 11ai Benchmark Sync

Synchronize projections from canonical sources without creating benchmark or
judging facts. Read [artifact contracts](../../references/artifact-contracts.md)
and preserve every historical reviewed cycle.

## Discover scope and freshness

Walk the requested root recursively. Find benchmark configs, run plans, cycles,
review data, analyzer output, reports, marker-owned READMEs, and every root,
parent, child, or benchmark application. Validate artifacts and compare source
digests. Treat malformed or stale inputs as explicit blockers for their
dependent projections, not permission to guess values.

Canonical precedence is:

```text
run/audit/evidence/judge/thread facts
  → aggregate and accounting
  → reviewed cycle data
  → cross-benchmark analysis
  → README, report, index, and website projections
```

Never use a report, README, or website as the source for benchmark facts.

## Refresh in topological order

1. Rebuild aggregates from existing complete judges; never run a judge.
2. Reconcile accounting from discovered transcripts and canonical thread data.
3. Invoke `$11ai-benchmark-reviewer` in sync mode for each affected cycle to
   rebuild stale review data without changing raw artifacts.
4. Invoke `$11ai-benchmark-analyzer` for affected multi-benchmark parents.
5. Invoke reviewer propagation again for marker-owned benchmark, parent, and
   root README sections that consume the new analyzer output.
6. Invoke `$11ai-benchmark-reporter` in sync mode for every missing or stale
   expected report.
7. Detect Next.js applications by dependencies plus `app/`, `pages/`, or Next
   configuration. If one or more exist, invoke `$11ai-benchmark-www` exactly
   once over the full tree, last.

Use the deterministic detector rather than guessing from a nearby directory:

```bash
node <plugin>/scripts/detect-next-apps.mjs <benchmark-tree-root>
```

Benchmark WWW must update only non-run exploration websites and their
website-owned generated data—catalog, benchmark, and cycle UI, routes,
components, design, content, filters, charts, and hierarchy indexes—from the
latest reviewed and analyzed artifacts. It may read run metadata, but must
never modify benchmark run applications, run folders, prompts, evidence,
screenshots, cost/review/cycle artifacts, or `current.json`. Preserve unrelated
user code and use data adapters or owned sections instead of hardcoding
results. Run `scripts/verify-www-scope.mjs` on the final changed paths.

## Publication and idempotency

Expose draft/stale states internally but publish only reviewed facts as final.
Do not deploy, push, or publish externally without confirmation. Build derived
outputs from all current sources by stable ID; never append arithmetic, marker
sections, or website nodes. Run synchronization twice: the second pass must
produce no content diff. Finish by regenerating lifecycle state for every
benchmark and reporting refreshed, unchanged, blocked, and skipped domains.
