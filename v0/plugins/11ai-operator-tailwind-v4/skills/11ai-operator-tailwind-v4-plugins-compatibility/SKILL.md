---
name: 11ai-operator-tailwind-v4-plugins-compatibility
description: "Operate Tailwind CSS v4 CSS plugins, JavaScript plugin compatibility, explicit config loading, source safelists, references, prefixes, important modifiers, Preflight, and legacy integration seams. Use when v4 must consume a plugin or retain bounded behavior from a v3-era setup."
---
# 11ai Tailwind CSS v4 plugins and compatibility

Version baseline: Tailwind CSS 4.3.1 (stable), verified 2026-07-31; validate every plugin against v4 and treat JavaScript config as explicit compatibility, not the default.

Resolve plugin provenance and release, v4 compatibility, CSS import order, legacy config options, generated API, source needs, and consumer count before changing dependencies or directives.

## Inspect first

```bash
npm ls tailwindcss @tailwindcss/typography @tailwindcss/forms --depth=0
rg -n '@plugin|@config|@reference|@source inline|prefix\(|important|preflight|plugins:|corePlugins:|safelist:|separator:' --glob '*.css' tailwind.config.* package.json
```

Review publisher, changelog, peer requirements, package scripts, permissions, and generated selectors. Note that v4 JavaScript config does not support legacy `corePlugins`, `safelist`, or `separator` options.

## Choose the compatibility boundary

- Prefer CSS-first theme, source, utility, and variant APIs for new v4 work.
- Keep `@config` only when an audited JavaScript configuration still provides supported behavior that has not yet moved to CSS.
- Use `@plugin` only for a package or local plugin whose actual release and instructions support the installed v4 family.
- Use `@reference` for separately bundled styles, not as a way to emit or duplicate the main stylesheet.

Count every unsupported config key and affected consumer before removing a legacy seam. Fold migration-wide changes into the migration skill instead of gradually mixing majors.

## Operate

Use CSS `@plugin` with an explicit package and options when the plugin supports v4. Use `@config` only to load a required JavaScript config that has been audited for supported options. Replace legacy safelists with bounded `@source inline()` patterns and use `@reference` for separately bundled styles.

Installing, updating, removing, reordering, or replacing a plugin or compatibility directive changes dependencies or global CSS; show the exact package, version, directive order, generated surface, consumer count, and rollback before acting. Never copy unknown third-party plugin code without reviewing it.

## Verify and report

Run the real build, confirm representative selectors and variants, measure CSS size, and exercise affected pages across the browser floor. Report provenance, compatibility evidence, package and CSS changes, unsupported legacy options removed or retained, selector evidence, checks, and rollback. Hand full upgrades to `11ai-operator-tailwind-v4-migration`.
