---
name: 11ai-benchmark-analyzer
description: "Aggregate reviewed cycles across multiple benchmark repositories into coverage-aware model, harness, provider, effort, cost, compliance, judge, token, metadata, and trend analysis. Use for cross-benchmark leaderboards, normalized comparisons, cost-quality frontiers, recurring patterns, or historical trends. Requires at least two reviewed benchmarks and never edits their source artifacts."
---

# 11ai Benchmark Analyzer

Analyze reviewed cycle data, not mutable raw results. Read
[the shared contracts](../references/artifact-contracts.md). Report discovered,
skipped, stale, failed, and partially covered benchmarks before ranking.

## Normalize fairly

Raw totals and raw ranks are not comparable across rubrics or field sizes. For
each eligible run compute only analyzer-owned cross-benchmark views:

- normalized rank percentile: `1 - (rank - 1) / (entrants - 1)`;
- relative score: total divided by the benchmark winner's total;
- pairwise result only where both configurations entered the same benchmark.

Keep repeats as observations of one harness+model+effort configuration. Segment
different prompt/content/rubric/config versions and reviewed cycles; never
blend incompatible cohorts.

## Produce comprehensive analysis

Per configuration/provider/model/harness/effort include:

- benchmarks entered, eligible total, coverage, wins, ties, disqualifications;
- median normalized rank, mean relative score, range/IQR, pairwise record;
- score/dimension patterns through an explicit canonical dimension mapping;
- total and per-scope cost, token classes, cache/reasoning/tooling efficiency,
  wall time, cost/point, and efficient-frontier membership;
- audit failure rate, judge count/type, disagreement, metadata coverage;
- trends across cycles, harness/model versions, pricing, and time.

Preserve all useful metadata for filtering and visualization. Avoid a direct
claim between configurations with weak common-benchmark overlap; show them in
partial-coverage tables instead.

## Output

Write versioned `leaderboard.json` and `LEADERBOARD.md` at the requested parent.
Use stable configuration IDs, input source digests, and cycle IDs. Rebuild from
all reviewed inputs; never append arithmetic to a prior aggregate. If the source
digest is unchanged, do not rewrite.

Include chart-ready arrays for normalized rank, relative score, pairwise matrix,
coverage, cost-quality, dimensions, audit failures, token classes, scopes,
judge composition/disagreement, metadata coverage, and timelines. Websites may
reshape but not recompute these aggregates.

## Caveats

Print N and coverage beside every aggregate. Explain that these are coding
benchmarks scored by a mixture of declared judge types. Surface contradictory
benchmarks rather than hiding them in a mean. Treat tiny samples as directional.

The reviewer distributes analyzer output; this skill remains read-only toward
benchmark repositories and does not edit READMEs or websites.
