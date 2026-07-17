# Scaffold guide: files, code, and checks

The reference implementation below is objective-agnostic — replace
`<domain>` with the benchmark's domain (e.g. `landing`, `blog`, `docs`).
Adapt the domain types to the objective; keep the parser and the traps it
handles.

## Repo map

```
<benchmark-repo>/
  PROMPT.md              # frozen task, {{RUN_ID}} token (see prompt-template.md)
  JUDGE.md               # frozen operator template, cycle/judge/type tokens
  AGENTS.md              # template rules + benchmark section (below)
  README.md              # what it measures, folder map, run workflow, judging
  benchmark/
    benchmark.json       # mode, policies, evidence surfaces, canonical URLs
    run-plan.json        # optional desired/time-gated configuration plan
    runs.json            # version-2 run ledger object
    lifecycle-state.json # deterministic derived stage; never authoritative
    cycles/              # immutable judging/review/report cohorts
    current.json         # created after review; latest cycle/release/digest
  content/
    README.md            # format spec, read-only warning
    <section>.md         # one file per content section, placeholder-filled
  lib/<domain>/
    types.ts             # shared types
    parse.ts             # markdown parser (pure, no fs)
    load.ts              # fs loader -> typed objects (server-only)
    markdown.tsx         # <Inline> renderer for inline markdown
    index.ts             # barrel WITHOUT markdown.tsx (see trap below)
  app/
    layout.tsx           # root layout: fonts + ThemeProvider (runs must not touch)
    page.tsx             # hub page listing runs
    globals.css          # tailwind + shadcn tokens (runs must not touch)
    <harness>-<model>-<effort>/   # one folder per run (created by agents)
  components/ui/         # stock shadcn components (runs must not touch)
```

## Content format (document in content/README.md)

- Frontmatter `---` block: `key: value` lines (profile-style files).
- `## Heading` starts an entry; `# Single-hash` titles are decoration and
  are ignored by the parser.
- `key: value` lines directly under a `##` heading are that entry's
  metadata; the first blank or normal line ends the metadata phase.
- Plain lines become paragraphs; blank lines separate them.
- `- ` lines become bullets; an indented continuation line joins the
  previous bullet.
- Inline formatting only: `**bold**`, `*italic*`, `` `code` ``,
  `[links](https://...)`. No nesting, images, or tables.

Placeholder content must exercise every one of these features (wrapped
bullets included) or parser bugs stay hidden until real content lands.

## Parser (`lib/<domain>/parse.ts`)

Pure function `parseDoc(source: string)` returning
`{ frontmatter, lead, sections }` where each section is
`{ heading, meta, blocks }` and a block is a paragraph or a bullet list.
Traps it must handle (all bitten in practice):

- **Wrapped bullets**: a bullet's continuation line (indented, no `- `)
  appends to the previous bullet item, not a new paragraph. Track an
  `inBullet` flag; reset it on blank lines.
- **Colons in paragraphs**: `key: value` detection only applies in the
  metadata phase (immediately after a heading, before the first blank or
  non-matching line). `Note: this is prose.` after a blank line is a
  paragraph.
- **Decorative `# Titles`**: skip lines starting `# ` in body parsing.
- **Unterminated frontmatter**: treat the whole file as body.
- Lowercase metadata keys on parse so lookups are predictable.

## Loader (`lib/<domain>/load.ts`)

Server-only (uses `node:fs` + `process.cwd()`); reads each content file,
maps sections to domain types, and returns empty arrays/strings for
missing files — sites must render nothing for empty sections, so the
loader must not throw on them.

## Inline renderer (`lib/<domain>/markdown.tsx`)

```tsx
import * as React from "react"

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/

export function Inline({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>
        const link = part.match(LINK)
        if (link) return <a key={i} href={link[2]} className={linkClassName} target="_blank" rel="noreferrer">{link[1]}</a>
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}
```

**Barrel trap**: `index.ts` re-exports the loader, parser, and types —
but NOT `markdown.tsx`. A `"use client"` component importing `Inline`
through a barrel that also exports the fs-based loader pulls `node:fs`
into the browser bundle and breaks the build. Document the direct import
path (`@/lib/<domain>/markdown`) in the barrel's header comment.

## Hub page (`app/page.tsx`)

```tsx
import fs from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"

function listRuns(): string[] {
  const appDir = path.join(process.cwd(), "app")
  return fs
    .readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(appDir, entry.name, "page.tsx")))
    .map((entry) => entry.name)
    .sort()
}

export default function Page() {
  const runs = listRuns()
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-6 text-sm leading-relaxed">
        <div>
          <h1 className="font-medium"><benchmark-name></h1>
          <p className="text-muted-foreground">
            Same content, same components, different models. Each run lives
            in its own folder under <code>app/</code>. See <code>PROMPT.md</code> to start one.
          </p>
        </div>
        {runs.length === 0 ? (
          <p className="text-muted-foreground">No runs yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {runs.map((run) => (
              <li key={run}>
                {/* Plain <a> on purpose: a full page load keeps one run's
                    print/global CSS from leaking into another's. */}
                <a href={`/${run}`} className="font-mono underline underline-offset-4">{run}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

## AGENTS.md benchmark section

Append after any template-managed block:

```markdown
# Benchmark runs

This repo benchmarks how different models build the same <objective>. If
you were pointed at a folder under `app/` as your run folder, `PROMPT.md`
at the repo root is your full task spec and its rules win over everything
else. In short: write only inside your run folder, treat `content/` as
read-only, add no dependencies, and do not touch `components/ui/`,
`lib/`, `hooks/`, `app/globals.css`, or the root `app/layout.tsx`.
```

## Baseline hygiene

Before declaring the scaffold done:

1. `npm run typecheck` — zero errors.
2. `npm run lint` — zero errors AND zero warnings. Fix stock-template
   findings with targeted `eslint-disable-next-line` comments (with a
   `--` reason) instead of rewriting stock components.
3. Loader runtime test via `npx tsx` against the real `content/` files:
   assert entry counts, a metadata value, a wrapped bullet joined into
   one item, an inline link surviving parse, and empty results for a
   missing/empty file.
4. Boot `next dev` on a spare port, `curl` the hub page, confirm it
   renders the empty state. Kill the server.
