# shadcn CLI v4 integration recipes

Version baseline: shadcn CLI 4.14.1, stable, researched 2026-07-31.

Primary sources: [installation guides](https://ui.shadcn.com/docs/installation), [monorepo guide](https://ui.shadcn.com/docs/monorepo), [Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4), [React Hook Form guide](https://ui.shadcn.com/docs/forms/react-hook-form), and [chart documentation](https://ui.shadcn.com/docs/components/base/chart).

## Framework and server boundaries

Use the framework detected by `info --json`. Components using state, effects, event handlers, browser APIs, portals, or Recharts need a client boundary in server-component frameworks. Keep the directive as narrow as the interactive subtree. Do not mark an entire route client-side merely because one Button opens a Dialog.

## Tailwind CSS

Use the Tailwind family recorded by the project. Tailwind v4 uses CSS-first theme variables in the configured global stylesheet; Tailwind v3 uses `tailwind.config.*`. Keep semantic shadcn tokens such as `background`, `foreground`, `primary`, `muted`, `accent`, `destructive`, `border`, and chart variables centralized.

## Monorepos

Resolve whether components belong to an app or shared UI package. Run CLI commands with the correct `--cwd` and confirm aliases resolve from every consumer. Install primitive, chart, form, and table dependencies in the package that imports them. Do not duplicate `cn`, global tokens, or component source across packages without an explicit publishing model.

## Forms and data

Map React Hook Form or another state owner once to Field and control props. Use `data-invalid` on Field and `aria-invalid` on the control. For TanStack Table, keep column definitions, sorting, filtering, selection, pagination, and server state outside presentational Table primitives.

## Charts

The current chart component composes Recharts v3 rather than wrapping it. Keep data transformation outside render, use stable keys, provide a measurable height, and let chart configuration own semantic labels and colors. See the dedicated charts skill before adding dependencies.

## Testing and CI

Query by role, name, label, and visible state. Await portals and transitions. Stub missing browser APIs once in shared setup. CI should run the same package manager and production build without re-running `init`, `apply`, or unreviewed `add` commands. Private registry tokens belong in secret storage and must never appear in logs.
