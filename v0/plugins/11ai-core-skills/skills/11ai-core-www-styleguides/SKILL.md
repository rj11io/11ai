---
name: 11ai-core-www-styleguides
description: "Apply the house web design language to a Next.js application built with shadcn components and Tailwind CSS v4: oklch design tokens in light and dark modes, square corners with hairline borders, a single accent family with a five-step chart ramp, Inter and Geist Mono via next/font variables, next-themes with a system default and a d hotkey, and dual-theme code highlighting. Tokens and fonts are user-parameterized: whatever the user specifies is kept, missing tokens and fonts are generated as balanced equivalents, a single accent expands into a full palette, a one-mode palette derives its counterpart with contrast gates enforced, and the bundled defaults apply when nothing is specified. Use when styling, theming, or restyling a Next.js and shadcn application, generating design tokens from a brand color, or asked to apply the house www style."
---

# 11ai Core WWW Styleguides

The house design language for web applications, parameterized by whatever the
user brings. Precedence, always:

1. User-specified tokens and fonts: kept verbatim.
2. Missing pieces: generated as balanced equivalents of what was given.
3. Nothing given: the bundled defaults, verbatim.

Copy from the bundled references instead of reimplementing:

- [references/default-tokens.css](references/default-tokens.css): the complete
  default stylesheet: Tailwind v4 imports, `@theme inline` mapping, both token
  modes, base layer, and highlighting rules.
- [references/token-derivation.md](references/token-derivation.md): how to
  expand partial input into the full two-mode set, and the contrast gates.
- [references/fonts.md](references/fonts.md): font defaults, pairing and
  derivation rules, next/font mechanics.
- [references/app-wiring.md](references/app-wiring.md): layout, theme
  provider, shadcn configuration, and the pre-delivery verification list.

## Workflow

1. Collect what the user specifies: tokens (any format, any subset, one or
   both modes) and fonts (zero to three roles). Convert colors to oklch.
2. Derive the rest per
   [references/token-derivation.md](references/token-derivation.md): a single
   accent expands into primary, foregrounds, chart ramp, and sidebar tokens; a
   one-mode palette gets its counterpart derived and balanced, light from dark
   or dark from light.
3. Resolve fonts per [references/fonts.md](references/fonts.md).
4. Emit the stylesheet and wiring per
   [references/app-wiring.md](references/app-wiring.md), starting from the
   default sheet and replacing only what differs.
5. Run the contrast gates and the verification list. Report computed ratios
   with the delivery; a gate failure is a finding with a lightness fix, never
   a silent pass.

## Design language directives

- oklch for every color literal; tokens only, no hardcoded colors in
  components.
- `--radius: 0rem` is the single lever: square corners, straight lines,
  hairline `--border` rules, no shadows.
- One accent family. `--accent-surface` always derives via
  `color-mix(in oklab, var(--primary) 12%, var(--background))`, declared once
  so both modes inherit it.
- Dark mode is a first-class citizen, not an inversion: accents lighten to
  keep text contrast, neutrals map to the bundled dark scale, and the two
  modes must read as the same brand.
- The full shadcn variable set ships even when the user only cares about a
  few tokens.
- Fonts through next/font variables only; headings reuse the sans face unless
  the user says otherwise.
- Theme via next-themes: class attribute, system default, no transition
  flash, `d` hotkey toggle that respects typing contexts.
