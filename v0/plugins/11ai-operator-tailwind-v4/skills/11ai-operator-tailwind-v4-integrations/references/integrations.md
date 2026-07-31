# Tailwind CSS v4 integration recipes

Version baseline: Tailwind CSS 4.3.1, stable, researched 2026-07-31.

Primary sources: [installation guides](https://tailwindcss.com/docs/installation/framework-guides), [compatibility](https://tailwindcss.com/docs/compatibility), [detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files), and [functions and directives](https://tailwindcss.com/docs/functions-and-directives).

## Build adapter ownership

Use exactly the adapter invoked by the project's build surface. Keep the adapter and core package aligned to `^4.3.1`. Do not configure the core `tailwindcss` package directly as a PostCSS plugin in v4; use `@tailwindcss/postcss`.

## CSS modules and component style blocks

Separately bundled CSS does not automatically see custom theme definitions, utilities, or variants from another stylesheet. Reference the owned main CSS entry without emitting duplicate CSS:

```css
@reference "../../app.css";

.heading {
  @apply text-2xl font-bold text-brand-600;
}
```

Prefer direct CSS variables when applying only theme values. Resolve the reference from the actual stylesheet location.

## Monorepos and component packages

Automatic detection respects ignore rules. Add only the exact authored package source with `@source`; do not scan an entire workspace or built distribution. Decide whether a library ships compiled CSS or expects source scanning, and avoid doing both accidentally.

## Editors

Point Tailwind CSS IntelliSense at the real CSS entry and workspace root. Completion is not build evidence; verify the actual generated artifact.

## CI and deployment

Run the production adapter in a clean checkout with the documented browser target. Cache package-manager data instead of user-owned output unless the repository explicitly commits assets. Compare warnings, exit code, CSS size, and representative rendering. Redact environment values from logs.
