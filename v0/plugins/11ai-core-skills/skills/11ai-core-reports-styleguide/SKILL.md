---
name: 11ai-core-reports-styleguide
description: "The house styleguide for generated, self-contained HTML reports: canonical design tokens with a dark default and a light toggle, embedded Inter and Geist Mono fonts with cross-platform fallback stacks, collapsed-disclosure section structure, and a table interaction contract covering descending-first sorting, multi-row click highlighting that survives sorting, and column resizing down to zero width, none of it persisting across reloads. Ships copyable tokens.css and fonts.css, a complete working report-template.html, the interaction spec with its known failure modes, and a regression checklist against previous generations. Use when building, styling, restyling, or reviewing a generated HTML or markdown report, or when asked to apply the house report style."
---

# 11ai Core Reports Styleguide

The canon for every generated report. Reports are immutable artifacts: styled
once at generation, self-contained forever, identical on every open.

Copy from the bundled references instead of reimplementing:

- [references/tokens.css](references/tokens.css): the design tokens and base rules.
- [references/fonts.css](references/fonts.css): embedded font faces, ready to inline.
- [references/report-template.html](references/report-template.html): a complete
  working page demonstrating every directive; open it in a browser.
- [references/interaction-contract.md](references/interaction-contract.md): the
  table behavior spec and the failure modes it prevents.
- [references/verification-checklist.md](references/verification-checklist.md):
  the regression gate to run before shipping any report change.

## Directives

Self-containment:

- One HTML file, zero network requests. Styles inline, fonts as data URIs.
- Everything deterministic: identical input yields byte-identical output
  except the generation-timestamp line.

Tokens and theme:

- Use the tokens in tokens.css; never hardcode a color beside them.
- Square corners everywhere. Straight lines and hairline `--border` rules; no
  `border-radius`, no shadows.
- Dark by default: `class="dark"` on the root element, an icon toggle in a
  flex header row opposite the title switches modes, `color-scheme` declared
  per mode.

Typography:

- Inter for text, Geist Mono for code and identifiers, both embedded per
  fonts.css with full system stacks behind them for other platforms and
  glyph ranges.
- Body 14px/1.45. Tables .82rem. Title `clamp(1.3rem, 2.3vw, 1.8rem)` with
  tight tracking. Headings weight 750, table headers 700.
- `font-variant-numeric: tabular-nums` on every data cell so digits align.

Structure:

- Every report section is a native `<details>` disclosure, collapsed by
  default; the title, generation message, and signature stay outside.
- Tables live inside a `.table-wrap` that scrolls horizontally; the page body
  never scrolls sideways.

Tables and data display:

- Show as many datapoints as possible; table width is never a reason to drop
  a column.
- Missing data renders `n/a`, never `0`. USD uses four decimals.
- Sorting, row highlighting, and column resizing follow
  [references/interaction-contract.md](references/interaction-contract.md)
  exactly, including the node-identity rule for sorting and the two fixed
  failure modes for resizing.
- Interactive state never persists: no storage of theme, highlights, or
  widths; a reload always yields the pristine dark report.

Markdown sibling:

- When a markdown report accompanies the HTML, both render from the same data
  with the same section order, table columns, and values; the HTML adds
  interaction, never information.

## Verification

Run [references/verification-checklist.md](references/verification-checklist.md)
before shipping any change: structural comparison against the previous
generation, a determinism double-render, and the functional browser pass.
