# Benchmark WWW visualization and table patterns

This is the interaction and presentation reference for `11ai-benchmark-www`.
It translates the strongest patterns observed on the OpenAI GPT-5.6 article and
current Artificial Analysis benchmark pages into requirements for our own
benchmark exploration sites. Use it with the [website data and visualization
matrix](./website-data-and-visualizations.md); it defines how an applicable
chart or table should behave, not merely which metric it should contain.

The goal is an elegant analytical product: editorial enough to explain what a
benchmark means, and dense enough for a technical reader to compare models,
harnesses, providers, cycles, costs, and evidence without leaving the page.
Borrow interaction patterns and information architecture. Do not copy another
site's visual assets, branding, wording, or proprietary implementation.

## Research basis

The following pages were reviewed on 2026-07-18. They are inspiration and
pattern references; the benchmark WWW must only expose values supported by the
reviewed artifacts available to it.

- [OpenAI GPT-5.6](https://openai.com/index/gpt-5-6/) — editorial narrative,
  sticky table of contents, tabbed benchmark views, responsive figures, metric
  selectors, legends, reference lines, exact point tooltips, explanatory
  captions, and dataset downloads.
- [Artificial Analysis home](https://artificialanalysis.ai/) — metric highlight
  cards, directional labels, model counts, provider identity, compact charts,
  chart controls, filters, copy-link, image export, and data export.
- [Artificial Analysis model comparison](https://artificialanalysis.ai/models)
  — metric-family tabs, model/provider selectors, categorical series toggles,
  log and inverted scales, stacked cost views, timelines, and methodology
  sections.
- [Artificial Analysis model detail](https://artificialanalysis.ai/models/gpt-5-6-sol)
  — ranked summary cards, technical specification tables, expandable
  explanations, detail-page linking from chart points, faceted filters, and
  concise tooltips.
- [Artificial Analysis provider benchmarking](https://artificialanalysis.ai/models/gpt-5-6-sol/providers)
  — workload selectors, blended-ratio controls, provider comparisons, grouped
  table headers, feature flags, inline documentation links, and unavailable
  values.
- [Artificial Analysis coding-agent benchmarks](https://artificialanalysis.ai/agents/coding-agents)
  — benchmark breakdown tabs, model-versus-agent color modes, token and cost
  distributions, cost/time scatterplots, attractive-quadrant guidance, and
  explicit chart-reading methodology.
- [Artificial Analysis GDPval-AA evaluation](https://artificialanalysis.ai/evaluations/gdpval-aa)
  — leaderboard tables, confidence intervals, sample counts, human baselines,
  example-task galleries, token-class views, Elo/cost scatterplots, and release
  timelines.
- [Artificial Analysis hardware benchmarks](https://artificialanalysis.ai/benchmarks/hardware)
  — configuration selectors, per-accelerator/per-MW views, concurrency
  controls, SLO/workload context, linear/log scale switches, and provider
  comparisons.
- [Artificial Analysis text-to-image leaderboard](https://artificialanalysis.ai/image/leaderboard/text-to-image)
  — sortable tables with rank ranges, creator/model identity, uncertainty,
  sample count, release date, pricing, model status, and open-weights links.

## Quality bar

Every visualization or substantial table should answer four questions without
requiring the user to inspect source code:

1. What is being measured, in which unit, and is higher or lower better?
2. Which models, harnesses, providers, efforts, runs, or cycles are included?
3. How current, complete, and trustworthy is the data?
4. What can the user do next: filter, compare, inspect exact values, download,
   open the source, or run the benchmark?

Do not add a chart just because a field exists. If a visualization does not
make a comparison, trend, distribution, composition, relationship, or coverage
gap easier to understand than a table or sentence, omit it. If a requested
dimension is unavailable, show a clear unavailable state rather than inventing
or silently substituting a value.

## Page composition

Use an editorial-to-analytical rhythm similar to the research references:

- A compact title and one-sentence purpose explain the page.
- Summary cards surface the few most decision-useful values. Each card has a
  label, value, unit, directionality, comparison basis, freshness/status, and a
  route to detail. Never present a rank without its denominator, for example
  `#2 of 187` rather than `#2`.
- A local table of contents or section navigation is appropriate on long
  benchmark, cycle, and model pages. Keep the reader's position visible while
  scrolling.
- Each chart or table section has a title, short definition, scope/sample note,
  controls, the visualization, and a brief “how to read” or methodology note
  when the metric is composite, derived, unfamiliar, or easy to misread.
- Related metrics use tabs or segmented controls so the page stays focused:
  performance, quality, cost, latency, tokens, time, and history are families;
  they are not unrelated charts competing for attention.
- Use progressive disclosure for methodology, field definitions, technical
  specifications, examples, and raw provenance. Disclosure must not hide the
  existence of missing or unavailable data.

## Shared chart-card contract

Each chart card should implement the following where the data supports it.

### Header and context

- Plain-language title and metric definition.
- Unit and directionality: `Higher is better`, `Lower is better`, or
  `Descriptive`, with the direction stated near the value or axis.
- Scope: selected models/configurations and a count such as `28 of 576 models`;
  for our sites this may be `12 of 48 runs` or an equivalent stable count.
- Date or freshness, cycle, benchmark version, and status when relevant.
- Source/methodology link and a compact provenance note.
- Copy-link control that preserves the current route, tab, filters, series,
  scale, and selected comparison items in URL parameters.
- Download data and download image controls. Downloaded data must correspond to
  the visible selection, metric, and filters, and include units and identifiers.
- A table-view toggle or a linked semantic table fallback for every chart that
  contains comparison data.

### Controls

Use the least complicated native control that expresses the choice. Controls
must be keyboard accessible, visibly selected, and reflected in the URL.

- Tabs for related metrics, datasets, benchmarks, token classes, workload
  types, prompt types, or time windows.
- A searchable model/configuration selector with selected-count feedback.
- An “Open filters” control with grouped facets: provider, model, harness,
  effort, cycle/date, benchmark surface, status, review/audit state, and field
  availability. Show active filters, allow removing one facet, and provide
  `Clear all`.
- An “Add model/configuration” action for a specific provider or run when a
  broad default selection would hide an important comparison.
- Series chips or radio controls for dimensions such as Model/Agent,
  AI/Human judge, Answer/Reasoning, or Cache hit/Input/Output.
- A `Color by` control only when the color grouping changes the interpretation;
  always retain stable identity colors within the current page.
- Scale controls such as Linear/Log or exact/inverted only when the scale is
  useful. Label the active scale in the axis and accessible name.
- Workload, concurrency, SLO, sampling, or blended-ratio controls when the
  metric depends on them. Keep the selected context next to the chart rather
  than in a distant page header.

Do not make controls decorative. A control must change the visible data, the
table, the export, or the explanation. Keep reasonable defaults, retain state
on back/forward navigation, and make the result count update immediately.

### Plot and visual encoding

- Use bars for rank/value comparison, lines for time or ordered progression,
  scatterplots for trade-offs, stacked bars for composition, distributions for
  disagreement/variance, and small multiples when separate scales or groups
  would otherwise overlap.
- Use a baseline, target, human reference, average, or efficient frontier only
  when it has a documented meaning. Label it directly in the legend or plot.
- Use shaded “most attractive” regions or quadrants only when the axes and
  optimization direction make the region defensible. Explain the region in
  text; do not imply a universal winner when the trade-off is subjective.
- Prefer sparse gridlines, readable labels, compact legends, and direct value
  labels where they improve scanability. Avoid 3D, chart junk, and radar
  charts when grouped bars or small multiples are clearer.
- Encode status, missingness, uncertainty, and direction with more than color:
  use text, symbols, patterns, or position. Provider/model identity should be
  reinforced with text and, where available, a logo with an accessible label.
- Use log axes for highly skewed cost, latency, or token distributions only
  after checking that they clarify the comparison. Say `Log scale` in the axis
  label and explain how to read it.

### Tooltips and point interaction

Hover is an enhancement, never the only way to access data. A tooltip for a
point, bar, cell, or line must include:

- full model/configuration identity and provider/harness when relevant;
- the exact metric value, unit, and displayed precision;
- effort, workload, cycle, prompt type, or other selected context;
- score/dimension name and rank when applicable;
- confidence interval, dispersion, sample count, or judge count when present;
- source/release/freshness context when it changes interpretation;
- a clear click-through affordance to the relevant model, run, cycle, or
  evidence detail page when a stable route exists.

For example, a benchmark point should expose the equivalent of:
`Model · Effort · API cost · Score`, not just a bare number. Tooltips need an
accessible focus/keyboard path and a text/table equivalent for touch, screen
readers, and users who disable hover interactions.

## Table contract

Tables are a first-class analytical view, not an afterthought or a screenshot
of a chart.

- Use a semantic HTML table with a visible caption or heading, a sticky header,
  clear sort buttons, and the active sort direction announced accessibly.
- Keep identity columns visible: rank/range, creator/provider, model, harness,
  configuration, effort, cycle, and status. Link the row to a stable detail
  page when one exists.
- Support search/filter text such as `Filter, e.g. OpenAI, GPT, Meta` for long
  lists, result counts, pagination or virtualization, and a column chooser.
  Preserve filters, sort, selected columns, and page in the URL when practical.
- Use grouped header bands when there are several metric families, for example
  `Quality`, `Cost`, `Performance`, `Tokens`, `Features`, and `Provenance`.
  Provide an `Expand columns` action for dense tables and a useful compact
  default on narrow screens.
- On mobile, keep identity, rank/status, primary score, and primary cost or
  speed visible; move secondary values into an expandable row or detail view.
- Display uncertainty and evidence fields when available: confidence interval,
  sample count, judge count/type, disagreement, audit state, coverage, and
  release/freshness date. Never imply that a missing interval is zero variance.
- Render unavailable, not applicable, pending, failed, excluded, and redacted
  distinctly where the source distinguishes them. Use `--` only with a legend
  or tooltip explaining it; never convert missing data to zero.
- Include units in column headings or values, use consistent precision, and
  avoid ranking values that are not comparable in the visible scope.
- Allow a chart/table toggle to show the same filtered dataset. The table is
  the exact-value, keyboard-accessible fallback for every comparison chart.
- Where data supports it, include source links in cells: provider docs, model
  page, repository, open-weights page, evidence, or exact cycle/run result.

For benchmark data, the useful column vocabulary usually includes:

| Group | Candidate fields |
| --- | --- |
| Identity | Rank, range, benchmark, cycle, run, provider, model, harness, effort, status |
| Quality | Score, weighted score, per-dimension score, holistic/rubric rank, judge type/count, confidence interval, disagreement |
| Cost | Total cost, benchmark cost, judge cost, cost per point, price scope, currency, accounting scope |
| Performance | Wall time, latency, throughput, turns, tool calls, concurrency, cost per minute/turn |
| Tokens | Input, output, reasoning, cache read/hit, cache write, total, output/input ratio |
| Provenance | Sample count, coverage, audit state, evidence links, source digest, cycle date, release date, freshness |

Only render fields present in the reviewed contract. The table should degrade
gracefully when a benchmark has no judge breakdown, cache accounting, or
provider metadata.

## Recommended benchmark page patterns

### Root and parent pages

Lead with a small set of highlight cards and a searchable/filterable benchmark
catalog. Give each benchmark card its own `Run this benchmark` and `Run your
own benchmark` references. Add cross-benchmark charts only when the compared
scores have a documented common scale; otherwise show a coverage/timeline or
catalog view.

### Benchmark page

Show the latest reviewed cycle, winner/value context, freshness, judge/audit
state, and benchmark-level CTA references. Use tabs for cycle history,
quality/dimensions, cost/accounting, tokens/efficiency, wall time, and
configuration/provider comparisons. Provide both a latest-results table and a
history view.

### Cycle page

Show the cohort and scope first, then score/rank, dimension/judge distributions,
cost and token composition, time/turns, audit failures, and evidence. Make the
cycle table the authoritative exact-value view. Link every result to the source
run or evidence when the reviewed artifacts provide a stable identifier.

### Read-only run detail

Expose run identity, configuration, status, score, judge/audit summary,
metadata, token/cost trace, and evidence links without changing the run app or
run-owned artifacts. If a trace is too large for the initial page, use
expandable sections and downloads.

## Data integrity and provenance

The website is a presentation layer over owned artifacts. Do not calculate
scores, prices, cost per point, ranks, normalized values, or reconciliations in
React components. Read reviewed values in their documented semantics and only
reshape arrays for a chart library.

Every substantial chart/table should make it possible to identify:

- the source artifact and digest/version;
- the benchmark, cycle, cohort, and selected configurations;
- the calculation owner and methodology for derived fields;
- freshness and publication state;
- sample/coverage limits and exclusions;
- whether a value is observed, derived, unavailable, pending, or invalid.

When source data is malformed or incomplete, preserve it and render an explicit
missing/invalid state. Do not repair benchmark data in the website build.

## Accessibility and responsive behavior

- Use semantic headings, landmarks, table headers, labels, native selects/radios
  where suitable, and ARIA only where needed.
- Every control has a visible focus state, an accessible name, and a keyboard
  operation path. Tabs expose selected state; dialogs trap focus and close
  predictably.
- Do not rely on color alone. Ensure contrast in light and dark themes, and
  pair chart colors with labels, markers, or patterns.
- Provide a text/table fallback for every chart, including scatterplot points
  and uncertainty. Make tooltip information available on focus and touch.
- Honor reduced-motion preferences and avoid auto-advancing content that
  changes analytical state.
- Test narrow layouts with long model names, multiple selected filters, dense
  tables, and unavailable values. Preserve identity and the primary decision
  metric before secondary decoration.

## Validation checklist

Before handing off a benchmark WWW page, verify:

- every applicable matrix dimension has an understandable visual or table;
- every chart states metric, unit, directionality, scope, freshness, and source;
- exact values are available through tooltip and table/focus fallback;
- filters, tabs, series, scale, and comparison selections update both chart and
  table and persist in the URL;
- downloads contain the visible filtered dataset, units, and stable IDs;
- tables sort accessibly, expose useful columns, show uncertainty/status, and
  remain usable on narrow screens;
- missing, pending, excluded, and invalid values are explicit;
- colors remain stable for the same model/configuration within a page;
- source, methodology, evidence, and exact results links work;
- the two required benchmark CTAs are present with the exact labels;
- scope verification passes and docs/build checks pass without modifying
  protected run-owned artifacts.
