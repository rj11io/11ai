# Benchmark website data and visualization matrix

Build every page from reviewed cycle data, analyzer output, and accountant
artifacts. Never scrape rendered prose when structured data exists.

## Hierarchy

- Root collection: all parent groups and benchmarks; spacious editorial hero.
- Parent/group: children, cross-child aggregates, history; compact header.
- Benchmark: reviewed cycles, runs, evidence, scores, costs; compact header.
- Cycle: judge/audit/accounting snapshot and report; dense analytical layout.
- Run: full metadata, evidence, token/cost trace, audit and scores.

Every node has breadcrumbs, parent/child links, canonical source links, and a
stable `nodeId`. Non-root sites use smaller type, tighter vertical padding,
denser controls, compact cards, and tables as the default representation.

## Primary benchmark list

Show objective, skill under test, freshness, run count, winner, score, total
benchmark cost, value pick, judge composition, audit status, available
surfaces, and cycle count. Search benchmark/model/harness/provider/objective.
Persist search, filters, sorting, columns, and view in URL parameters.

Support filters for group, objective, skill, provider, harness, model, effort,
cycle/date, review status, audit status, judge type/count, surface, score, cost,
cost per point, wall time, cache efficiency, and metadata availability. Sort by
newest, name, score, cost, value, runs, judges, cache rate, or coverage.

## Visualization inventory

Prefer shadcn charts (Recharts). Install the official chart component only when
the project is compatible and installation is authorized. Link charts to the
same filter state as the list.

- Cost vs score scatter with efficient frontier.
- Rank and weighted score bars.
- Dimension comparison and judge dispersion.
- Holistic rank vs rubric rank.
- Human vs AI judge distributions.
- Token composition: uncached, cached read, cache writes, output, reasoning.
- Per-class and per-model cost composition.
- Accounting scopes: benchmark, judge, each identified-other label,
  unidentified, benchmark+judge, and total.
- Cache hit/write efficiency, output/input ratio, cost/minute, cost/turn.
- Wall time vs quality and cost per point.
- Audit failures by check and configuration.
- Harness/model/provider participation and disqualification rates.
- Benchmark coverage, pairwise results, normalized rank, and relative score.
- Cycle timeline showing new runs, judges, score movement, cost, and freshness.
- Operations overhead, pricing changes, missing/unavailable metadata.

Every chart needs exact-value tooltips, legend, stable configuration colors,
keyboard-accessible controls, textual/table fallback, sample size, provenance,
and an explicit missing-data state. Honor reduced motion. Do not use radar charts
when a grouped bar or small multiples communicate values more accurately.

## Calls to action

Keep the established CTA quantity and placement. Distinguish:

- **Run it yourself**: reproduce or open the benchmark currently viewed.
- **Run your own**: create a new benchmark via
  `https://ai.rj11.io/plugins/benchmarks`.

Use those labels and meanings consistently at every hierarchy level.
