---
name: 11ai-design-styleguides
description: "Apply the visual and interaction language of 11ai/www to new or existing web interfaces: neutral semantic color tokens, Inter/mono typography, type-led hierarchy, restrained shadcn components, compact analytical variants, accessible responsive layouts, and honest data visualization. Use when designing, restyling, reviewing, or implementing a website, dashboard, catalog, report, benchmark UI, or data-heavy frontend that should look and behave like 11ai."
---

# 11ai Design Styleguides

Create quiet, precise interfaces where typography and information structure do
the work. Inspect the existing stack first and reuse its tokens, theme wiring,
components, and chart library.

Read the references required by the task:

- [Foundations](references/foundations.md) for tokens, type, spacing, themes,
  motion, and accessibility.
- [Components and layouts](references/components-layouts.md) for page density,
  navigation, catalogs, tables, cards, CTAs, and responsive behavior.
- [Data visualization](references/data-visualization.md) whenever charts,
  metrics, reports, or analytical interfaces are involved.

## Workflow

1. Inventory framework, Tailwind/CSS version, shadcn setup, fonts, semantic
   tokens, theme provider, icons, charts, breakpoints, and existing conventions.
2. Classify the page as root/editorial or non-root/analytical. Root pages may
   breathe; non-root pages use the compact mode without becoming cramped.
3. Write a one-sentence design direction using the content's actual purpose.
4. Define hierarchy and data density before decoration. Decide what is summary,
   comparison, control, detail, provenance, and missing state.
5. Implement with semantic tokens and existing components. Do not introduce a
   second design system or raw color palette.
6. For data, preserve exact values and provenance, then choose the simplest
   chart that reveals the relationship.
7. Verify light/dark, mobile/desktop, keyboard, reduced motion, zoom, empty and
   error states, long text, and high-density data.

## Non-negotiables

- Use neutral light/dark semantic tokens and one restrained functional accent.
- Use sans for prose/headings and mono for IDs, commands, metadata, and numbers.
- Build hierarchy through scale, weight, spacing, and borders—not gradients,
  oversized shadows, or card proliferation.
- Prefer thin separators and quiet surfaces; every container must have a job.
- Keep motion short and functional; honor `prefers-reduced-motion`.
- Keep exact values accessible even when a chart summarizes them.
- Never trade away focus visibility, contrast, keyboard access, or responsive
  integrity for visual minimalism.

## Handoff

Report the applied density mode, tokens/components reused, visualization
choices, responsive/accessibility checks, and any deliberate deviations from
the guide. Verify the actual rendered interface before declaring completion.
