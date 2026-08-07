# Table interaction contract

The three interactive behaviors every report table carries, with the failure
modes already engineered around. The working implementation is in
[report-template.html](report-template.html); copy from it rather than
reimplementing.

## Sorting

- Every column header is a `.sort-button` inside a `th[aria-sort]`.
- A newly selected column sorts descending first, then toggles direction.
- Rows whose first cell is `Total` stay pinned at the bottom.
- Unavailable values (`n/a`, `none`, `unknown`) always sort to the bottom.
- Value detection order: ISO timestamps, `h/m/s` durations, numbers with `$`,
  `%`, or thousands separators stripped, `x / y` ratios by their first number,
  then case-insensitive text.
- **Node-identity rule (load-bearing):** sorting must reorder the existing
  `<tr>` elements with `replaceChildren(...)`. Never rebuild row markup.
  Highlight classes and any future row state travel with the nodes; a rebuild
  silently destroys them.

## Row highlight

- Every `<tbody>` row carries a deterministic `data-row-id` assigned at
  generation time (`t<tableIndex>-r<rowIndex>` over the original order).
- Click toggles the `highlighted` class. Multiple rows may be highlighted.
- Highlights follow their rows across sorting because sorting moves nodes.
- Guards: ignore clicks on links, buttons, resize handles, and header cells;
  ignore clicks that end a text selection (`getSelection().isCollapsed`).
- Highlight fill is `--accent-surface`, which derives from `--primary` and
  `--background` and therefore adapts to both themes on its own.

## Column resize

- Each `th` carries an absolutely positioned `.col-resize` drag handle.
- Lazy fixed layout: tables render with automatic layout until the first drag.
  On first drag, measure every header cell, write explicit pixel widths to a
  `<colgroup>` inserted as the table's first child, set
  `table-layout: fixed`, and freeze `table.style.width` to the measured sum.
- After fixing, cells truncate with `overflow: hidden; text-overflow: ellipsis`.
- Dragging a column to zero width makes it disappear; every later drag updates
  both the column width and the frozen table width.

### Failure modes this design prevents

1. **First-row dependency.** Under fixed layout, a column without an explicit
   width is sized from the first row's cell. Sorting changes the first row, so
   partially specified widths shift on every sort. Prevention: write explicit
   widths to every column at fix time, not only the dragged one.
2. **Surplus redistribution.** A `width: 100%` table whose pixel columns sum
   below the container gets the surplus redistributed, which reopens columns
   dragged to zero. Prevention: freeze the table's pixel width at fix time and
   keep it in sync on every drag; wide tables scroll inside `.table-wrap`.

## State doctrine

Theme choice, highlights, and column widths never persist across reloads. No
`localStorage`, no cookies, no URL state. A reload always yields the pristine
dark report. Persistence is a deliberate non-feature: reports are immutable
artifacts, and stored view state would make two openings of the same file
render differently.
