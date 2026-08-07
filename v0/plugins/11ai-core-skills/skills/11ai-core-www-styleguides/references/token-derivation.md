# Token derivation rules

How to turn whatever the user supplies into the complete two-mode token set of
[default-tokens.css](default-tokens.css). Work in oklch; convert any hex, rgb,
or hsl input to oklch before deriving. Never ship a derived palette without
running the contrast gates at the end.

## Input cases

| User supplies | You produce |
| --- | --- |
| Nothing | The bundled defaults, verbatim |
| One accent color | Full set: that accent becomes `--primary`, everything else derived or bundled |
| Partial token set | Given tokens kept verbatim; missing ones derived to match |
| One mode only | The other mode derived and balanced per the rules below |
| Full set, both modes | Kept verbatim; run the contrast gates and report violations |

## Deriving from a single accent

1. Light `--primary`: the user's color, lightness adjusted toward L 0.50 only
   if it fails the text gate against white.
2. Dark `--primary`: same hue, chroma near 0.15, lightness raised (typically
   L 0.72 to 0.78) until it passes 4.5:1 against the dark `--background` and
   `--card`. A deep accent reused in dark mode is the classic failure: it reads
   at about 2.6:1; the lightened variant reaches 9:1.
3. `--primary-foreground` per mode: near-white on a dark fill, near-black on a
   light fill, whichever reaches at least 4.5:1 on `--primary` (target 7:1).
4. Chart ramp: five lightness steps at the accent hue, chroma scaled with
   lightness. Bundled ramp shape: L 0.845, 0.696, 0.596, 0.508, 0.432. Same
   values in both modes.
5. `--sidebar-primary` follows `--primary` per mode; `--ring` stays neutral.
6. `--accent-surface` is never set by hand. Keep the formula
   `color-mix(in oklab, var(--primary) 12%, var(--background))`, declared once
   at `:root`, so it adapts to both modes on its own.
7. Neutrals (`--background`, `--card`, `--muted`, `--border`, `--secondary`,
   and foregrounds) are brand-independent: keep the bundled scales unless the
   user supplies their own.

## Deriving the missing mode

Given only dark tokens:

- Neutrals: map onto the bundled light scale (background near white L 1.0,
  foreground near black L 0.145, card white, borders opaque hairlines around
  L 0.92) rather than mathematically inverting, which produces muddy grays.
- Accent: lower lightness toward L 0.50 at constant hue until it passes 4.5:1
  as text on white and on `--card`.
- Keep chroma relationships: if the user's dark set is muted, mute the light
  set proportionally.

Given only light tokens: the reverse. Backgrounds drop to L around 0.145 with
cards at 0.205, borders become translucent white hairlines
(`oklch(1 0 0 / 10%)`), and the accent is lightened for text duty as above.

Balance check for either direction: the two modes must feel like the same
brand. Hue identical, chroma within 0.03, and the relative contrast ordering
of primary, secondary, and muted preserved.

## Contrast gates (run every time)

| Pair | Minimum |
| --- | --- |
| `--foreground` on `--background` | 7:1 |
| `--muted-foreground` on `--background` | 4.5:1 |
| `--primary` as text on `--background` and on `--card` | 4.5:1 |
| `--primary-foreground` on `--primary` | 4.5:1 (aim 7:1) |
| `--destructive` as text on `--background` | 4.5:1 |

Report the computed ratios with the delivered palette. A gate failure is a
finding with a fix (adjust lightness), never a silent pass.

## Non-negotiables regardless of input

- `--radius: 0rem`. It is the single lever every radius step derives from;
  square corners and hairline rules are the design language.
- oklch for every literal color value; no hex in the token sheet.
- Both modes always shipped, `.dark` as a class on the root element.
- The full shadcn variable set stays present (popover, sidebar, input, ring,
  charts) even when the user only cares about a few tokens; components break
  silently without them.
