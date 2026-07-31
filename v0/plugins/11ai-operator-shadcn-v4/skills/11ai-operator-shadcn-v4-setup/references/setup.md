# shadcn CLI v4 setup reference

Version baseline: shadcn CLI 4.14.1, stable, researched 2026-07-31.

Primary sources:

- [shadcn npm package](https://www.npmjs.com/package/shadcn)
- [shadcn CLI documentation](https://ui.shadcn.com/docs/cli)
- [CLI v4 announcement](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [components.json reference](https://ui.shadcn.com/docs/components-json)
- [current changelog](https://ui.shadcn.com/docs/changelog)

## Choose the project surface

CLI v4 supports project templates for Next.js, Vite, React Router, TanStack Start, Astro, and Laravel. Preserve an existing framework; templates are for new or explicitly scaffolded work. Use `--monorepo` only after package ownership and workspace aliases are resolved.

## Choose the primitive base

New projects currently default to Base UI. Radix remains supported and existing Radix projects should remain unchanged unless migration is requested. React Aria is a first-class base in the current stable platform. Component APIs and dependencies differ by base, so record the choice in `components.json` and always fetch base-specific docs.

## Choose style and preset

Presets encode theme, base, style, icons, fonts, radius, and other design-system choices. Resolve and preview a preset code before applying it. Never copy a plausible code or switch an established application's preset during setup without explicit approval.

## Preserve Tailwind ownership

shadcn supports Tailwind v3 and v4 but configures them differently. Use the existing family and the CSS path recorded by the CLI. Tailwind v4 tokens live in the owned global CSS; Tailwind v3 uses its JavaScript config. Do not create a second global CSS file.

## Configure aliases

Aliases in `components.json`, TypeScript or JavaScript config, bundler config, and workspace packages must resolve to the same destinations. Use `info --json` to verify absolute paths before adding any component. In a monorepo, decide whether UI source lives in the app or a shared package and keep dependency installation with that owner.

## Verify without surprise writes

After `init`, inspect every diff, dependency, CSS variable, and generated utility. Run `info --json`, `docs button`, and `add button --dry-run`. Add a smoke component only when requested, then typecheck, build, render, and test its keyboard and theme states.
