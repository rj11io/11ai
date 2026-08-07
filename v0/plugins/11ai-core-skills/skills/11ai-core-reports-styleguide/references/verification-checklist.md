# Report regression and verification checklist

Run this gate for every change to report styling, structure, or interaction.
Nothing ships on green tests alone; the comparison against previous
generations is the other half of the gate.

## Structural comparison vs the previous generation

1. Snapshot the generating code before editing; keep it runnable.
2. After editing, run the old and new code back to back on the same inputs,
   seconds apart, so live data drift stays negligible.
3. Normalize ISO timestamps in both outputs, then require:
   - Markdown byte-identical whenever the change is HTML-only.
   - HTML table cell text and section headings extracted from both outputs are
     exactly equal. The chrome may change; the content may not.
   - Any machine-readable dataset byte-identical modulo timestamps.
4. Any intentional difference gets named and explained before shipping.

## Determinism

- Render the same dataset twice; outputs must be byte-identical except the
  generation-timestamp line.
- No randomness, no locale-dependent formatting, no environment-dependent
  ordering anywhere in the template.

## Functional pass, in a real browser

- Page loads dark; toggle switches to light and back, label tracks the mode.
- Highlight two rows in a table large enough that sorting reorders it; sort
  twice; both highlights sit on the same data rows afterward.
- Drag a column narrower: the table freezes its layout, content truncates
  with an ellipsis, and no other column edge moves when sorting afterward.
- Drag a column to zero width: it disappears and stays gone across sorts.
- Reload: all highlights gone, all widths reset, theme back to dark.
- Fonts: two `@font-face` rules present, digits aligned via tabular figures.

## Automated pins worth keeping

- `<html lang="en" class="dark">`, the toggle element, `data-row-id` on rows,
  the resize handle class, two `data:font/woff2;base64` occurrences, two
  `unicode-range` occurrences, `font-variant-numeric: tabular-nums`, and the
  `replaceChildren` marker that proves node-moving sort survived the edit.
