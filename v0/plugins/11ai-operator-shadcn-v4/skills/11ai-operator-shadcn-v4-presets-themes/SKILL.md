---
name: 11ai-operator-shadcn-v4-presets-themes
description: "Resolve, compare, apply, and verify shadcn v4 presets, themes, styles, primitive bases, icon libraries, fonts, radii, color schemes, and semantic tokens while preserving project-specific component source and brand decisions. Use when the user asks to restyle shadcn, apply a preset, change theme variables, switch icons or fonts, or plan a base and style change."
---
# 11ai shadcn v4 presets and themes

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; a preset can affect configuration, CSS, fonts, dependencies, and installed component source, so treat it as a broad migration rather than a cosmetic toggle.

Resolve the host framework, `components.json`, primitive base, style, icon library, font, CSS entry, Tailwind family, token definitions, dark-mode strategy, installed components, local edits, and visual baselines before proposing a change.

## Inspect and resolve the preset

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 preset resolve PRESET --json
rg -n ':root|\.dark|@theme|--radius|--color|font-family' app src styles packages
```

Use an exact preset code or URL from the official tool; never infer one from a screenshot or marketing name. Compare resolved base, style, icons, fonts, radius, menu and accent choices, tokens, dependencies, and generated file targets with the current project.

## Plan the smallest safe application

Use `apply PRESET --only theme` for a theme-only request or `apply PRESET --only font` for a font-only request when supported. A full `apply PRESET` can update configuration, reinstall detected UI components, and change CSS or fonts; the CLI documents no dry-run flag for this command.

Require a clean reviewed branch or equivalent rollback point and explicit approval for the exact scope. Preserve custom component logic by separating stock upstream changes from host modifications before applying.

## Preserve semantic design

Map product roles to semantic tokens instead of hard-coded palette values. Check foreground contrast, surfaces, borders, destructive states, chart tokens, focus rings, radius hierarchy, typography metrics, and the configured icon library in both light and dark schemes.

Do not mix Base UI, Radix, or React Aria source APIs during a style change. Hand an actual primitive-base migration to `11ai-operator-shadcn-v4-updates-migrations`.

## Verify and report

Diff `components.json`, CSS, font loading, dependencies, and every rewritten component. Run build, type, visual, responsive, forced-color, and keyboard checks on representative pages plus charts. Report preset provenance, selected dimensions, files and components changed, customizations preserved, contrast results, remaining manual review, and rollback.
