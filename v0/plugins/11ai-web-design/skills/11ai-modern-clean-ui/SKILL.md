---
name: 11ai-modern-clean-ui
description: "Build or restyle a web interface toward the contemporary 'modern clean' look used by products like Linear, Vercel, and shadcn/ui: neutral surfaces with one accent color, generous whitespace, clear type hierarchy, soft borders and shadows instead of heavy chrome, and restrained motion. Framework-agnostic principles with concrete Tailwind/shadcn guidance. Use when the user asks for a UI that looks modern, clean, minimal, polished, or professional; wants a design system or styleguide for a new app; says a page looks '90s', cluttered, generic, or like a template; or is starting a new product's frontend and wants it to look and feel high quality from the first screen."
---

# 11ai Modern Clean UI

A standalone styleguide for the modern, clean aesthetic that most well-regarded
web products share today: quiet neutral color, one clear accent, real
whitespace, sharp typographic hierarchy, thin borders and soft shadows instead
of heavy boxes, and small, purposeful motion. Works on any framework; the
concrete examples assume Tailwind CSS and a shadcn/ui-style component layer,
since that is the most common way teams build this look today.

This skill is self-contained: it gives you the look itself (tokens, type
scale, spacing, component patterns, and motion rules) and the process for
applying it to any product, from a blank page to an existing UI that needs
restyling.

Read the references as the task needs them:

- [Foundations](references/foundations.md) — color tokens, type scale,
  spacing, radius, and shadow system.
- [Components and layouts](references/components-layouts.md) — page shell,
  navigation, cards, forms, tables, and responsive rules.
- [Motion and states](references/motion-states.md) — hover/focus motion,
  loading, empty, and error states, the details that make a UI feel finished.

## Workflow

1. Inventory what already exists: framework, Tailwind version, component
   library, existing tokens, fonts, icon set. Reuse it; do not install a
   second design system next to a working one.
2. Set up (or confirm) the token layer first: neutral background/surface/
   border/text colors plus one accent, defined as CSS variables or Tailwind
   theme values — never hardcoded hex/rgb sprinkled through components. See
   [Foundations](references/foundations.md).
3. Pick two typefaces at most — one for interface text, optionally one mono
   for code, numbers, or IDs — and apply the type scale consistently instead
   of ad hoc font sizes.
4. Lay out the page with the spacing and container rules in
   [Components and layouts](references/components-layouts.md): consistent
   section rhythm, one content width per page type, real whitespace between
   groups instead of borders doing all the separating.
5. Build components on the token layer: cards, buttons, inputs, and tables
   that use the same radius, border weight, and shadow scale everywhere.
6. Add the small details that separate "looks fine" from "looks designed":
   hover and focus states, loading and empty states, and short, purposeful
   motion — see [Motion and states](references/motion-states.md).
7. Verify in a real browser: light and dark (if both are in scope), mobile
   and desktop widths, keyboard navigation, and long or missing content.

## Non-negotiables

- Neutral base palette (grays/near-blacks/near-whites) plus exactly one
  accent color used for actions and emphasis. Two accents means the
  hierarchy is broken — fix the hierarchy, not the palette.
- Every color, radius, spacing, and shadow value comes from a token or scale,
  never a one-off value typed into a single component.
- Hierarchy comes from type size, weight, and spacing first. Reach for a
  border or shadow only when a group genuinely needs a visible edge.
- Borders are thin (1px) and low-contrast; shadows are soft and used
  sparingly, mainly to lift floating elements (menus, modals, popovers) off
  the page — not to decorate every card.
- Motion is short (150–250ms), eases out, and always has a functional reason
  (state changed, something opened, something loaded). No animation for its
  own sake.
- Ship both light and dark mode whenever the product supports theme
  switching; never leave one theme half-done.
- Never sacrifice contrast, focus visibility, or keyboard access for a
  cleaner look. A modern UI that fails accessibility isn't modern, it's
  broken.

## Handoff

When you finish, tell the user: which tokens you set up or reused, the type
and spacing scale applied, which components you built or restyled, and the
states you checked (hover/focus, loading, empty, error, light/dark, mobile).
Confirm you looked at the rendered result in a browser — don't declare a
visual task done from reading the code alone.
