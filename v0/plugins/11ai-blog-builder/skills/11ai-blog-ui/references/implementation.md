# 11ai editorial blog UI contract

## Visual identity

- Use a calm editorial system: high-contrast text, muted borders, emerald/green primary accent, soft glows, rounded panels, and restrained motion.
- Use a large hero card on the library page with background blur accents and compact uppercase section labels.
- Use `rounded-2xl` to `rounded-[2rem]` surfaces, subtle borders, and hover lift/shadow on result cards.
- Use uppercase tracking for metadata labels: library labels, publication names, tags, content controls, and section labels.
- Prefer readable article widths: article body around `max-w-3xl`, page container around `max-w-7xl`, author pages around `max-w-6xl`.

## Theme tokens

Map the look to host tokens:

```css
--background
--foreground
--card
--card-foreground
--primary
--muted
--muted-foreground
--border
--input
--ring
--chart-1..5
```

In Tailwind class usage, prefer:

```text
bg-background text-foreground
bg-card text-card-foreground
text-muted-foreground
border-border
bg-primary/10 text-primary
focus-visible:ring-2 focus-visible:ring-ring
```

If the root `<html>` uses smooth scrolling, add the framework-required route-transition marker where applicable. For Next.js App Router, pair `scroll-behavior: smooth` on `<html>` with `data-scroll-behavior="smooth"` on the root `<html>` element.

## Library page

- Container: `mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-16`.
- Hero: `relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12 ...`.
- Hero title: large, tight tracking, `text-balance`.
- Stats: `dl` with top border and uppercase labels.
- Library section: heading left, content selector right on desktop.

## Controls

- Content selector: `inline-flex rounded-full border border-border bg-muted/50 p-1`.
- Selected URL-backed content link: use `aria-current="page"` plus `bg-background text-foreground shadow-sm`.
- Selected button-only controls: use `aria-pressed` and `aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm`.
- Layout selector: separate rounded control with icon buttons.
- Search/sort inputs: `h-11 rounded-xl border border-input bg-background` and visible focus ring.
- Tag filters: rounded border pills, selected state using primary border/background/text.

## Results

For posts/publications/authors:

- Use one link wrapping the card/row.
- Use hover `-translate-y-0.5`, stronger border, and subtle shadow.
- List mode should be dense and horizontally structured on larger screens.
- Card mode should use responsive grids (`md:grid-cols-2 xl:grid-cols-3`).
- Result cards show badges/tags, title, excerpt/description/bio, metadata, and a clear action affordance.

## Publication pages

- Breadcrumb at top.
- Header grid with a numeric issue block, metadata tags, title, description, created date, optional updated date, and post count.
- Publication browser tabs use a bottom border and selected state.

## Post pages

- Two-column layout on large screens: TOC column plus article.
- Header includes publication pill, large title, excerpt, author byline chips, date/read time/tags.
- Body uses centered `max-w-3xl`.
- Markdown body styles should cover the `$11ai-blog-markdown-components` surface: headings, paragraphs, emphasis, inline code, fenced code, quotes, lists, tables, links, images, task lists, and embeds.
- Adjacent post nav uses bordered rounded cards.

## Author pages

- Header grid with avatar/initials block and profile copy.
- Tags render under bio.
- External links are rounded border pills.
- Author post list uses bordered card rows with publication/date metadata and linked titles.

## TOC

- Desktop TOC is sticky with compact uppercase heading and left-border links.
- Active link uses primary border and foreground text.
- Mobile TOC uses native `details`/`summary` in a rounded muted panel.

## Acceptance

- Light and dark themes remain legible.
- Focus is visible on every link, button, input, select, and summary.
- No horizontal overflow on narrow screens.
- Cards maintain one semantic link surface.
- UI changes do not alter registry data, route params, or validation behavior.
