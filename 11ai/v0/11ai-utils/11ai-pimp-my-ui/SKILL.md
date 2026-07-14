---
name: 11ai-pimp-my-ui
description: "Take an application's user-facing content, reach one deliberate style and design decision for it, and execute that design end to end — using the tools already in the codebase first (framework, CSS system, component library, theme tokens, fonts), installing at most one or two small critical packages when something essential is missing. Use when the user asks to style, restyle, polish, or \"pimp\" a UI, make an app or page look designed instead of default, pick a visual direction for existing content, or upgrade a working-but-plain interface — standalone, with no other skill required."
---

# 11ai Pimp My UI

## Overview

Turn working-but-plain UI into something that looks designed on purpose.
The content decides the style, the codebase supplies the tools, and one
committed direction beats ten half-applied ideas. Standalone: no other
skill required.

Scope: styling and design execution only. This skill does not decide what
content or features the UI should have — it makes what exists look right.

## Phase 1 — Read the content and the audience

Style is a function of who reads the screen. Before touching CSS:

- Read the actual user-facing content: headings, data, commands, copy.
- Identify the reader: developer, analyst, shopper, editor, operator.
- Note what the content is mostly made of — identifiers and commands, prose,
  numbers and tables, or imagery — because that dictates the type system.

Pick the visual language the reader already trusts:

- developers / CLI tools → terminal accents: mono identifiers, window-dot
  code blocks, `$`-prefixed commands, uppercase mono kickers
- data-heavy product UI → calm and dense: neutral surfaces, one accent for
  state, utility copy, no decorative chrome
- consumer / editorial → one dominant mood (minimal, editorial, playful,
  industrial) taken from the product's own voice

Write the decision as one sentence ("terminal-accented, dark-first, emerald
accent, mono for all identifiers") and commit. Do not blend directions.

## Phase 2 — Inventory the codebase

List what already exists before adding anything:

- framework and rendering model
- CSS system (Tailwind, CSS modules, styled-components) and its version
- component library and its variant API
- theme tokens: color variables, radius, spacing, shadows
- dark/light infrastructure (class strategy, theme provider, toggles)
- fonts already loaded, icon set already installed

Reuse all of it. Never add a parallel styling system, second component
library, or second icon set beside one that works.

## Phase 3 — Execute the design

Order of operations:

1. **Tokens first.** Style through the existing semantic tokens
   (background, card, muted, border, accent) instead of raw color values so
   every component works in both themes automatically. Extend tokens only
   when the direction genuinely needs a new one.
2. **Type system.** At most two typefaces. Assign roles and stick to them:
   mono for names, identifiers, labels, and metadata; sans for prose.
   Hierarchy from size, weight, and tracking — small uppercase kickers,
   tight-tracked semibold headings — not from boxes and decoration.
3. **One accent color.** Everything else neutral. If two accents seem
   necessary, the hierarchy is broken; fix that instead.
4. **Layout rhythm.** One container width, one section padding scale, thin
   borders between sections, generous whitespace. Cards only where grouping
   carries meaning; if a card can become plain layout without losing
   anything, remove it.
5. **Small focused components.** Build the few pieces the direction needs
   (copy button, terminal block, stat badge, filter chips) on top of the
   existing library's variants rather than importing new kits.
6. **Motion restraint.** Hover transitions and small translates. No
   entrance animation ceremony unless the direction demands it.
7. **Both themes, always.** Light and dark from the first component, wired
   into the existing toggle.

## Dependency rules

- Existing tools first, standard library second, new packages last.
- A new package must be small, single-purpose, and critical to the goal —
  a markdown renderer or frontmatter parser, not a UI kit.
- Budget: one or two such packages per job. Needing more means the plan is
  fighting the codebase; change the plan.
- Never replace the scaffold's CSS framework, component library, or theme
  system to make styling easier.

## Verification

Before reporting done:

- typecheck, lint, and build pass
- open the real UI in a browser and look at it — not just the code
- check both themes; check a mobile viewport
- exercise the styled interactions (hover, copy, filter, toggle) and confirm
  they behave
- screenshot the result as proof

## Hard fails

- visual direction that ignores who reads the screen
- raw hex/oklch values sprinkled where semantic tokens exist
- a second component library, CSS framework, or icon set added beside a
  working one
- more than one accent color without a real system
- dark-only or light-only output
- decoration doing the job hierarchy should do
- shipping without looking at the rendered result in a browser

## Litmus checks

- Can the direction be stated in one sentence, and does every screen obey it?
- Would the UI still look designed with all decoration removed?
- Did the job add more than two packages? If yes, justify each or remove.
- Does a theme toggle flip cleanly with no unreadable spots?
