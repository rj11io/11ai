# Components and layouts

Concrete patterns for the pieces almost every product needs, built on the
tokens and scale from [foundations.md](foundations.md).

## Page shell

- **Marketing / landing pages:** centered content column (see container
  widths in foundations.md), generous section rhythm, a hero with one clear
  headline and one primary call to action. Avoid stacking more than one
  strong visual idea (a gradient AND a pattern AND an illustration) in the
  hero — modern landing pages usually commit to one.
- **App / dashboard shells:** a persistent sidebar or top nav plus a content
  area with its own scroll. Keep the chrome (nav, header) visually quiet —
  neutral background, small type — so it recedes and the content area, which
  is what the user is actually there for, reads as the loudest thing on
  screen.
- **Docs / content pages:** narrower reading column, a table of contents or
  section nav alongside it on wide screens, collapsing to a top sheet or
  hidden drawer on mobile.

## Navigation

- Keep the active item visually obvious: a subtle background fill, a left
  accent bar, or a bottom underline in the accent color — pick one pattern
  and use it everywhere nav appears.
- Collapse secondary nav items into a "More" menu or icon-only rail rather
  than shrinking text to fit; a nav that's hard to read isn't clean, it's
  cramped.
- Mobile nav: a bottom bar for 3–5 primary destinations, or a slide-in drawer
  for deeper hierarchies. Don't try to fit desktop nav unchanged into a
  narrow viewport.

## Cards

- Use a card only when a group of content genuinely needs a visible boundary
  — a clickable summary, a distinct data unit, a form section. If removing
  the card and just using spacing would lose nothing, remove the card.
- One card style per product: same radius, same border/shadow choice, same
  internal padding. Don't let some cards have shadows and others borders
  with no logic behind the difference.
- Card content follows the same hierarchy rules as the page: a clear title
  (`h3` or `label` size), supporting text at `small` size, and no more than
  one primary action per card.

## Forms

- Label above the field, not inline placeholder-only labels — placeholders
  disappear once the user types, which hurts usability even though it looks
  minimal.
- Consistent field height across a form (40–44px is a comfortable default
  for text inputs and buttons alike).
- Group related fields with tighter spacing (4–8px) and separate unrelated
  groups with a section gap (24px+).
- Inline validation: show the error state (border color change + short
  message below the field) after the user leaves the field or submits, not
  on every keystroke — that reads as nagging, not helpful.
- Primary action button is the accent color and sits in a predictable spot
  (bottom-right of the form, or full-width on mobile). Secondary/cancel
  actions are visually quieter — outline or ghost style, not a second solid
  color competing with the primary action.

## Buttons

- Three variants cover almost everything: **primary** (solid accent, one per
  view/section — the single most important action), **secondary** (outline
  or subtle fill, for supporting actions), and **ghost/text** (no
  background, for low-emphasis actions like "Cancel" or inline links).
- Consistent height and padding across all variants and sizes; consistent
  radius matching the rest of the UI.
- Icon-only buttons need a visible hover/focus state and an accessible label
  even without visible text.

## Tables and lists

- Favor lots of whitespace and a thin bottom border per row over heavy
  zebra-striping or boxed cells — dense grid lines read as dated.
- Right-align numeric columns and use tabular figures so values line up.
- Row hover state (subtle background change) signals interactivity if rows
  are clickable; skip it if they aren't, so users don't expect a click that
  does nothing.
- For dense data (analytics, admin panels) tighten row height and padding
  compared to a marketing or content page — density should match the task,
  not fight it in the name of looking airy everywhere.

## Responsive rules

- Design mobile and desktop from the same token set — don't introduce a
  second spacing or type scale for mobile, just apply fewer columns and
  tighter section rhythm.
- Common breakpoint: single column below roughly 640px, then introduce
  sidebars/multi-column layouts above that.
- Touch targets on mobile need real size (44px minimum) even if the desktop
  equivalent is smaller — don't just shrink everything uniformly.
