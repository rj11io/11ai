---
name: 11ai-super-metadata
description: Audit, repair, and iteratively improve a web project's search metadata, technical SEO, social sharing metadata, structured data, indexability controls, sitemap, robots directives, canonical URLs, favicons, and Open Graph images, including generating or replacing social preview images when needed. Use when asked to review or fix SEO, metadata, search appearance, link previews, OG or Twitter images, canonicalization, robots.txt, sitemaps, JSON-LD, or route-level metadata in a website or web application. Before auditing, require a clean Git tree and fetch and pull the latest current-branch changes from origin, allowing a conflict-free merge of incoming changes when fast-forwarding is impossible; continue until all critical and major findings are resolved and the project meets a high-confidence quality bar. Commit or push project changes only when explicitly instructed, use Conventional Commits, and always end with a session summary.
---

# 11ai Super Metadata

## Goal

Take ownership of the full metadata and technical-SEO pass: synchronize a clean repository, discover the public surface, establish a baseline, fix every safe critical and major issue, generate missing social images, verify rendered output, then repeat the audit until no material high-confidence improvement remains.

Read [references/seo-quality-bar.md](./references/seo-quality-bar.md) before auditing. Use its severity definitions, route matrix, scorecard, and primary sources.

## Operating Rules

- Run the Git sync gate before inspecting implementation files or starting the SEO routine.
- Start only from a clean working tree. Never stash, discard, or absorb pre-existing changes.
- Inspect the whole public route surface, not only the home page.
- Treat rendered or built HTML and actual public assets as truth. Source declarations alone are insufficient.
- Preserve the project's framework, conventions, voice, visual identity, and existing user work.
- Make focused metadata, content-structure, and technical-SEO edits. Do not redesign the product or rewrite substantive product claims without evidence.
- Never invent awards, ratings, authors, prices, addresses, social handles, locales, dates, or structured-data facts.
- Do not add `keywords` meta tags as filler or promise rankings.
- Do not commit or push unless the user explicitly requests that action. Never deploy, submit sitemaps, or change external search-console settings unless explicitly asked.
- Treat a merge commit created solely to integrate fetched `origin` changes during the sync gate as the one exception to the project-change commit restriction. Never push that merge unless the user explicitly requests a push.
- Defer any requested commit and push until all audit, verification, and rollback-sensitive work is complete.
- Continue through verification and at least one fresh re-audit after the first fixes. Do not stop at a report when the request authorizes fixes.
- Always end with the session summary defined below, including when stopping at the sync gate or aborting.

## Workflow

### 1. Synchronize and establish a clean rollback point

Complete this gate before the intended SEO routine:

1. Confirm the current directory belongs to a Git worktree. Record the current branch, configured upstream, and pre-sync commit as `PRE_SYNC_HEAD`. Require the upstream remote to be `origin`; stop and report if `origin` or an unambiguous origin upstream is unavailable.
2. Run `git status --porcelain=v1 --untracked-files=all`. If it returns any entry, stop immediately. Report that the tree is dirty and list the paths; do not stash, clean, restore, pull, or edit anything.
3. Fetch the latest origin state with `git fetch origin --prune`. Stop and report authentication, network, missing-ref, or remote-configuration failures.
4. Pull the configured origin upstream with `git pull --ff-only origin <upstream-branch>` first. If the update fails specifically because the local and origin histories have diverged, verify the tree is still clean, then merge the fetched origin upstream with `git merge --no-edit <origin-upstream-ref>`.
5. Accept the incoming merge only when Git completes it without conflicts and the resulting tree is clean. Do not edit merge conflicts or guess resolutions. If a conflict occurs, run `git merge --abort`, verify `HEAD` equals `PRE_SYNC_HEAD` and the tree is clean, then stop and report the conflict paths.
6. Do not use autostash, rebase, squash, force, or history rewriting during synchronization. Do not merge after a fetch or pull failure unrelated to branch divergence.
7. Run the clean-tree check again. If it is no longer clean, stop and report; do not begin the audit.
8. Record the successful post-sync commit with `git rev-parse HEAD` as `BASELINE_HEAD`. A required clean incoming merge commit is part of this baseline and must remain in place if later SEO work is rolled back.
9. Maintain a session change ledger from the first project edit onward: record every tracked path modified and every untracked path created by this session. Reconcile it frequently with `git status --short`.

Do not treat a successful fetch as a substitute for integrating the configured origin upstream. Do not continue from a dirty tree even when the existing changes appear related to metadata or SEO. A conflict-free merge of incoming origin changes is authorized when necessary to synchronize; resolving a conflicted merge is not.

### 2. Discover the project and production origin

1. Read repository instructions, manifests, route definitions, layouts, metadata files, content sources, public assets, deployment config, and relevant tests.
2. Map public route archetypes: home, marketing, product or feature, listing, detail, article, legal, auth, account, search/filter, error, and localized variants. Sample dynamic routes with real fixture or content data.
3. Determine which routes should be indexed, excluded, canonicalized, redirected, or omitted from the sitemap.
4. When absolute URLs are needed, search README files first for a labeled production, live, project-site, demo, or deployed URL. Then corroborate it against existing metadata and deployment configuration. Prefer an explicit README production origin over guesses.
5. Never use `localhost`, a preview deployment, or an invented domain in final metadata. If README files contain multiple plausible production origins and the code cannot disambiguate them, avoid destructive URL changes and report the exact decision needed.

Useful discovery searches include:

```bash
rg -n -i "production|live site|project site|demo|deployed|https?://" --glob 'README*'
rg -n "metadata|generateMetadata|<title|canonical|openGraph|twitter|robots|sitemap|application/ld\\+json|schema.org" .
```

Adapt searches to the repository and exclude dependencies, build output, and generated files.

### 3. Establish the SEO baseline

1. Run the project's existing build and relevant checks when feasible. Do not install or replace major tooling solely to produce a score.
2. Inspect representative rendered pages with an available browser or local server. When browser execution is unavailable, inspect build output or server-rendered HTML.
3. Build a compact route matrix containing indexability, status, title, description, canonical, Open Graph, social image, structured data, and sitemap inclusion.
4. Classify findings as critical, major, moderate, or minor using the reference. Record evidence by route or shared layout and fix shared root causes before route-by-route symptoms.

### 4. Fix critical and major issues

Work in this order:

1. Crawlability and indexability contradictions, bad status or redirect behavior, accidental production `noindex`, and crawler-blocking mistakes.
2. Wrong-origin, malformed, missing, or conflicting canonical URLs; protocol or host inconsistencies; incorrect locale alternates.
3. Missing, duplicated, stale, misleading, or route-insensitive titles and descriptions.
4. Broken or incomplete Open Graph and social-card metadata, including image URLs, dimensions, MIME type, and alt text.
5. Invalid, misleading, duplicated, or missing high-value structured data supported by visible page content.
6. Incomplete or incorrect robots, sitemap, manifest, icon, and web-app metadata.
7. Material on-page discoverability issues such as absent main heading, weak internal linking, inaccessible informative images, or public pages hidden behind client-only rendering.

Use framework-native metadata APIs and file conventions where they are reliable. Centralize shared site identity and defaults; make route-specific titles, descriptions, canonicals, images, and schema derive from the same content record when possible. Ensure child metadata does not accidentally replace required parent fields.

After each logical batch, inspect `git status --short` and the scoped diff. Update the session ledger and confirm every changed path is necessary for the audit.

### 5. Generate Open Graph images when needed

Generate or replace an image when a public route lacks a usable social image, references a missing asset, uses an unreadable or badly cropped image, or needs a distinct preview to represent materially different content.

1. Inspect existing brand assets and representative pages before designing.
2. Use the available image-generation skill or image tool for raster artwork. Give it the brand palette, composition, subject, safe-area, and crop requirements. For image edits, inspect the source image first and follow the image tool's editing rules.
3. Prefer a framework-native generated-image route for text-heavy or highly dynamic per-page cards when that is easier to keep accurate than hundreds of static files.
4. Default to a 1200 × 630 landscape canvas unless the project's platform requirements say otherwise. Keep essential content away from edges, use high contrast, and avoid tiny copy, fake UI, fabricated logos, and unsupported claims.
5. Save static images in the project's public asset convention with stable names. Use broadly supported formats accepted by the framework and target social parsers, keep files comfortably below platform limits, and provide absolute HTTPS URLs in rendered metadata.
6. Add accurate image alt text and explicit dimensions where supported. Verify the final asset visually and confirm its URL returns the expected image content type.

If raster image generation is unavailable, use an existing framework-native OG image facility when appropriate. Otherwise fix the metadata that can be fixed and report the missing image capability as a blocker; do not ship a low-quality placeholder.

### 6. Verify rendered behavior

Re-run the relevant build, typecheck, lint, and tests. Then verify representative output for every route archetype:

- one unambiguous title and useful description
- intended robots behavior and HTTP status
- one self-consistent canonical on the production origin
- complete Open Graph identity and a reachable image
- appropriate social-card metadata with sensible fallbacks
- valid JSON-LD matching visible content and canonical URLs
- correct sitemap membership, only canonical indexable URLs, and valid robots sitemap reference
- working icons, manifest metadata, internal links, and image alt text
- no preview, development, placeholder, or stale brand values

Inspect the rendered `<head>` rather than assuming framework configuration merged as intended. Validate structured data and generated XML/JSON syntax with available local tools; use external validators only when access is available and no sensitive preview URL must be exposed.

### 7. Re-audit and improve until satisfied

Start a fresh pass from rendered output after the first fixes. Rebuild the route matrix and score the result with the reference rubric.

Continue iterating while any of these remain:

- a critical or major finding
- a broken validation or build caused by the changes
- a route archetype relying on an incorrect generic fallback
- a social image or absolute URL that is missing, unreachable, or visibly poor
- a high-confidence improvement worth at least two rubric points

Finish only when:

- critical findings are zero
- major findings are zero, or each is explicitly blocked by missing facts or authority
- the quality score is at least 90/100
- two consecutive audit passes reveal no new critical or major issue
- relevant checks pass and the diff contains no unrelated edits

Do not chase speculative keyword density, cosmetic score inflation, or changes that require inventing business facts. A documented blocker is preferable to false metadata.

### 8. Abort and restore when the operation drifts

Abort instead of pushing through when any of these occurs:

- the diff contains unexplained or unrelated paths, or grows too broad to review confidently
- files change outside the session ledger, suggesting concurrent work
- more than two focused attempts fail on the same problem
- the work turns into extended debugging of the framework, dependency graph, build system, deployment, or unrelated application behavior
- safe completion would require destructive Git commands, history rewriting, force pushing, or guessing business facts

On abort:

1. Stop local servers and background processes started by the session.
2. Capture the current status and scoped diff for the final summary.
3. Confirm `HEAD` still equals `BASELINE_HEAD`. Commit and push are deferred until completion, so no session commit should exist at this point.
4. Restore only session-owned tracked paths with `git restore --staged --worktree -- <path...>`.
5. Remove only untracked files and directories recorded as created by this session. Never use blanket `git clean`, and never delete an unexplained path.
6. Verify `git status --porcelain=v1 --untracked-files=all` is empty and `git rev-parse HEAD` still equals `BASELINE_HEAD`.
7. If concurrent or unexplained changes prevent a clean restoration, preserve them and report that the original clean state could not be fully restored without risking user work.

Do not use `git reset --hard`, force checkout, or history rewriting for rollback. The session ledger and clean starting state make path-scoped restoration sufficient.

### 9. Commit and push only when explicitly requested

Do this only after the completion gate and final diff review:

1. Confirm the user explicitly requested a commit, a push, or both in the current task. Absence of that instruction means leave the verified changes uncommitted.
2. Exclude the synchronization merge described in Workflow section 1 from this authorization check: it is allowed only to establish the latest clean baseline and does not authorize pushing or committing the SEO changes.
3. Stage only the reviewed session-owned paths. Do not use blanket staging when unrelated paths could exist.
4. Create a Conventional Commit describing the actual change, for example `fix(seo): correct canonical and social metadata` or `feat(seo): add generated route previews`.
5. If a commit was requested without a push, stop after the commit and report its hash.
6. Push the current branch only when push was explicitly requested. Never force push. If the push is rejected or the upstream is ambiguous, stop and report instead of beginning a rebase or extended troubleshooting session.
7. Confirm the final Git status and record the commit hash and pushed remote/branch when applicable.

## Required Session Summary

Always reply with a concise session summary containing:

- sync result: branch, origin upstream, `PRE_SYNC_HEAD`, fetch outcome, integration method (`no-op`, fast-forward, or clean merge), and `BASELINE_HEAD`
- whether the operation completed, stopped at the clean-tree gate, or aborted and rolled back
- production origin used and where it was found
- route archetypes audited
- critical and major issues fixed, grouped by shared root cause
- OG images generated or replaced, with paths and dimensions
- checks run and their results
- final score and remaining moderate or minor opportunities
- any blocked issue, the missing fact or authority, and its exact impact
- final Git state: clean or changed, uncommitted or committed, commit hash, and push destination when applicable

When the operation aborts, lead with the abort reason and explicitly confirm whether the tree and `HEAD` were restored to the recorded clean baseline. Keep every claim evidence-based and distinguish verified rendered behavior from source-only inspection.
