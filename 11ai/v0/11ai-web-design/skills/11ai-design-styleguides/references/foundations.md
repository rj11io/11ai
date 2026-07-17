# 11ai design foundations

## Visual character

Aim for editorial developer tooling: calm, factual, modern, and slightly
technical. The interface should feel designed through restraint rather than
decoration.

## Color

Use semantic tokens. The canonical system is neutral OKLCH:

- light background/card near white; foreground near `oklch(0.145 0 0)`;
- dark background near `oklch(0.145 0 0)`, card near `0.205`, foreground near
  `0.985`;
- muted and borders step through neutral luminance;
- destructive is the only default chromatic semantic color;
- charts use a stable neutral ramp unless categories require accessible hues.

Use one quiet accent for status or action. Avoid decorative gradients. Never
encode meaning by color alone.

## Typography

- Inter or a similarly neutral grotesk for headings and prose.
- Geist Mono or a similarly legible mono for commands, IDs, versions, paths,
  metadata labels, timestamps, and tabular values.
- Headings: semibold, tight tracking, balanced wrapping; avoid huge display type
  when content density matters.
- Body: comfortable line height and restrained measure.
- Section kicker: 11–12px uppercase mono with wide tracking and muted color.
- Use tabular numerals in metrics and tables.

## Space and geometry

- Base radius around `0.625rem`; use smaller radii for dense controls and larger
  radii only for major editorial panels.
- Thin 1px borders, usually `border/60–80` opacity.
- Root sections may use 64–112px vertical rhythm.
- Analytical/non-root sections use roughly 24–48px rhythm, compact control
  heights, and dense tables.
- Prefer max-width containers around 72rem for editorial pages and 80–96rem for
  data-heavy pages.

## Depth and motion

Use flat or very subtle shadowed surfaces. Hover may change border/background,
opacity, or translate 1–2px. Keep transitions short. Disable nonessential
animation under reduced motion.

## Themes and accessibility

Ship light and dark together through semantic tokens. Preserve visible focus,
WCAG-appropriate contrast, keyboard order, landmarks, labels, zoom/reflow,
reduced motion, and screen-reader descriptions. Treat empty, loading, stale,
partial, unavailable, and error states as designed states.
