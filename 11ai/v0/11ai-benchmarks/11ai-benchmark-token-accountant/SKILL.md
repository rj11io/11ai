---
name: 11ai-benchmark-token-accountant
description: "Inventory every harness thread found for a benchmark repository, extract the finest available token, cache, output, reasoning, timing, tool, model, and cost metadata from transcripts, classify each thread into benchmark, judge, identified-other, or unidentified scope, reconcile all scopes to a total, and write reproducible cost artifacts with verified pricing. Use for run cost, judging cost, benchmark overhead, complete repo-thread accounting, efficiency analysis, or cost-quality metrics."
---

# 11ai Benchmark Token Accountant

Account for every discovered thread, not merely successful benchmark runs. Use
measured transcript counters, web-verified prices, explicit provenance, and
reconciled scopes. Read [the shared contracts](../references/artifact-contracts.md),
[extractor rules](references/extractors.md), and
[pricing data](references/pricing.json) before parsing.

## Current normalized metrics

At the finest available session → model level, collect:

- total, uncached, cached-read, 5-minute cache-write, and 1-hour cache-write
  input tokens;
- total output, reasoning output, and non-reasoning output tokens;
- per-token-class cost and total cost;
- session/thread start, end, active/wall duration, messages, turns, models,
  provider, harness/version, and source files;
- cache hit rate, output/input ratio, reasoning share, cost/minute, cost/turn,
  and transcript-versus-harness cost delta;
- pricing rates, effective/verified dates, source URL, subscription versus API
  billing caveat, and stale-pricing state.

Provider counters differ: Codex cached input is a subset of input and reasoning
is a subset of output; Claude input/cache-write/cache-read are disjoint. Preserve
provider-native `rawUsage`, then normalize. Use `null` when a class is not
available—never misrepresent missing as zero.

## Discover all threads

Search every relevant harness transcript location, historical repository slug,
renamed path, resumed session, sidechain, and sibling subagent file. Filter by
recorded cwd/path/ref and a deliberately broad time window. Do not drop open,
ambiguous, unrelated, unpriced, empty, or failed threads.

Deduplicate according to the harness format. Give every logical thread a stable
`threadId`, list every source file, and record resume/parent/subagent relations.
If attribution remains ambiguous, keep the thread and classify it unidentified.

## Capture maximum metadata

Extract when present or defensibly inferable:

- session, conversation, turn, message, request, parent, and subagent IDs;
- harness/provider/model names and versions, effort, service tier, context size;
- cwd, repository identity, branch, commit, baseline/run ref, and environment;
- kickoff hash/match, cycle/run/judge IDs, files read/touched/written;
- tool calls by type, edits/patches, commands, web calls, errors, retries,
  compactions, interruptions, resumes, and exit state;
- timestamps, active gaps, duration, time/turn, tokens/turn, tokens/minute;
- every raw and normalized token class, per-class cost, cache efficiency;
- classification evidence, confidence, field provenance, and unavailable fields.

Label every value `measured`, `derived`, `inferred`, `reported`, or
`unavailable`. Never infer facts merely because a filename resembles a run ID.

## Classify into mutually exclusive leaf scopes

Assign every thread to exactly one leaf:

1. `benchmark-run` — kickoff matches the frozen prompt and writes into the
   registered run target.
2. `benchmark-operation` — scaffold, content preparation, run preparation,
   audit, accounting, review, report, website, or analysis work; judging is
   excluded so it remains independently visible.
3. `judge` — an AI judge or a thread assisting a human judging session. Record
   cycle ID and judge ID when known.
4. `identified-other:<label>` — positively identified activity outside those
   scopes. Preserve arbitrary labels such as `product-work`, `repo-maintenance`,
   or `documentation`; do not collapse them to generic unrelated work.
5. `unidentified` — discovered but not attributable with defensible evidence.

Roll up:

- `benchmarkScope` = benchmark runs + benchmark operations;
- `judgeScope` = all judge threads;
- `identifiedScopes` = one rollup for every other label;
- `nonIdentifiedScope` = unidentified threads;
- `benchmarkAndJudgeScope` = benchmarkScope + judgeScope;
- `total` = every discovered thread regardless of benchmark relevance.

Assert leaf counts/tokens/costs reconcile exactly to `total`. Display all scopes
in summaries and websites. Never use overlapping buckets.

## Resolve prices

Match exact provider model IDs against `pricing.json`. When missing or older
than 30 days, verify against the provider's official pricing source and update
the entry. Never recall prices from memory. If verification is unavailable,
retain the stale rate only with `pricingStale: true`.

Price each class independently. Embed rates in every output so historical files
remain reproducible after prices change. State that subscription usage is an
API-equivalent value, not necessarily the user's bill.

## Write artifacts

Write one canonical `benchmark/costs/accounting.json` following
`../schemas/cost.schema.json`, with full thread records and scope rollups. Also
write compact derived views without losing the canonical source:

- `benchmark/costs/runs/<run-id>.json`;
- `benchmark/costs/judges/<judge-id>.json`;
- `benchmark/costs/identified/<label>.json`;
- `benchmark/costs/unidentified.json`;
- `benchmark/costs/summary.json` and `COSTS.md`.

Use stable IDs and source digests. On resume, merge by `threadId` and rebuild all
rollups from the canonical thread list; never append totals or duplicate a
resumed thread. Backfill ledger run cost and timing only from canonical values.

After extraction/classification, write the normalized thread array and rebuild
scope totals with the bundled deterministic reconciler:

```bash
node <plugin>/scripts/reconcile-accounting.mjs \
  benchmark/costs/threads.json benchmark/costs/accounting.json
```

## Derived metrics owned here

Compute when inputs exist, otherwise write null plus a reason:

- per run/configuration/provider/model/harness/scope token and cost totals;
- input composition, cache hit/write rates, output/input and reasoning shares;
- cost/minute, cost/turn, tokens/turn, tokens/minute, and operational overhead;
- mean/median/spread across repeats;
- cost per rubric point and cost per normalized score;
- cost-quality frontier inputs and value flags;
- pricing and metadata coverage, missing-data counts, and reconciliation deltas.

The reviewer copies these fields; it does not recompute them.

## Report

Lead with all-scope reconciliation: benchmark, judge, every identified-other
label, unidentified, benchmark+judge, and total. Then show run, judge, session,
model, and token-class breakdowns. Surface missing metadata, uncertain
classification, stale pricing, open threads, and cost deltas. Make every chart
or claim traceable to thread IDs and rates.
