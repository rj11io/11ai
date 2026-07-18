# PROMPT.md template

Copy this into the benchmark repo as `PROMPT.md` and fill every
`<angle-bracket>` slot for the specific objective. Keep the `{{RUN_ID}}`
token literal — the operator replaces it per run. Freeze the file once
the first run starts; editing it between runs invalidates comparisons.

```markdown
<!--
  Benchmark operator: before starting a run, replace every {{RUN_ID}}
  below with the run's folder name, e.g. codex-gpt5.5-high, then give
  this whole file to the agent as its task.
-->

# Task: build <objective>

You are one of several coding agents given this exact same task in this
exact same repo. Each agent builds in its own folder under `app/`, from
the same content and the same component library. The results are compared
on one thing: **<skill under test>**. <One sentence naming the concrete
dimensions, e.g. "Typography, hierarchy, spacing, restraint — and how
well the page holds up on a phone, on a desktop, and on paper.">

Your folder: `app/{{RUN_ID}}`

## What to build

<One paragraph: the deliverable at route `/{{RUN_ID}}`, rendered entirely
from the markdown content in `content/`.>

- Create `app/{{RUN_ID}}/layout.tsx` and `app/{{RUN_ID}}/page.tsx`. The
  layout is yours — set metadata, load fonts with `next/font`, wrap the
  page however you like. It nests inside the root layout, which you must
  not touch.
- Render every section that has content. A section with no content must
  simply not appear.
- <Objective-specific feature requirements. If the objective includes a
  PDF/print surface: add a "Download PDF" button that calls
  `window.print()` — that is the entire mechanism, but the printed result
  must read as a clean, professional document and is graded as hard as
  the screen design.>

## Content

- All data lives in `content/*.md`. That folder is **read-only** — its
  README documents the format.
- `lib/<domain>` gives you a typed loader (types in
  `lib/<domain>/types.ts`) and an inline-markdown renderer in
  `lib/<domain>/markdown`. Use them, or parse the raw markdown yourself —
  either way, the data must come from the files.
- Never hardcode content in your components. Editing a markdown file must
  change the site with zero code changes. Adding a new `##` entry to a
  content file must show up on its own.

## Hard rules

1. Create and edit files **only inside `app/{{RUN_ID}}/`**. You may read
   anything in the repo; you may write nowhere else.
2. **No new dependencies.** Do not install packages or touch
   `package.json`. Everything you need is already here.
3. Do not modify the shadcn components in `components/ui/`, nor `lib/`,
   `hooks/`, `app/globals.css`, or the root `app/layout.tsx`.
4. Use the shadcn components as-is where they help; customize them
   through `className` and props only. Building your own components
   inside your folder is fine too.
5. Style with Tailwind classes<, including `print:` variants for the
   print layout — keep if print is a surface>. If you need raw CSS (say,
   `@page` margins), put it in a CSS module inside your folder — never in
   a global stylesheet, so your styles cannot leak into other agents'
   routes.
6. Work autonomously. Do not ask questions; make the call and finish.

## Quality bar

You are being judged against other models on <skill under test>. Ship a
deliberate direction that fits <the objective> — not a default-looking
pile of gray cards. <One or two sentences of taste guidance, identical
for every run, e.g. "Pick type, scale, and spacing on purpose. Restraint
usually wins over decoration.">

## Done means all of this is true

- `/{{RUN_ID}}` renders fully with no console errors, and your folder
  introduces no type or lint errors (`npm run typecheck`, `npm run lint`).
- Looks clean and intentional on mobile (~375px wide) and desktop —
  no horizontal scroll, no cramped or orphaned elements.
- <Per extra surface, one concrete line. Print example: "Print preview
  produces a clean document: the button and screen-only chrome are
  hidden, nothing is clipped, page breaks fall in sensible places, and
  the output is readable black-on-white even if the screen was in dark
  mode.">
- <Objective-specific checks: working links, working interactions, etc.>
- Verify your work before finishing: load the page, check both viewport
  sizes<, and check each extra surface>.
```

## Calibration notes

- **Vague prompt vs detailed prompt is a design choice.** A vague one
  benchmarks taste and initiative; a detailed one benchmarks
  instruction-following. This template sits deliberately in between:
  acceptance criteria are pinned, implementation approach is free. Move
  it in either direction knowingly, and keep it identical across runs.
- The framing sentence ("compared on one thing") does real work — it
  focuses effort on the judged dimension. Keep it honest: if you'll also
  judge, say, accessibility, name it there.
- Keep the checklist verifiable by the agent itself (things it can check
  by loading its own page), so "verify before finishing" is actionable.
