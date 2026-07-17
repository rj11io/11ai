---
name: 11ai-benchmark-troubleshooter
description: "Diagnose and repair regressions in 11ai benchmark lifecycles, accounting, reviewed artifacts, reports, indexes, and non-run exploration UI. Use when tokens or costs disappear, transcript extraction breaks, lifecycle pointers drift, interrupted cycles contaminate results, v1/v2 artifact shapes stop rendering, reports become stale, or benchmark websites show missing/undefined data. Preserve raw benchmark runs, prompts, evidence, screenshots, and candidate apps; repair skills and derived artifacts from measured source data only."
---

# 11ai Benchmark Troubleshooter

Diagnose benchmark failures from canonical artifacts and local harness
transcripts, then repair the smallest responsible skill, script, derived
artifact, or non-run website surface. Treat this as a forensic workflow:
establish what is actually present, identify the first broken transformation,
fix it, regenerate downstream projections, and prove that no benchmark facts
were invented.

## Safety boundary

Raw benchmark runs are immutable inputs. Never modify, delete, or regenerate:

- candidate run applications such as `app/<run-id>/`;
- prompts, run manifests, source content, evidence, screenshots, or judging
  traces;
- raw harness transcripts under `~/.codex` or `~/.claude`;
- scored source artifacts merely to make a review or website pass.

Derived artifacts may be repaired when their source is available and the
change is attributable: accounting ledgers, cost summaries, derived owner
fields in `runs.json`, review metadata, report presentation, lifecycle pointers,
site indexes, and non-run website code. Preserve unrelated user changes and
never use a report or UI as the source of truth.

## Workflow

### 1. Establish scope and baseline

Identify the benchmark tree, affected projects, current pointers, existing
cycles, website targets, and the older known-good benchmark if one is supplied.
Capture `git status --short` for every repository before editing. Treat dirty
files as user-owned unless the task clearly places them in scope.

Run the read-only health scan:

```bash
node scripts/inspect-benchmark-health.mjs <benchmark-tree-root>
```

Read [diagnostic patterns](references/diagnostic-patterns.md) when the scan
reports transcript, lifecycle, schema, accounting, or UI/index problems.

### 2. Find the first broken transformation

Trace the data path in this order:

```text
raw run/transcript facts
  → extractor
  → accounting threads/scopes
  → run ledger and review data
  → report and site index
  → non-run website adapters/components
```

Compare each stage with the previous stage. Do not patch the last display layer
until the upstream source and derived artifact are correct. Common signatures:

- measured tokens present but costs null: usage shape, model alias, effort
  normalization, or pricing match failure;
- all tokens null: extractor is reading the wrong transcript event shape or
  filtering the wrong repository path;
- review and `current.json` digests differ: derived review changed without
  pointer propagation;
- cycle-1 is stale while an interrupted cycle-2 exists: reconcile the existing
  reviewed benchmark, then remove only explicitly requested interrupted cycle
  artifacts;
- UI shows zero, blank, or `run:undefined`: adapter assumes a legacy schema;
  support the canonical v2 shape and preserve null as unavailable;
- reports contradict accounting: regenerate report copy from canonical review
  data rather than hand-editing scores or costs.

### 3. Repair the responsible layer

Prefer deterministic, reusable fixes:

1. Update the extractor/reference when the provider transcript schema changed.
2. Update pricing aliases and accounting classification when usage is measured
   but attribution or cost matching is broken.
3. Update reviewer gates so all-null measured data fails loudly instead of
   publishing a false success.
4. Regenerate costs, ledger owner fields, review metadata, and reports from the
   repaired accounting source.
5. Update site-index builders and website adapters for both legacy and v2
   reviewed shapes; keep website writes limited to non-run UI and generated
   website data.

Keep unknown values null and label them with provenance. Never estimate a cost,
token count, score, rank, or wall time when the source is unavailable.

### 4. Handle lifecycle artifacts conservatively

Use the existing reviewed cycle as the result of the existing benchmark unless
the user explicitly requests a new run. Do not create a new cycle to hide a
derived-artifact bug. When removing an interrupted cycle, target the exact
requested cycle path, preserve published historical cycles, and update the
current pointer only after the repaired review validates. Named historical
cycles such as date/version IDs are not interchangeable with `cycle-2`.

### 5. Refresh the non-run exploration layer last

Invoke `$11ai-benchmark-www` only after canonical accounting and review data
are valid. It may update root/parent/benchmark/cycle catalog UI, adapters,
routes, charts, navigation, and `site-index.json`; it must not touch run apps,
run folders, prompts, evidence, screenshots, cost ledgers, review artifacts,
reports, cycle state, or `current.json`.

Check the website scope before handoff:

```bash
node scripts/verify-www-scope.mjs <benchmark-tree-root> <changed-path>...
```

### 6. Verify and report

Validate every modified JSON artifact against its schema or the repository's
validator. Reconcile token and cost totals, confirm review/current digests,
check for duplicate or undefined site nodes, and run the affected app's
typecheck, lint, tests, and production build. Build the website twice and
confirm the second build is idempotent. Avoid new screenshots unless the user
explicitly requests visual evidence and no existing evidence can answer the
question.

Report root cause, repaired files, source-derived metrics, intentionally
unavailable values, deleted interrupted artifacts, validation commands, and
any pre-existing failures left untouched by the safety boundary.

## Hard stops

- No measured source exists for a requested value and repair would require an
  inference.
- A proposed fix requires editing raw run files, evidence, screenshots, or
  transcripts.
- A lifecycle rename would rewrite published history rather than repair a
  derived pointer.
- A website build needs benchmark data mutation to pass.
- The same validation failure persists after three distinct safe repairs;
  report the blocker and the evidence instead of broadening scope.
