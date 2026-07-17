---
name: 11ai-benchmark-www
description: "Build or upgrade repository-driven benchmark websites across every discovered root, parent, benchmark, cycle, and run level, using reviewed artifacts as the source of truth, compact non-root layouts, searchable/filterable/sortable benchmark catalogs, and extensive interactive shadcn visualizations of scores, judges, audits, tokens, costs, scopes, metadata, and history. Use specifically for benchmark collection/result websites; do not use for general project sites."
---

# 11ai Benchmark WWW

Build the public exploration layer for an 11ai benchmark tree. Focus on the
benchmark catalog, progressively reveal every reviewed datum, and keep all
levels synchronized across async cycles. This skill is distinct from the
general `$11ai-www` project-site skill; never edit or invoke that skill here.

Read [artifact contracts](../references/artifact-contracts.md) and
[the website matrix](../references/website-data-and-visualizations.md). Apply
`$11ai-design-styleguides` to every site.

## 1. Inventory the complete tree

Walk from the user-named root and discover:

- root collection and existing root website;
- parent/version/family directories and their websites;
- benchmark repos through `benchmark/benchmark.json`, legacy ledgers, or
  reviewed cycle data;
- all reviewed cycles, reports, runs, evidence, analyzer outputs, and canonical
  URLs;
- application stack, package manager, shadcn components, chart dependency,
  theme, fonts, deployment config, and repo guidance at every level.

Do not stop at the first `www/`. Cover every root, parent, and child app found.
Record ambiguous hierarchy before editing; prefer existing repository grouping.

## 2. Build one recursive data model

Generate stable hierarchy nodes for `root → parent → benchmark → cycle → run`
using `../schemas/site-index.schema.json`. Each node contains parent/children,
canonical/source URLs, compact summary, complete reviewed payload reference,
metadata coverage, freshness, and source digest.

Consume, in order:

1. cycle `review/data.json`;
2. analyzer `leaderboard.json` for cross-benchmark facts;
3. accountant-owned cost/efficiency metrics already copied into review data;
4. legacy reviewed `benchmark/report/data.json` only as a compatibility path.

Never calculate scores, prices, cost/point, normalized ranks, or reconciliation
inside UI components. It is fine to transform owned arrays for chart libraries.

Rebuild indexes from all sources and replace entries by stable ID. Never append
on each build. If source digest is unchanged, produce no data-file diff.
Use the bundled deterministic scanner as the baseline implementation:

```bash
node <plugin>/scripts/build-site-index.mjs <benchmark-tree-root> <app-data>/site-index.json
```

## 3. Information architecture and density

Every level supports breadcrumbs, up/down navigation, latest reviewed state,
cycle history, source/report links, and drill-down into the exact underlying
metadata.

- **Root website:** retain the spacious 11ai editorial rhythm and overview.
- **All non-root websites/pages:** use a compact analytical mode—smaller hero,
  reduced vertical padding, tighter cards, compact filters, dense tables, and
  more information above the fold while preserving readability.
- **Benchmark list:** primary content at root and parent levels, not a secondary
  marketing section.
- **Benchmark/cycle/run:** progressive detail from summary to raw provenance;
  never hide missing or unavailable metadata.

Prefer one shared component/data vocabulary across separate apps without
forcing a monorepo or copying static result prose.

## 4. Benchmark catalog

Display at least objective, skill under test, freshness, cycle/run counts,
winner/score, benchmark cost, judge AI/human composition, value pick, audit
state, evidence surfaces, and metadata coverage.

Search benchmark, objective, skill, provider, model, harness, run, and metadata.
Filter group/objective/skill/provider/harness/model/effort/cycle/date/review,
audit, judge type/count, surface, score, cost, cost/point, wall time, cache rate,
scope, and field availability. Sort newest/name/score/cost/value/runs/judges,
cache efficiency, coverage, or completeness. Persist all state in URL params.

Provide column selection, compact/card view where useful, keyboard operation,
empty states, result counts, and reset controls. On narrow screens prioritize
identity, status, winner, score, and cost with expandable metadata.

## 5. Visualize every useful dimension

Prefer the existing shadcn chart component. If absent, the target uses a
compatible React/Tailwind/shadcn stack, and installation is authorized, install
the official shadcn chart component and required dependency. Do not install a
parallel chart system beside one already present.

Implement the full applicable matrix from the website reference: quality,
dimensions, disagreement, AI/human judging, audit failures, token composition,
per-class cost, cache/reasoning efficiency, wall time, cost/point, accounting
scopes, identified-other labels, unidentified work, total discovered work,
coverage, pairwise performance, model/harness/provider patterns, operations
overhead, metadata availability, and cycle timelines.

Link list/filter state to charts. Use exact-value tooltips, stable configuration
colors, accessible controls, table fallbacks, sample size, provenance, missing
states, responsive layouts, and reduced motion. Prefer honest bars, lines,
scatterplots, matrices, and small multiples over decorative charts.

## 6. Preserve all metadata

Give every reviewed field a display path. High-value facts appear in summaries;
secondary metadata appears in expandable panels; full provenance appears on
run/cycle detail pages. Include raw/normalized token semantics, field
provenance, unavailable values, rates, thread/session/tool metadata, errors,
evidence, audit commands, judges, disagreement, scopes, cycle/source hashes,
and publication freshness.

Do not overload the initial list. Progressive disclosure is not omission.

## 7. Copy and calls to action

Use plain, evidence-backed copy. Preserve the successful CTA quantity and
placement from the 11bench pattern while distinguishing:

- **Run it yourself** — reproduce/open the benchmark being viewed, using its
  source/deployment instructions.
- **Run your own** — create a benchmark with the plugin, linking to
  `https://ai.rj11.io/plugins/benchmarks`.

Use both meanings consistently at root, parent, benchmark, and cycle levels.

## 8. Apply the 11ai design language

Follow `$11ai-design-styleguides`: neutral semantic OKLCH tokens, Inter/sans
prose plus Geist-style mono metadata, thin borders, restrained radii/shadows,
type-led hierarchy, uppercase mono kickers, one quiet accent, light/dark parity,
subtle hover motion, and high information clarity. Reuse the target's semantic
tokens and components. Non-root compactness must not become cramped.

## 9. Static generation and async updates

Scan source artifacts at build time, generate every hierarchy route, and keep
malformed/partial benchmarks from breaking the whole tree. Label stale/draft
data and publish only reviewed facts as final.

Adding a benchmark, parent, reviewed cycle, run, judge, scope, or metadata field
must appear after the next build without component edits. Historical cycle URLs
remain valid. The latest pointer changes only after review.

## 10. Verify

- Validate indexes and every reviewed input.
- Typecheck, lint, test, and production-build every modified app.
- Verify generated route counts at all levels.
- Test root plus one parent, benchmark, cycle, and run page.
- Test search/filter/sort/URL persistence and chart/list linkage.
- Reconcile displayed accounting totals and token classes to source artifacts.
- Test light/dark, desktop/mobile, keyboard, reduced motion, and missing data.
- Check both CTA destinations and one exact source deep link per level.
- Build twice; the second build must not duplicate data or create a content diff.

## Hard failures

- Using the general project-site skill instead of this benchmark skill.
- Covering only the root website while parent/child apps exist.
- A spacious marketing layout on dense non-root analytical pages.
- Hardcoded benchmark lists, counts, results, or chart data.
- Dropping unrecognized metadata instead of preserving it.
- Hiding judge, unidentified, identified-other, or total accounting scopes.
- Recomputing owned benchmark metrics in UI code.
- Duplicate nodes or marker sections after a resumed or next-day cycle.
