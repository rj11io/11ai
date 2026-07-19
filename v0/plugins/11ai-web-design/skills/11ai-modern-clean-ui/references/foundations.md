# Foundations: color, type, spacing, shape

## Why tokens first

Every value below should live in one place — CSS variables, a Tailwind theme
config, or a design-tokens file — and every component should read from that
place instead of writing its own numbers. This is what makes a UI feel like
one product instead of a pile of separately-styled screens, and it's what
makes light/dark mode possible without touching every component again.

## Color

Use a neutral base and exactly one accent.

**The neutral scale.** Pick or generate 8–10 steps from near-white to
near-black (OKLCH or HSL both work; OKLCH gives more even perceptual steps).
Assign roles, not raw steps, so components never reference a numeric shade
directly:

| Role | Light mode | Dark mode | Used for |
| --- | --- | --- | --- |
| `background` | lightest step | darkest step | page background |
| `surface` / `card` | white or step 1 lighter than background | step 1 lighter than background | cards, panels, popovers |
| `border` | light-mid step, low opacity | mid step, low opacity | dividers, outlines |
| `muted-foreground` | mid-dark step | mid-light step | secondary text, placeholders |
| `foreground` | near-black | near-white | primary text |

**The accent.** One color, used for primary actions, links, focus rings, and
selected states. Give it a light-mode and dark-mode value tuned for contrast
in each, plus a `foreground` pairing (the text/icon color that sits on top of
it) so buttons stay legible in both themes. Common choices: a blue, an
indigo, or a brand color if one exists — the specific hue matters far less
than using only one.

**Semantic status colors** (success, warning, destructive) are the only
other chromatic colors allowed, and only where they carry real meaning — a
destructive button, an error message, a success toast. Never use them
decoratively.

**Rules:**
- No raw hex/rgb/oklch values inside component code — reference the token.
- Never encode meaning by color alone; pair it with an icon, label, or
  position so colorblind users and grayscale printouts still work.
- Contrast: body text against its background should clear WCAG AA (4.5:1);
  large text and icons can use the 3:1 threshold.

## Typography

**Typeface.** One interface typeface for everything — headings, body, labels,
buttons. A modern grotesk-style sans reads as "current": Inter, Geist,
Söhne, or the system UI font stack all work. Add a monospace face only if the
product shows code, IDs, numeric data tables, or timestamps — Geist Mono or
JetBrains Mono are common choices. Two typefaces total is the ceiling.

**Type scale.** Use a small, fixed set of sizes — don't pick font sizes
per-component. A scale that covers almost any interface:

| Token | Size | Weight | Use |
| --- | --- | --- | --- |
| `display` | 36–48px | 600 | Hero/marketing headlines only |
| `h1` | 28–32px | 600 | Page title |
| `h2` | 20–24px | 600 | Section heading |
| `h3` | 16–18px | 600 | Card/subsection heading |
| `body` | 14–16px | 400 | Paragraphs, default UI text |
| `small` | 12–13px | 400–500 | Secondary text, captions, metadata |
| `label` | 11–12px | 500–600, uppercase, wide tracking | Section kickers, field labels |

Keep line height comfortable: roughly 1.5 for body text, tighter (1.1–1.25)
for headings. Keep line length (measure) around 60–80 characters for prose;
let UI copy wrap naturally without a fixed measure.

Use tabular figures (`font-variant-numeric: tabular-nums` or the mono face)
for any numbers that appear in a column, so they line up.

## Spacing and layout rhythm

Use a single spacing scale everywhere — Tailwind's default 4px-based scale
(4, 8, 12, 16, 24, 32, 48, 64px…) is a good default if nothing else exists.
Never hand-type an odd pixel value like `13px` or `22px`.

- **Component padding:** small controls (buttons, inputs) get 8–12px
  vertical, 12–16px horizontal. Cards get 16–24px on all sides.
- **Gaps between related items** (a label and its input, icon and text):
  4–8px.
- **Gaps between unrelated groups** (two cards, two form sections): 24–32px.
- **Section rhythm** on a page: 48–96px between major sections on marketing
  or landing pages; 24–32px between sections in dense product UI.
- **Container width:** cap content width so lines and cards don't stretch
  edge to edge on wide screens — roughly 640–768px for reading-focused
  content (docs, articles), 1024–1280px for dashboards and app shells.

Whitespace is a design choice, not empty space to fill. When in doubt, add
more space between groups rather than a border — a modern layout usually
separates sections with space first and reaches for a divider line only when
space alone doesn't read clearly (e.g., a tight sidebar).

## Shape and depth

**Radius.** Pick one base radius and derive the rest from it — for example
base `8px`, with small controls at `6px` and large panels/modals at
`12–16px`. Consistent radius across buttons, inputs, and cards is one of the
fastest ways to make a UI look coherent.

**Borders.** 1px, using the `border` token at reduced opacity (roughly
60–80%) rather than full-strength black or white. Borders separate regions;
they shouldn't be the loudest thing on the screen.

**Shadows.** Use a small shadow scale (2–4 steps) reserved for elements that
visually float above the page: dropdown menus, popovers, modals, tooltips,
and toasts. A resting card on a page usually needs a border, not a shadow —
adding shadows to every card is the single most common way a UI ends up
looking dated instead of modern. When a shadow is warranted, keep it soft and
diffuse (large blur, low opacity) rather than sharp and dark.

## Dark mode

Build both themes from the same token names — a component should never know
which theme is active, only which token it reads. Test every screen in both
themes as you build, not as a pass at the end; token-driven color makes this
nearly free if you did the color step correctly.
