# Conformance rules per configuration surface

Rules snapshot: 2026-08-06, distilled from the official docs, the published JSON
schemas, and vendor source code listed under Sources. When online, re-fetch the live
schemas and prefer them over this snapshot; report any drift as a freshness finding.

Severity shorthand used below: **[C]** critical, **[M]** major, **[m]** moderate,
**[i]** informational. The audit-loop reference defines the rubric.

## 1. SKILL.md (open Agent Skills standard)

A skill is a directory containing `SKILL.md` with YAML frontmatter. Optional
conventional subdirectories: `scripts/`, `references/`, `assets/`.

- [C] `name` present; 1–64 characters; lowercase `a-z`, `0-9`, hyphens only; no
  leading, trailing, or consecutive hyphens.
- [C] `name` equals the parent directory name.
- [C] `description` present, non-empty, 1–1024 characters.
- [M] Only standard fields are portable: `name`, `description`, `license`,
  `compatibility` (1–500 chars), `metadata` (string-to-string map), `allowed-tools`
  (experimental). Any other frontmatter field breaks claude.ai upload and API
  packaging — flag it unless the repo intentionally targets only clients that accept
  extensions (Claude Code adds fields like `when_to_use`, `context`, `model`,
  `paths`; these are not portable).
- [m] Body present and useful; guidance says keep it under roughly 5,000 tokens or
  500 lines; bundled files referenced by relative paths.
- [M] Relative links and image references inside SKILL.md resolve to files that exist.
- [m] Duplicate skill names across the repository (clients that merge collections
  show collisions; Codex shows duplicates side by side).

## 2. Claude Code marketplace.json (`.claude-plugin/marketplace.json`)

Live schema: https://json.schemastore.org/claude-code-marketplace.json

- [C] `name` present, kebab-case; not one of the reserved names (examples:
  `claude-plugins-official`, `anthropic-plugins`, `agent-skills`,
  `knowledge-work-plugins`, `anthropic-agent-skills`) and not an impersonation
  variant.
- [C] `owner` present with a `name`; `plugins` present as an array.
- [C] Every plugin entry has `name` and `source`.
- [C] String sources match `^\./.*` and resolve, relative to the marketplace root, to
  a directory that exists.
- [C] Object sources use one of exactly: `github` (requires `repo`), `url` (requires
  `url`), `git-subdir` (requires `url` and `path`), `npm` (requires `package`).
  Optional `ref`; optional `sha` must be exactly 40 hex characters.
- [M] No duplicate plugin names in the catalog.
- [m] Optional fields spelled correctly (`displayName`, `category`, `tags`, `strict`,
  `defaultEnabled`, `renames`, `metadata.pluginRoot`,
  `allowCrossMarketplaceDependenciesOn`, `forceRemoveDeletedPlugins`) — Claude
  ignores unknown fields silently, so a typo is a silent no-op.
- [i] `renames` map maintained when plugins were folded or renamed, so old installs
  migrate instead of breaking.

## 3. Claude Code plugin.json (`.claude-plugin/plugin.json`)

Live schema: https://json.schemastore.org/claude-code-plugin-manifest.json

- [C] If present, `name` exists and is kebab-case. (The manifest itself is optional;
  components auto-discover.)
- [M] `version`, when present, is semver — it pins updates; a malformed version
  breaks the pinning contract.
- [C] Component paths (`skills`, `commands`, `agents`, `hooks`, `mcpServers`,
  `lspServers`, `outputStyles`, `themes`, `monitors`) start with `./` and resolve to
  paths that exist. `skills` paths add to the default `skills/` scan; the others
  replace their defaults.
- [C] `userConfig` options each carry required `type` (one of `string`, `number`,
  `boolean`, `directory`, `file`), `title`, and `description`.
- [M] `dependencies` entries parse as `name`, `name@marketplace`, or objects with a
  `name`; version constraints are valid semver ranges.
- [M] `channels[].server` matches a declared `mcpServers` key.
- [m] Unknown top-level fields: ignored by Claude, but flag likely typos of real
  fields.
- [i] Claude Desktop name compatibility: plugin name at most 128 characters,
  alphanumerics plus `.`, `_`, `-`.

## 4. Codex plugin.json (`.codex-plugin/plugin.json`)

Live schema: https://www.schemastore.org/codex-plugin-manifest.json — strict:
`additionalProperties: false`, so unknown fields are **rejections**, not warnings.

- [C] Required: `name` (kebab-case), `version` (strict semver), `description`,
  `author` with `name`, and `interface`.
- [C] `interface` requires: `displayName`, `shortDescription`, `longDescription`,
  `developerName`, `category` (free string), `capabilities` (array with **at least
  one item** — an empty array fails the schema), and one of `defaultPrompt` or
  `default_prompt`.
- [C] `defaultPrompt` is a string or an array of one to three strings; entries over
  128 characters are truncated and extras beyond three are ignored — flag both.
- [C] Any field outside the schema's property list fails validation (including
  `$schema` and `hooks` — the manifest schema does not allow them; hooks live at the
  plugin root as `hooks/hooks.json`).
- [M] `author.url`, `homepage`, `repository`, `websiteURL`, `privacyPolicyURL`,
  `termsOfServiceURL` must be absolute https URLs when present.
- [M] `brandColor` matches `#` plus exactly six hex digits; `composerIcon`, `logo`,
  `logoDark`, and `screenshots` entries are package-relative paths to files that
  exist (screenshots are PNGs under `./assets/`).
- [M] `skills`, `apps`, `mcpServers` path values are relative (absolute paths
  rejected) and resolve.

## 5. Codex marketplace.json (`.agents/plugins/marketplace.json`)

Authority: the deserializer in openai/codex at
`codex-rs/core-plugins/src/marketplace.rs`. Codex also reads
`.claude-plugin/marketplace.json` as a compatibility path — audit both when both
exist.

- [C] Top level: `name` required; `plugins` required (array order is display order);
  optional `interface` with only `displayName`.
- [C] Every entry has `name` (must match the plugin folder and its plugin.json name)
  and `source`.
- [C] `source` is a bare string path or one of exactly: `local` (requires `path`),
  `url` (requires `url`; optional `path`, `ref`, `sha`), `git-subdir` (requires `url`
  and `path`), `npm` (requires `package`). There is **no `github` source type** on
  the Codex side — flag any.
- [C] `policy.installation`, when present, is one of exactly `NOT_AVAILABLE`,
  `AVAILABLE`, `INSTALLED_BY_DEFAULT` (default `AVAILABLE`). Values like
  `RECOMMENDED` or `AUTO_INSTALL` do not exist.
- [C] `policy.authentication`, when present, is `ON_INSTALL` or `ON_USE`.
- [C] `policy.products`, when present, contains only `chatgpt`, `codex`, `atlas`
  (lowercase canonical; uppercase aliases accepted).
- [m] Official guidance says include `policy` and `category` on every entry even
  though the deserializer defaults them.
- [i] Extra entry fields flatten into a fallback manifest when the plugin has no
  plugin.json metadata — legal, but flag unintentional shadowing when the plugin does
  have a manifest.

## 6. Per-skill agents/openai.yaml (Codex and ChatGPT UI sidecar)

Live schema: https://www.schemastore.org/codex-skill-metadata.json. All fields
optional; the file itself is optional per the spec (a repo's own policy may require
it — check the repo validator and report against the stricter of the two).

- [M] Recognized keys only under `interface`: `display_name`, `short_description`,
  `default_prompt` (a string here, not an array), `brand_color`, `icon_small`,
  `icon_large`. Under `policy`: `allow_implicit_invocation` (boolean). Under
  `dependencies`: `tools` entries with required `type` and `value`, optional
  `description`, `transport`, `url`.
- [M] Icon paths resolve relative to the skill directory.
- [m] `default_prompt` should reference the skill by its `$name` invocation so the
  inserted snippet actually triggers the skill.

## 7. Claude Cowork specifics

Cowork consumes the Claude Code plugin format unchanged; there are no Cowork-only
manifest fields. Checkable rules:

- [m] A distributed `.plugin` file is a zip of the plugin directory (renamed), with
  `.claude-plugin/plugin.json` inside and no `.DS_Store` entries.
- [m] Plugins that reference connectors generically use the `~~category` placeholder
  convention and document requirements in a `CONNECTORS.md` at the plugin root when
  shared externally.
- [i] Sub-agents and hooks run only in Cowork, not in web chat; skills relying on
  them should say so.

## 8. Cross-file consistency rules

These catch drift the per-file schemas cannot see:

- [C] Every plugin directory on disk is listed in each marketplace the repo
  maintains, and every marketplace entry points at a directory that exists.
- [M] Plugin `name` agrees across directory, both plugin manifests, and both
  marketplace entries.
- [M] `version` agrees across both plugin manifests and any repo-level version
  authority (for example a root package.json a sync script mirrors).
- [M] `description` parity across paired manifests when the repo's policy requires
  identical descriptions.
- [M] README and catalog claims match reality: skill and plugin counts (digits and
  spelled-out words), per-plugin counts in tables and layout blocks, and every skill
  named in its plugin README.
- [m] Category vocabulary coherent between marketplace entries and plugin manifest
  interfaces, or the divergence documented as intentional.
- [m] npm or package distribution (a `files` array or equivalent) ships every
  surface the README tells consumers to use.
- [i] Repo validator coverage: rules the vendor schemas enforce that the repo
  validator does not check are latent risk — list them.

## Sources

- https://code.claude.com/docs/en/plugin-marketplaces and /plugins-reference and /skills
- https://json.schemastore.org/claude-code-marketplace.json
- https://json.schemastore.org/claude-code-plugin-manifest.json
- https://agentskills.io/specification
- https://developers.openai.com/codex/skills and /plugins/build/plugins
- https://www.schemastore.org/codex-plugin-manifest.json and /codex-skill-metadata.json
- https://github.com/openai/codex (codex-rs/plugin/src/manifest.rs,
  codex-rs/core-plugins/src/marketplace.rs)
- https://claude.com/blog/cowork-plugins and
  https://github.com/anthropics/knowledge-work-plugins
