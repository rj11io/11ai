---
name: 11ai-benchmark-creator-singleapp
description: Scaffold a new single-app AI coding benchmark — one Next.js + shadcn repo where several agent runs (harness + model + effort, e.g. app/codex-gpt5.5-high) each build the same objective from the same read-only content, so results compare taste and skill alone. Use when the user asks to create a new benchmark of this kind for any objective (landing page, dashboard, blog, docs site, pricing page, data explorer). Not for running or judging an existing benchmark.
---

# 11ai Single-App Benchmark Creator

A "single-app benchmark" is one repo that measures how different AI coding
agents build the same thing. Every run gets identical inputs, identical
components, and identical rules; each run builds inside its own folder
under `app/`. The only variable left is the model's taste and skill on the
chosen objective. This skill turns a user's objective into that scaffold.

Vocabulary used throughout: a **harness** is the agent CLI (codex, claude
code, ...), a **run** is one attempt by one harness + model + effort
combination, and the **baseline** is everything in the repo that runs
share and must not edit.

## Step 1 — Define the benchmark with the user

Collect these before writing files. Ask only for what's missing; propose
defaults for the rest.

1. **Objective** — the one thing every run builds (a landing page, an
   analytics dashboard, a blog, a docs site...). One repo = one
   objective.
2. **Skill under test** — the dimensions runs are compared on (visual
   design, information hierarchy, data-viz choices, responsiveness,
   print/PDF quality, interaction design). This shapes the prompt's
   framing and its done-checklist.
3. **Input content** — the canonical data every run renders. Decide the
   markdown files and their shape (see Step 3).
4. **Output surfaces** — where the result must hold up: mobile (~375px)
   and desktop always; add print (via `window.print()`), dark mode, or
   specific interactions when the objective calls for them.
5. **Run naming** — default `app/{harness}-{model}-{effort}`, e.g.
   `app/codex-gpt5.5-high`.

## Step 2 — Scaffold the baseline app

Start from a Next.js + shadcn/ui template (App Router, Tailwind v4, the
full `components/ui/` set). If the user has a template repo, clone that;
otherwise `npx shadcn@latest init` on a fresh Next.js app.

Then make the baseline *clean*: `npm run typecheck` and `npm run lint`
must pass with zero errors before anything else. Any pre-existing failure
becomes every run's failure and tempts agents into editing forbidden
files. Fix template lint errors with targeted `eslint-disable` comments
rather than rewriting stock components.

## Step 3 — Create the content and its loader

Runs must compete on the objective, not on plumbing. Since the rules
forbid installing packages, the baseline must ship the plumbing:

- **`content/*.md`** — one file per content section, read-only for runs.
  Fill with placeholder text that demonstrates every format feature, and
  document the format in `content/README.md`. Keep the format small:
  frontmatter `key: value` pairs, `## heading` per entry, `key: value`
  metadata lines directly under a heading, paragraphs, `-` bullets, and
  minimal inline markdown (bold, italic, code, links).
- **`lib/<domain>/`** — a dependency-free typed loader (`load<X>()`)
  that parses those files into typed objects, plus a small `<Inline>`
  React component for the inline markdown. Copy the reference
  implementation in [references/scaffold-guide.md](references/scaffold-guide.md) —
  it already handles the traps (wrapped bullets, colons inside
  paragraphs, decorative `#` titles, missing files).

Never re-export the fs-based loader and the React helper from the same
barrel file: a client component importing the helper would drag `node:fs`
into the browser bundle and crash the build.

## Step 4 — Create the hub page

Replace `app/page.tsx` with a server component that lists run folders by
reading the `app/` directory (a folder counts as a run when it contains
`page.tsx`). Link with plain `<a>` tags, not `<Link>`: a full page load
keeps one run's global or print CSS from leaking into another's route.
Code in the scaffold guide.

## Step 5 — Write PROMPT.md

This is the frozen task given to every agent, with a `{{RUN_ID}}` token
the operator replaces per run. Build it from
[references/prompt-template.md](references/prompt-template.md). Its
non-negotiable sections:

- **Framing** — "you are one of several agents given this exact task;
  results are compared on <skill under test>."
- **What to build** — own `layout.tsx` + `page.tsx` under
  `app/{{RUN_ID}}/`, rendering every non-empty content section.
- **Content rules** — `content/` is read-only; data must come from the
  files; editing a markdown file must change the site with zero code
  changes.
- **Hard rules** — write only inside `app/{{RUN_ID}}/`; no new
  dependencies; never edit `components/ui/`, `lib/`, `hooks/`,
  `app/globals.css`, or the root layout; customize shadcn components via
  `className` and props only; raw CSS only as CSS modules inside the run
  folder; work autonomously, no questions.
- **Quality bar** — one explicit paragraph naming the taste being judged,
  identical for all runs.
- **Done checklist** — objective-specific, concrete, verifiable: renders
  with no console errors, no new type/lint errors, clean on every output
  surface, and a content-edit test (add an entry to a content file → it
  appears with no code change).

## Step 6 — Wire the repo docs

- **`AGENTS.md`** — add a short benchmark section: if you were pointed at
  a folder under `app/`, `PROMPT.md` is your task spec and its rules win;
  write only inside your run folder.
- **`README.md`** — what the benchmark measures, the folder map, how to
  start a run (fill content → replace `{{RUN_ID}}` → hand the prompt to
  the agent), and how runs are judged.

## Step 7 — Verify before handing over

All four, every time:

1. `npm run typecheck` — clean.
2. `npm run lint` — clean.
3. A runtime test of the loader against the real `content/` files
   (run with `npx tsx`; assert entry counts, metadata, wrapped-bullet
   joining, and that missing files come back empty).
4. Boot the dev server and confirm the hub page renders with "no runs
   yet".

Then report to the user: the file map, the prompt's rules, what they must
fill in (content placeholders), and how to start the first run.

## Pitfalls seen in practice

- Sharing `layout.tsx`, `globals.css`, or `package.json` mutations across
  runs destroys independence — the folder-isolation rules exist to hold
  the line inside one app; repeat them in both `PROMPT.md` and `AGENTS.md`.
- Placeholder content that doesn't exercise the format (no wrapped
  bullets, no links, no metadata lines) hides parser bugs until real
  content lands. Test with realistic placeholders.
- A vague done-checklist makes runs incomparable: every model interprets
  "clean PDF" or "polished" differently. Pin acceptance criteria; leave
  only the *approach* free.
- Later runs can read earlier runs' folders. Accept this as a known limit
  of the single-app structure (or run benchmarks in cost order), and
  never let the prompt point at a "reference" run.

A complete pass through every step, with all the slots filled for one
concrete objective, is in
[references/example-walkthrough.md](references/example-walkthrough.md).

## After the scaffold

The sibling skills operate what this one creates: freeze the judging
criteria with `$11ai-benchmark-rubric-creator` (best done now, before
any run output exists), fill `content/` from real sources with
`$11ai-benchmark-content-pack-creator`, start each run with
`$11ai-benchmark-runner`, gate it with
`$11ai-benchmark-compliance-auditor`, score with `$11ai-benchmark-judge`,
cost it with `$11ai-benchmark-token-accountant`, validate and propagate
the results with `$11ai-benchmark-reviewer`, and share with
`$11ai-benchmark-reporter`. If the objective needs per-run dependencies
or full-app control, use `$11ai-benchmark-creator-multirepo` instead of
this skill.
