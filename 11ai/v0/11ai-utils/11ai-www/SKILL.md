---
name: 11ai-www
description: "Examine a project, decide what its public site should display, choose a design direction, and build an elegant frontend that presents the project — either in a dedicated www/ folder or embedded in an existing app. The site treats the repository as its single source of truth: real project files are scanned at build time, so content, counts, and catalog pages update automatically when the project changes. Use when the user asks for a project site, a landing page for a repo, a catalog or docs browser over repository content, \"build a www for this\", or \"display the concept of the project\" — and follow through from content inventory to a verified, statically generated build."
---

# 11ai WWW

## Overview

Turn a repository into a public-facing site in four phases: examine, decide
content, decide design, execute. The output is a small, fast, statically
generated frontend whose pages are derived from the project's own files —
never hand-copied prose that can drift.

Works standalone in a dedicated `www/` folder or as routes embedded in an
existing app. Companion skills: `11ai-web-design` for art direction,
`11ai-vercel-analytics` for traffic, `11ai-super-metadata` for SEO after
launch.

## Phase 1 — Examine the project

Read before building anything:

- root README, LICENSE, CHANGELOG, package manifests (name, version, repo URL)
- directory layout: what are the project's units of content (skills, packages,
  posts, recipes, plugins) and how are they grouped
- the install or getting-started command a new user runs first
- the project's one distinctive idea worth a dedicated explainer
- any existing `www/` scaffold: framework, styling stack, theme setup — reuse
  it, don't replace it

Write down: elevator pitch (one sentence), unit + group model, primary
command, canonical URLs (GitHub repo, package registry, project domain).

## Phase 2 — Decide what to display

Default content inventory, in order:

1. **Hero** — pitch line, then the install/primary command in a
   terminal-styled block with a copy button. For developer projects the
   command is the call to action. Add a stats badge (version, unit count,
   license) computed from the repo.
2. **"What is it" explainer** — show, don't describe: render a real file or
   artifact from the repo next to a 3-step story (install → invoke → result).
3. **Catalog** — searchable, filterable grid over all units, generated from
   the filesystem at build time.
4. **Concept spotlight** — one section for the project's most distinctive
   idea, with a simple diagram or formula.
5. **Compatibility strip** — quiet row of supported tools/platforms, if
   relevant.
6. **Final CTA + footer** — repeat the install command; link GitHub, package
   registry, changelog, license.

Drill-down information architecture:

- `/` overview → `/groups/[slug]` group page → `/items/[slug]` item page
- item pages render the item's source file (markdown or equivalent) in full,
  with breadcrumbs back up the hierarchy
- every level carries a CTA deep-linking to that exact path in the source
  repository, not just the repo root

Cut anything the repo cannot back with a real file. No invented
testimonials, fake logos, or placeholder metrics.

## Phase 3 — Decide design and style

- Match the audience's native environment. CLI and developer tools:
  terminal/monospace accents, window-dot code blocks, `$`-prefixed commands.
  Consumer products: defer to `11ai-web-design` direction picking.
- Support light and dark from day one; wire the toggle into the existing
  theme system if the scaffold has one.
- One accent color. Mono font for names, identifiers, and metadata rows;
  sans for prose.
- Responsive by default; verify mobile before calling it done.
- Write copy in plain language: short words, active voice, concrete examples
  before abstractions.

## Phase 4 — Execute

Data layer first, pages second:

- One server-only module scans the repo at build time and exposes typed
  accessors (`getGroups()`, `getItems()`, `getItem(slug)`).
- Resolve the content root defensively (try `../` and `./` candidates) so
  builds work from both the site folder and the repo root.
- Parse strictly, fall back leniently: one malformed source file must never
  break the build. Log or flag it; fix the file separately.
- Auto-discover new groups and units so content added later appears without
  code changes. Hide empty groups until they have content.
- Never hardcode counts, versions, or unit names in copy or metadata —
  compute them.

Then:

- statically generate every page (`generateStaticParams` or equivalent)
- add per-page titles and descriptions from the scanned data
- reuse the scaffold's component library; add only small focused components
  (copy button, terminal block, item card, catalog with search + filter chips)

## Verification

All of these before reporting done:

- typecheck, lint, and production build pass
- page count in the build output matches the expected units + groups + fixed
  pages
- open the real site in a browser: home, one group, one item page with heavy
  markdown (code fences, tables), and the catalog search
- check both themes and a mobile viewport
- click one GitHub deep link per level and confirm the path exists

## Hard fails

- content hand-copied from the repo instead of read from it
- a build that breaks when someone adds or renames a unit
- hardcoded unit counts anywhere
- item pages that summarize the source file instead of rendering it
- GitHub CTAs that all point at the repo root
- dark-only or light-only styling
- placeholder copy, fake stats, or invented social proof

## Litmus checks

- If a new unit lands in the repo, does the next build show it with zero code
  changes?
- Can a visitor go pitch → group → item → exact source file on GitHub in
  four clicks?
- Does the first screen tell a stranger what the project is and give them one
  command to act on?
