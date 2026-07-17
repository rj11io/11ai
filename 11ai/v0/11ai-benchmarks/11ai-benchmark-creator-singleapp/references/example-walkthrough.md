# Worked example: a product landing-page benchmark

A hypothetical but complete pass through the method, showing what each
step produces. The objective here is a SaaS product landing page; swap in
any objective and the shape stays the same.

## Step 1 — The definition

- **Objective**: a one-page product landing page rendered from markdown:
  hero, feature sections, testimonials, pricing tiers, FAQ, footer.
- **Skill under test**: visual design and persuasion structure — how the
  model turns identical copy into hierarchy, rhythm, and a page that
  sells.
- **Input content**: one file per section, e.g. `hero.md` (frontmatter:
  product name, tagline, primary CTA label and URL; body: supporting
  paragraphs), `features.md` (one `##` entry per feature with an
  optional `icon:` metadata line, paragraphs, bullets), `testimonials.md`
  (one `##` entry per quote with `author:` and `role:`), `pricing.md`
  (one `##` entry per tier with `price:`, `period:`, bullets for the
  feature list), `faq.md` (one `##` entry per question, body = answer).
- **Output surfaces**: mobile ~375px and desktop. No print surface — the
  done-checklist drops the print lines and gains interaction checks
  (FAQ expand/collapse works, anchors scroll).
- **Run naming**: `app/{harness}-{model}-{effort}`.

## Step 2 — Baseline

Fresh Next.js + shadcn template; `npm run typecheck` and `npm run lint`
brought to zero errors and zero warnings before anything else, using
targeted `eslint-disable-next-line` comments for stock-component
findings.

## Step 3 — Content and loader

`content/` filled with placeholder copy that exercises every format
feature — including at least one wrapped bullet and one inline link —
plus `content/README.md` documenting the format. `lib/landing/` gets
`types.ts` (e.g. `Hero`, `Feature`, `Tier`, `QA`), `parse.ts`, `load.ts`
(`loadLanding()` returning empty sections for missing files),
`markdown.tsx`, and a barrel that deliberately excludes `markdown.tsx`.

## Step 4 — Hub page

`app/page.tsx` from the scaffold guide, title set to the benchmark name.

## Step 5 — PROMPT.md

From the template. The slots filled for this objective:

- Framing: "compared on one thing: **design and persuasion structure**."
- Feature requirement: every content section rendered in a deliberate
  order; the primary CTA visible without scrolling on both surfaces.
- Done checklist additions: FAQ items expand and collapse; in-page anchor
  links scroll to their sections; CTA links point at the URLs from the
  content files.

Root `JUDGE.md` comes from the plugin's canonical judge-prompt template and
keeps `{{CYCLE_ID}}`, `{{JUDGE_ID}}`, and `{{JUDGE_TYPE}}` literal until a
judge is allocated. A run plan records currently available and time-gated model
targets without requiring them all before an interim release.

## Step 6 — Docs

`AGENTS.md` benchmark section and a README describing the folder map,
run workflow (`fill content → replace {{RUN_ID}} → hand PROMPT.md to the
agent`), and judging.

## Step 7 — Verification

Typecheck clean, lint clean, `npx tsx` loader test asserting tier count /
a metadata value / a joined wrapped bullet / empty result for a missing
file, dev server booted once to confirm the hub renders "No runs yet."

## The judging loop this enables

Open two runs side by side at each surface; then run the content
regression: add a pricing tier to `content/pricing.md` and confirm every
run shows it with zero code changes. Runs that hardcoded copy fail
immediately — that is the point of the test.

The first available cohort may publish as an immutable interim cycle while the
campaign remains open. Later eligible runs create a new cumulative cycle; hard
close happens only after the desired target set is complete or waived.
