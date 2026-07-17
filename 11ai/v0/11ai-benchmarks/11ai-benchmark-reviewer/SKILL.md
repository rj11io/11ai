---
name: 11ai-benchmark-reviewer
description: "Validate one benchmark cycle's configuration, runs, audits, AI/human judging aggregate, exhaustive scope accounting, evidence, and metadata for completeness and consistency; consolidate them without recomputing facts; and idempotently propagate reviewed data to README and website targets. Use to review, approve, sync, publish, refresh, or resume benchmark results."
---

# 11ai Benchmark Reviewer

Act as the publication gate. Read
[the shared contracts](../references/artifact-contracts.md) and validate output
against `../schemas/review.schema.json`. Copy owned metrics; never recreate them.

## Select the cycle

Select `benchmark/cycles/<cycle-id>/cycle.json`. Resume the latest draft only
when its frozen run membership and hashes still match. Never fold new runs or a
changed rubric into an already reviewed cycle. Preserve historical cycles.

## Run the complete gate

Report all failures together:

1. Configuration and cycle validate; benchmark/cycle/run IDs are unique.
2. Included runs share template/content/config hashes and each exact prompt
   instance hash resolves to its frozen file.
3. Every included run is finished and has the required audit state.
4. Rubric markdown, rubric JSON, judging evidence, judge files, and aggregate
   hashes agree.
5. Every aggregate judge ID resolves to one complete AI or human artifact;
   drafts and duplicates are excluded.
6. Screenshots and other evidence referenced by the cycle exist and match.
7. Canonical accounting includes every discovered thread, all required scopes,
   verified pricing/provenance, and a passing reconciliation to total.
8. Ledger/cost/audit/judging values agree with their owning artifacts.
9. Required publication metadata and canonical URLs are present or explicitly
   unavailable.
10. No owned output is newer than or inconsistent with its source digest.

Missing optional cost fields may publish as unavailable. Missing runs, audits,
judge inputs, non-reconciling totals, or hash mismatches fail the gate. Point
each failure to its owning skill.

## Consolidate all reviewed data

Write `benchmark/cycles/<cycle-id>/review/data.json`. Preserve the full detail
needed for drill-down and visualization:

- benchmark/config/cycle identity, objectives, skills, policies, hashes, refs;
- every run's harness/provider/model/effort/version/environment/timing metadata;
- audits, commands, warnings, errors, evidence surfaces and availability;
- weighted/dimension scores, ranks, holistic signals, judge composition,
  dispersion, disagreement, blinding, and judge metadata;
- normalized token classes, raw/provider usage, per-class costs, rates,
  efficiency, tooling/session metadata, and cost-quality metrics;
- benchmark, judge, each identified-other, unidentified, benchmark+judge, and
  total accounting scopes;
- metadata coverage, unavailable fields, stale/inferred/reported markers;
- source/report/deployment URLs and publication targets.

The reviewer may reshape owned fields into display-friendly arrays but may not
derive new score, cost, or cross-benchmark facts. Record a `sourceDigest`; if an
existing complete data file has the same digest, do not rewrite it.

## Propagate idempotently

Update only marker-delimited sections owned by this skill in benchmark, parent,
and root READMEs. Key markers by benchmark and cycle or by stable leaderboard
identity; replace matching sections wholesale and never append duplicates.

At one benchmark, show verdict, runs, score/audit/judge summary, all accounting
scope totals, cost/point, freshness, caveats, and report link. At parent/root
levels use analyzer-owned aggregates and compact summaries with sample size.

For websites, copy reviewed cycle data to the existing data convention and
refresh hierarchy indexes through `$11ai-benchmark-www`. Never hardcode values
into components. Do not touch the general `$11ai-www` skill.

After a successful gate, update `benchmark/current.json` atomically to the
cycle ID. Publishing externally still requires user confirmation.

## Async rules

- Raw run/audit/judge/accounting artifacts are never overwritten by review.
- A changed source digest makes the review stale; regenerate the same draft
  cycle or create a new cycle according to frozen-input rules.
- Historical reviewed cycles remain addressable.
- Re-running with unchanged inputs produces zero duplicate sections and ideally
  a zero diff.
- Reporter and websites consume this exact file, keeping all surfaces aligned.
