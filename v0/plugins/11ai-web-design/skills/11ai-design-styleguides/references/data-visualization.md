# Data visualization

## Library and styling

Prefer the existing chart system; for shadcn projects use its chart wrapper and
Recharts. Reuse semantic chart tokens. Add a library only when compatible,
authorized, and no suitable system exists.

Charts use quiet grids, thin axes, concise labels, tabular values, restrained
animation, and the same configuration color everywhere. Tooltips include exact
value, unit, cohort/filter context, sample size, and provenance where relevant.

## Chart selection

- Bars: compare discrete values, ranks, dimensions, costs, or failures.
- Stacked bars: composition such as token classes or accounting scopes.
- Lines/areas: cycles or time; do not imply continuity between unrelated runs.
- Scatterplots: cost/quality, time/quality, efficiency frontiers.
- Heatmaps/matrices: pairwise results, metadata availability, audit patterns.
- Small multiples: many configurations or dimensions without one crowded plot.
- Tables: exact values, sparse data, or more than two encodings.

Avoid pie charts with many slices, 3D effects, dual axes without compelling
need, truncated axes that exaggerate differences, and radar charts when grouped
bars communicate more honestly.

## Interaction

Link chart state to page filters and URL state. Support hover and keyboard
focus, legend toggles, zoom/range only when useful, and reset. Do not make
critical facts available only through hover.

## Missing data and provenance

Distinguish zero, unavailable, not applicable, stale, inferred, reported, and
filtered-out values. Show coverage alongside aggregates. Every chart has a
table or textual fallback and a concise statement of what it does not prove.

## Accessibility and performance

Give charts titles/descriptions, adequate contrast, non-color encodings,
keyboard-operable controls, reduced motion, and readable mobile fallbacks.
Aggregate or virtualize large datasets instead of rendering thousands of marks.
