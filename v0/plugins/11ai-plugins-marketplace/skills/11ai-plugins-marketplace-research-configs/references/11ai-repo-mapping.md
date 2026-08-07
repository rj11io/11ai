# How the 11ai repository maps onto the ecosystems

Research date: 2026-08-06 — a **dated snapshot**. Counts, versions, and the issues list
below reflect the repo at version 1.32.0 (459 skills, 47 plugins) and may have been
fixed since. Re-verify against the working tree before repeating any of this as current;
`v0/scripts/validate-skills.mjs` is the live authority for packaging rules.

## Config surfaces the repo maintains

| File | Ecosystem | Shape at research time |
| --- | --- | --- |
| `.claude-plugin/marketplace.json` | Claude Code and Cowork; also read by Codex as a compatibility path | 47 entries; each entry uses only `name` plus a relative-string `source` (`./v0/plugins/NAME`) |
| `.agents/plugins/marketplace.json` | Codex and ChatGPT | 47 entries; every entry uses `source.source: "local"`, `policy.installation: "AVAILABLE"`, `category: "Engineering"`; top-level `interface.displayName` only |
| `v0/plugins/*/.claude-plugin/plugin.json` | Claude Code and Cowork | Nine identical keys everywhere: `$schema`, `name`, `version`, `description`, `author`, `repository`, `license`, `skills` (always exactly `"./skills/"`), `keywords` |
| `v0/plugins/*/.codex-plugin/plugin.json` | Codex and ChatGPT | Claude fields minus `$schema` plus the required `interface` block (`displayName`, `shortDescription`, `longDescription`, `developerName`, `category`, `capabilities`, `defaultPrompt`); one plugin adds `homepage`, `websiteURL`, `brandColor` |
| `v0/plugins/*/skills/*/SKILL.md` | All (Agent Skills standard) | Strict two-line frontmatter: `name` then a single-line JSON-quoted `description` |
| `v0/plugins/*/skills/*/agents/openai.yaml` | Codex and ChatGPT UI | Only `display_name`, `short_description`, `default_prompt` used across all skills |

Version sync: `v0/scripts/sync-claude-plugin-versions.mjs` rewrites every plugin
manifest's `version` from package.json on `npm version` (postversion hook) and during
semantic-release.

## What the validator enforces (stricter than every official spec)

- SKILL.md: exactly two frontmatter lines in fixed order; name kebab-case, max 64
  chars, equal to the directory name, unique repo-wide; description a single-line
  double-quoted JSON string, max 1024 chars, no angle brackets; non-empty body. (The
  open standard allows four more fields and ordinary YAML; the repo deliberately does
  not.)
- openai.yaml: must exist per skill; `interface:` on line one; only six allowed
  interface keys (`display_name`, `short_description`, `default_prompt`, `icon_small`,
  `icon_large`, `brand_color`) plus optional `policy.allow_implicit_invocation`;
  `short_description` 25–64 chars; `default_prompt` must contain `$` plus the skill's
  own name; icon paths must exist.
- Both plugin manifests: name equals directory; version equals package.json and strict
  semver; `skills` exactly `"./skills/"`; non-empty keywords; the two descriptions must
  be character-for-character identical; Codex interface fields present and non-empty.
- Marketplace coverage both directions in both files, with exact expected source paths.
- Root README catalog: the exact phrase "N skills in M plugins" with live counts, a
  table row per plugin with its skill count, and a layout-block line per plugin.
- Plugin READMEs must name every skill. Links in SKILL.md must resolve. Scripts must
  pass `bash -n`, `node --check`, or python `ast.parse`. FAQ skills (names ending
  `-faq`) get routing-table validation. Package `files` wiring, release workflow gate,
  and no `.DS_Store` files.

## Issues found in the snapshot (none broke the repo's own validation)

Update 2026-08-07: items 1 through 4 and 6 below were fixed, and the validator now
also checks `interface.developerName`, non-empty `interface.capabilities`, and
Codex marketplace category agreement with each manifest's `interface.category`. A
`renames` map was added to the Claude marketplace for the two folded plugins. Items
5, 7, and the remaining headroom in item 8 were left as-is on purpose. The list is
kept for history; re-verify against the working tree before citing any item.

1. **Codex schema violation:** 29 of 47 `.codex-plugin/plugin.json` files declared
   `capabilities: []`, but the official Codex manifest schema requires at least one
   item (minItems 1). The repo validator did not check that field.
2. **README self-contradiction:** the prose said "forty-eight workflow plugins" while
   the validated catalog line said 47 (47 was correct). The validator only
   pattern-matches the numeric phrase.
3. **Two category vocabularies:** the Codex marketplace tagged every plugin
   `Engineering` while the Codex manifests used `Developer Tools` (45), `Security` (1),
   `Productivity` (1). Both pass — category is a free string in the official schema —
   but nothing reconciled them.
4. **Stale scratch file:** the gitignored `.dir` at the repo root pointed at obsolete
   paths and named plugins that no longer exist. Nothing reads it.
5. **A stray template:** a 460th openai.yaml existed as a scaffolding template under
   `11ai-cleanup/skills/11ai-cleanup-creator/assets/` — correctly outside the validated
   path, but easy to miscount.
6. **Dead validator code:** both manifest validators hard-fail unless `skills` equals
   the exact string `"./skills/"`, then carry unreachable array-handling branches.
7. **Unused validator capacity:** icon, brand color, and implicit-invocation support in
   the openai.yaml checker had zero users.
8. **Unused ecosystem headroom:** no per-entry `category`, `tags`, `strict`, or
   `displayName` in the Claude marketplace; no Cowork `.plugin` packaging; no Claude
   `renames` map for folded plugins (for example the llm-costs to benchmarks rename);
   no Codex `policy.products` gating, screenshots, logos, or privacy and terms URLs.

## Sources

- Local files at research time: `v0/scripts/validate-skills.mjs`,
  `v0/scripts/sync-claude-plugin-versions.mjs`, both marketplace files, all plugin
  manifests, `package.json`, `.releaserc.js`, the GitHub workflow files, and
  `v0/www/lib/skills.ts` (the site parses the same frontmatter with the same regular
  expression and fails the build on drift).
