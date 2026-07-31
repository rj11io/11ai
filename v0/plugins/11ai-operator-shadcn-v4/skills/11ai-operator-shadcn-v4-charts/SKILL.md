---
name: 11ai-operator-shadcn-v4-charts
description: "Install, inspect, build, customize, test, optimize, and safely update shadcn v4 charts using Recharts v3, ChartContainer, ChartConfig, semantic tokens, axes, legends, tooltips, interactions, responsive sizing, accessible alternatives, and explicit data contracts. Use when the user asks for charts, graphs, dashboards, or data visualization in a shadcn project."
---
# 11ai shadcn v4 charts

Version baseline: shadcn CLI 4.14.1 with the current shadcn chart component and Recharts v3, verified 2026-07-31; exclude older Recharts v2 assumptions and inspect the installed chart source before updating.

Resolve the analytical question, data owner, row and series schema, units, null policy, aggregation, time zone, chart type, comparison baseline, audience, accessibility alternative, container size, and installed chart customizations before writing.

## Inspect chart context first

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 docs chart
npx shadcn@4.14.1 add chart --diff
rg -n 'ChartContainer|ChartConfig|ChartTooltip|ChartLegend|recharts|--chart-' src app components packages
```

Confirm the Recharts major, chart source ownership, CSS variables, data transformations, existing visual grammar, and whether the component is already customized. Redact private or identifying data before quoting examples.

## Preview installation or update

```bash
npx shadcn@4.14.1 add chart --dry-run
npx shadcn@4.14.1 add chart --view
npx shadcn@4.14.1 add chart --diff
```

Review source files and Recharts dependencies before `add`. Never replace a customized chart component or upgrade Recharts without an explicit, file-level diff and approval.

## Build from the data contract

Use `ChartConfig` for semantic series labels, colors, and optional icons. Compose Recharts primitives inside `ChartContainer`; shadcn does not wrap the Recharts API. Give the container measurable height or aspect ratio so responsive measurement succeeds.

Read [references/chart-workflows.md](references/chart-workflows.md) for chart selection, data shaping, axes, scales, colors, tooltip and legend contracts, interaction, accessibility, Recharts v3 updates, performance, testing, and review traps.

## Verify deeply

Test empty, single-point, dense, null, negative, zero, extreme, duplicate-label, long-label, localized, narrow, wide, light, dark, and print states. Verify units, domains, sorting, tooltip values, legend labels, keyboard or pointer interaction, accessible summary or table, and no misleading truncation.

## Report

State the question answered, source and transformation, chart type, series and units, Recharts and component versions, files and dependencies, accessibility alternative, performance and visual checks, known limits, and rollback. Never claim insight the data does not support.
