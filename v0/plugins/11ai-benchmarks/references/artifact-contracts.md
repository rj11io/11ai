# Benchmark artifact contracts (schema version 2)

Use these contracts for every benchmark skill. Raw observations are append-only;
derived artifacts are deterministic projections that may be replaced when their
inputs change. Every writer must preserve unknown fields so newer producers do
not lose metadata when an older skill resumes the workflow.

## Identity and provenance

Every JSON artifact carries stable schema/identity/status/provenance fields.
Every derived artifact additionally carries `generatedAt` and `sourceDigest`:

```json
{
  "schemaVersion": 2,
  "artifactId": "stable-id",
  "status": "draft|complete|stale|superseded",
  "generatedAt": "ISO-8601",
  "sourceDigest": "sha256 of canonical input identities and bytes",
  "provenance": {
    "producer": "skill or script name",
    "method": "measured|derived|inferred|reported",
    "sources": []
  }
}
```

Use stable IDs, never array positions. On resume, compare `sourceDigest`: if an
existing complete artifact has the same digest, do not rewrite or duplicate it.
If inputs changed, rebuild the derived artifact from all current raw inputs.

## Benchmark configuration

Write `benchmark/benchmark.json` with `benchmarkId`, `mode` (`single-app` or
`isolated`), `runStrategy` (`folder`, `branch`, `worktree`, or `repository`),
`baselineRef`, dependency policy, content mode, required evidence surfaces, and
canonical URLs. Skills select checks from this file instead of guessing layout.
Do not define a mandatory sequential-run or commit policy in schema version 2.

## Prompt identity

Ledger entries use both:

- `promptTemplateSha`: hash of frozen `PROMPT.md` with `{{RUN_ID}}` intact;
  identical across comparable runs.
- `promptInstanceSha`: hash of the exact per-run prompt sent to the harness;
  expected to differ when variables differ.
- `promptVariables`: the substitutions that connect the two.

Comparability gates use `promptTemplateSha`, `contentSha`, rubric version/hash,
and benchmark configuration. Reproducibility uses `promptInstanceSha`.

Root `JUDGE.md` is the corresponding operator template for judging. It keeps
`{{CYCLE_ID}}`, `{{JUDGE_ID}}`, and `{{JUDGE_TYPE}}` frozen. Store exact judge
instances under `cycles/<cycle-id>/judging/prompts/` and record template SHA,
instance SHA, and variables in prompt metadata and every judge artifact. If
JUDGE.md is absent when a judging skill starts, create it from the canonical
template before allocating the prompt instance.

## Campaign lifecycle

Read `references/lifecycle-contract.md`. Optional `benchmark/run-plan.json`
stores operator intent and time-gated targets; it never becomes benchmark fact
by itself. `benchmark/lifecycle-state.json` is a deterministic diagnostic cache
derived from artifacts, not an authority.

A soft lifecycle publishes a fully gated `interim` cycle while leaving the
campaign open. A hard lifecycle publishes a `final` cycle and closes only after
target-set completion or explicit recorded confirmation/waiver. Waiting for a
time-gated model or human judge is normal state.

## Async cycles

A cycle is an immutable publication cohort, not a scheduled day:

```text
benchmark/cycles/<cycle-id>/
  cycle.json
  judging/mapping.json
  judging/evidence.json
  judging/judges/<judge-id>.json
  judging/aggregate.json
  review/data.json
  report/report.html
  report/report.md
```

`cycle.json` freezes included run IDs and every input hash. A later run, changed
rubric, changed cohort, or deliberate new publication creates a new cycle. An
interrupted operation resumes the same cycle. `benchmark/current.json` points
to the latest reviewed cycle; old cycles remain unchanged and addressable.

New cycles also freeze `releaseType` (`interim` or `final`), monotonic
`publicationSequence`, `previousCycleId`, and the run-plan coverage snapshot.
Cycles are cumulative by default: include every comparable audit-passed run to
date. Never mutate an older published cohort or carry its holistic ranking into
a changed cohort. `current.json` includes cycle ID, release type, sequence, and
review digest.

## Judge artifacts

AI and human judges share one schema. One completed judge owns one immutable
file containing `judgeId`, `judgeType`, rubric/evidence hashes, anonymization
state, per-run dimension scores and justifications, and holistic ranking.

After every judge completes, rebuild `aggregate.json` from every complete judge
file in that cycle. Never update arithmetic incrementally. The next sequential
judge must not see the aggregate or earlier scores. The aggregate records all
included judge IDs, AI/human counts, medians, dispersion, weighted totals,
holistic rank aggregation, disagreement flags, ties, and the aggregation
algorithm version.

## Evidence artifacts

`evidence.json` lists exactly what judges saw: screenshots, video or interaction
captures, accessibility/performance probes when requested, console errors, page
errors, failed requests, viewport/media settings, capture timestamps, and file
hashes. Anonymize paths, run IDs, model names, and authorship clues in the judge
view while retaining a private mapping.

## Token and cost normalization

Normalize provider-specific usage without erasing raw counters:

```json
{
  "tokens": {
    "inputTotal": null,
    "inputUncached": null,
    "cachedInputRead": null,
    "cacheWrite5m": null,
    "cacheWrite1h": null,
    "outputTotal": null,
    "reasoningOutput": null,
    "nonReasoningOutput": null,
    "providerTotal": null
  },
  "cost": {
    "inputUncachedUsd": null,
    "cachedInputReadUsd": null,
    "cacheWrite5mUsd": null,
    "cacheWrite1hUsd": null,
    "outputUsd": null,
    "totalUsd": null
  }
}
```

Use `null` for unavailable values, never zero. Preserve provider-native usage
under `rawUsage`. Attach field-level provenance (`measured`, `derived`,
`inferred`, `reported`, `unavailable`) when a value is not directly measured.

Classify every discovered thread into exactly one mutually exclusive leaf:

- `benchmark-run`: a verified run thread.
- `benchmark-operation`: initialization, cycle freezing, audit, accounting,
  review,
  reporting, website generation, or analysis, excluding judging.
- `judge`: AI judging or a thread assisting a human judging session.
- `identified-other:<label>`: any positively identified activity outside the
  benchmark and judge scopes; keep every distinct label.
- `unidentified`: found but not attributable with defensible evidence.

Roll up without overlap:

- `benchmarkScope` = benchmark runs + benchmark operations.
- `judgeScope` = judge leaves.
- `identifiedScopes` = map of all `identified-other` labels.
- `nonIdentifiedScope` = unidentified leaves.
- `benchmarkAndJudgeScope` = benchmarkScope + judgeScope.
- `total` = every discovered thread across every leaf.

Assert that leaf token and cost sums equal `total`. Never exclude an open,
unpriced, ambiguous, or unrelated thread from the inventory: record it with
null pricing or in the appropriate scope so reconciliation remains honest.

## Metric ownership

- Runner: run identity, prompt hashes, timestamps, baseline/run refs.
- Auditor: compliance checks and runtime evidence facts.
- Judge aggregator: scores, ranks, dispersion, judge agreement.
- Token accountant: tokens, costs, rates, scope rollups, efficiency metrics,
  cost per point, and cost-quality joins.
- Analyzer: cross-benchmark normalization and aggregates.
- Reviewer: validation, consolidation, freshness, and publication targets.
- Reporter and websites: presentation only; they may reshape data for charts
  but must not create benchmark facts or silently fill missing values.
- Lifecycle orchestrators: stage detection and dependency ordering only; they
  invoke owners and never recompute owner facts.

## Synchronization

Synchronize derived domains in dependency order: judge aggregate, accounting,
review data, cross-benchmark analysis, marker-owned READMEs, reports, and
benchmark websites. Websites run last and only when one or more Next.js apps
are detected. Reviewer, reporter, analyzer, and website sync modes compare
source digests and update existing content/code/design in their owned domain.
They never treat README/report/web projections as canonical facts.

## Metadata preservation

Capture every defensible datum, including absent/error states. Prefer a typed
field over prose notes. Useful dimensions include harness/provider/model and
versions, effort, git refs, environment, time, turns/messages/tool calls,
subagents, file operations, retries/errors, compactions, surfaces, audit checks,
judge composition/disagreement, token classes, per-class cost, pricing source,
cache efficiency, latency/duration, cost/turn, cost/minute, cost/point, scope,
cycle membership, review freshness, and publication URLs.

Web and report layers should expose details progressively: compact summaries at
collection levels, complete metadata and provenance on drill-down pages.
