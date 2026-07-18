---
name: 11ai-benchmark-content-pack-creator
description: "Turn user-supplied raw sources into a benchmark's pinned static content/ pack, verified against the repo's parser, with gaps flagged instead of invented. Invoke only when the user explicitly asks for static or pinned content, static markdown fixtures, or conversion of documents/screenshots/sites into a content pack. Do not invoke by default while creating, running, reviewing, or publishing a benchmark merely because content or placeholders exist."
---

# 11ai Benchmark Content Pack Creator

Every run renders the same `content/` files, so those files are the
benchmark's most load-bearing input: they must exercise the format, they
must be real, and once the first run starts they must never change. This
skill converts raw sources into that pack. It is opt-in: never select it
unless the user explicitly requested static content. A creator may scaffold
placeholder plumbing without invoking this skill.

## Step 1 — Check the freeze

Look for existing runs (folders under `app/` with a `page.tsx`, or
entries in `benchmark/runs.json`). If any exist, stop and warn: editing
content now means earlier runs rendered different data than later ones
will. The honest options — re-run everything, or version the benchmark —
are the user's call. Only proceed on their explicit say-so.

## Step 2 — Read the format contract

The format spec lives in `content/README.md`, and the types the loader
produces live in `lib/<domain>/types.ts`. Read both before writing a
line of content — the pack must parse into those types, not into what
generic markdown would allow. Typical constraints: frontmatter
`key: value` pairs, `## heading` per entry, metadata lines directly
under the heading, paragraphs, `-` bullets (indented continuation lines
allowed), inline bold/italic/code/links only.

## Step 3 — Extract from the sources

Read every source the user provides (images via the Read tool, URLs via
fetch, documents page by page). Then convert with these rules:

- **Transcribe, don't embellish.** Keep the author's meaning and voice;
  tighten phrasing where the source is chatty (social-profile prose
  usually is), but never add claims, numbers, or dates the source
  doesn't contain.
- **Translate register, not facts.** Marketing copy in the source stays
  marketing copy; a date range stays exactly that date range.
- **Deduplicate consciously.** Sources often repeat one fact in two
  places (the same role listed under two org names, the same feature in
  two sections). Merge into one entry and tell the user what you merged
  and why.
- **Order deliberately** — reverse-chronological for dated entries,
  importance order otherwise — and say which you chose.
- **Never fill gaps silently.** Anything the sources don't cover gets an
  obvious placeholder (`you@example.com`, `Placeholder Entry`) and a
  line in your final report. Invented-looking-real data is the worst
  failure mode this skill has: it ends up rendered in every run.

## Step 4 — Make the pack exercise the format

Real content should naturally hit most format features. Check that
across the pack there is at least one: wrapped bullet, inline link,
bold/italic span, entry with full metadata, and one empty-or-missing
section (sites must handle those). If real content genuinely lacks a
feature, that's fine — note it; don't force fake content in.

## Step 5 — Verify mechanically

1. Run the repo's loader over the new pack (`npx tsx` a small script
   that calls the loader and prints counts) — assert every file parses,
   entry counts match what you wrote, a wrapped bullet came back joined,
   and metadata keys landed where the types expect them.
2. `npm run typecheck` still clean.
3. If the repo has runs already (user overrode the freeze warning), boot
   the dev server and confirm existing runs render the new content.

## Step 6 — Report

List per file: what went in, what was merged or dropped (and why), and
every placeholder still standing with what the user needs to supply.
Close with the reminder that the pack should be final before the first
run — after that it's frozen.

Also record source identities, source hashes when available, extraction method,
transformation decisions, ordering, placeholders, parser counts, validation
results, timestamps, and unavailable metadata in a machine-readable content
manifest. Preserve provenance so reviewers and websites can display how the
static input was assembled without re-reading prose.
