# shadcn v4 chart workflows

Version baseline: shadcn CLI 4.14.1 and Recharts v3, stable, researched 2026-07-31 from the official [chart component documentation](https://ui.shadcn.com/docs/components/base/chart) and [charts library](https://ui.shadcn.com/charts).

## Begin with the question

State the decision or relationship the chart should reveal before selecting a visual. Resolve source, filters, grouping, aggregation, units, time zone, missing values, denominators, and freshness. Keep transformation in a named function with tests rather than inside JSX.

## Choose the chart family

- Line or area: ordered change over time; use a real time order and do not imply continuity across missing intervals.
- Bar: compare discrete categories; start quantitative bars at zero unless a clearly annotated analytical reason requires otherwise.
- Stacked bar or area: show composition and total together; use consistent series order and avoid stacks with too many categories.
- Pie or radial: use only for a small part-to-whole set with a meaningful total; labels and a table are often clearer.
- Radar: use sparingly for comparable normalized dimensions, never raw incompatible units.

## Shape data deliberately

Use stable data keys and one clear type per field. Parse dates and numbers once. Decide whether null means unknown, zero, not applicable, or absent; do not coerce without evidence. Sort categories by the analytical contract, not accidental object order. Aggregate on the server or in a memoized transformation when data is large.

## Configure semantic series

`ChartConfig` maps series keys to human labels, colors, and optional icons. Keep keys aligned with data. Use semantic CSS chart tokens such as `var(--chart-1)` directly with the current component; older `hsl(var(--chart-1))` patterns belong to the Recharts v2-era implementation.

Color must not be the sole distinction. Combine color with labels, line styles, shapes, patterns, or direct annotation where needed. Check contrast in light and dark themes and for common color-vision deficiencies.

## Size and responsiveness

`ChartContainer` must receive a measurable height, minimum height, or aspect ratio so Recharts ResponsiveContainer can calculate dimensions on first render. Test narrow cards, wide dashboards, hidden tabs, server hydration, and late font loading. Avoid fixed pixel dimensions that clip localized labels.

## Axes and scales

Label units near the axis or in the formatter. Choose domains intentionally and disclose truncation. Format ticks consistently with tooltips and summaries. Prevent label collisions through fewer ticks, wrapping, rotation, or a different chart—not unreadably small text. For time series, show time zone and interval when ambiguity matters.

## Tooltip and legend contracts

Use `ChartTooltip` with `ChartTooltipContent`; configure `labelKey`, `nameKey`, indicator, label formatter, and value formatter from the data contract. Tooltip values must include units and honest precision. Tooltips are supplementary because hover-only content is inaccessible and unavailable in print.

Use `ChartLegend` and `ChartLegendContent` when multiple series need identification. Preserve stable series order between marks, tooltip, legend, and any accessible table. Avoid legends for a single directly labeled series.

## Interaction and state

Keep persistent selection or active shapes in application state. In Recharts v3, `ChartTooltip.defaultIndex` is only for initial tooltip state. Define pointer and keyboard behavior, reset paths, and touch targets. Never make a data point look clickable without an actual action and accessible name.

## Recharts v3 update notes

When updating older charts:

- Use direct CSS variables instead of wrapping current tokens in `hsl()`.
- Keep persistent active state outside Tooltip.
- Remove a child Bar `layout` when the parent BarChart already defines it.
- Provide measurable ChartContainer dimensions.
- Review every upstream chart component diff because the project owns its source.

## Accessibility

Enable Recharts' accessibility support when appropriate and always provide a nearby textual summary or semantic table for essential values. Give the visualization a descriptive heading and explain units, period, filters, and notable limitations. Keyboard users must reach interactive controls without being trapped inside decorative marks.

## Performance

Avoid thousands of SVG marks. Aggregate, sample with a documented method, paginate, or choose canvas only when the product stack supports it. Memoize expensive transformations, stable configs, and formatters. Measure render and interaction on representative data rather than optimizing an empty demo.

## Verification and review traps

Test data extremes, empty and loading states, nulls, negatives, localization, time zones, responsive containers, theme changes, screenshots, print, keyboard, screen reader summary, and production bundle. Reject dual axes without strong justification, unlabeled units, misleading domains, decorative 3D, rainbow palettes, hidden missing data, and conclusions stronger than the source supports.
