---
name: 11ai-operator-shadcn-v4-updates-migrations
description: "Plan, preview, execute, verify, and roll back shadcn v4 component updates, preset changes, CLI upgrades, primitive-base migrations, Tailwind transitions, and irreversible ejection while preserving locally owned source. Use when the user asks to update shadcn, reconcile upstream changes, migrate Base UI, Radix, or React Aria code, switch Tailwind families, or eject shared styles."
---
# 11ai shadcn v4 updates and migrations

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; shadcn components are locally owned source, so an update is a three-way reconciliation rather than a package bump.

Read [references/update-migration-checklist.md](references/update-migration-checklist.md) before any broad update, preset application, base migration, Tailwind transition, or eject operation.

## Inventory before changing

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 add COMPONENT --dry-run
npx shadcn@4.14.1 add COMPONENT --diff
rg -n 'data-slot|asChild|render=|Slot|@radix-ui|@base-ui|react-aria' app src components packages
```

Record CLI and dependency versions, framework, Tailwind family, `components.json`, base, style, aliases, installed source, local edits, consumers, test coverage, and generated or upstream provenance. Read relevant changelog and component docs at both source and target baselines.

## Stage reversible updates

Work on a clean reviewed branch or equivalent rollback point. Update one component family or migration boundary at a time, inspect dry run and diff, separate upstream changes from local behavior, and require approval before overwriting files or installing dependencies.

For a preset, use the narrowest documented `apply` scope and assume no dry run. For a base migration, map primitive APIs, slots, controlled state, events, portals, focus, and CSS state attributes component by component instead of bulk search-and-replace.

## Guard irreversible operations

`eject` is irreversible: it inlines `shadcn/tailwind.css` into the project and removes the dependency. Require explicit user approval, a verified rollback point, exact target review, and post-eject ownership documentation.

Never combine eject, base migration, Tailwind transition, preset replacement, and bulk component refresh in one unreviewable change.

## Verify and report

Run build, type, lint, unit, integration, visual, keyboard, screen-reader, responsive, dark-mode, RTL, and hydration checks proportional to the changed surface. Report source and target baselines, components and consumers, preserved customizations, intentional behavior changes, test evidence, unresolved manual review, commit boundaries, and rollback commands.
