# shadcn v4 update and migration checklist

Use this checklist for changes broader than adding one new component. The goal is to preserve locally owned behavior while making the source and target baselines explicit.

## Establish the two baselines

- Record the current and target shadcn CLI versions, date, changelog, and component docs.
- Capture framework, React, package manager, Tailwind family, primitive base, style, icons, fonts, aliases, CSS entry, and `components.json`.
- Inventory installed components, dependencies, registry provenance, local modifications, consumers, tests, and visual fixtures.
- Classify source as stock, lightly customized, heavily customized, generated, registry-sourced, or unknown.
- Create a clean reviewed branch or other tested rollback point before generating files.

## Preview and classify each diff

Run `npx shadcn@4.14.1 add COMPONENT --dry-run` and `--diff` for each component family. Classify every hunk as upstream correction, target-base API change, styling or token change, accessibility fix, dependency change, local behavior to preserve, or accidental overwrite.

Do not approve a diff until file destinations, aliases, packages, CSS variables, and all consumers are known. Where no preview exists, such as documented preset application, reduce scope and capture before-and-after snapshots.

## Migrate primitive bases deliberately

For Base UI, Radix, or React Aria transitions, build a component mapping for imports, composition API, slots or render props, controlled and uncontrolled state, event payloads, portals, focus management, dismissal, positioning, and state attributes. Migrate one interaction family at a time.

Search for consumers that depend on primitive-specific props such as `asChild`, `render`, or custom event shapes. A compiling wrapper does not prove equivalent focus, keyboard, pointer, or screen-reader behavior.

## Handle Tailwind and presets separately

Separate Tailwind-family changes from component source reconciliation when possible. Verify CSS entry ordering, theme-variable definitions, dark mode, animation utilities, arbitrary variants, class merging, and any version-specific build integration.

Resolve a preset before applying it. Prefer `--only theme` or `--only font` for narrow requests; treat a full preset as configuration plus component-source migration. Review chart tokens and visual fixtures after any theme change.

## Treat eject as a terminal ownership transfer

The CLI documents `eject` as irreversible. It inlines `shadcn/tailwind.css` and removes that dependency, transferring future maintenance to the project.

Before approval, confirm the exact generated CSS, dependency and lockfile changes, build behavior, update strategy, ownership documentation, and rollback point. Do not run eject merely to inspect its output.

## Verify and hand off

- Build and type-check every package that imports changed source.
- Test default, disabled, invalid, loading, open, closed, focus, keyboard, portal, responsive, dark, RTL, reduced-motion, and hydration states that apply.
- Compare visual fixtures and check accessible names, relationships, focus order, focus restoration, announcements, and contrast.
- Commit by migration boundary so each component family can be reverted independently.
- Report exact commands, versions, files, dependencies, consumers, preserved modifications, intentional changes, failures, deferred work, and rollback procedure.
