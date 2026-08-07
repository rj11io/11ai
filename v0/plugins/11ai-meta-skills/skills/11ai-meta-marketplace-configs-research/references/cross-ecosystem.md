# Cross-ecosystem comparison

Research date: 2026-08-06. Synthesis over the other references; see each for sources.

## Which product reads which file

| File | Claude Code | Claude Cowork | Codex / ChatGPT |
| --- | --- | --- | --- |
| `SKILL.md` (Agent Skills standard) | Yes, plus extensions | Yes (standard fields only for claude.ai upload) | Yes (name and description) |
| `.claude-plugin/plugin.json` | Yes | Yes (same schema) | No |
| `.claude-plugin/marketplace.json` | Yes | Yes (add-from-repository) | **Yes — compatibility path** |
| `.codex-plugin/plugin.json` | No | No | Yes |
| `.agents/plugins/marketplace.json` | No | No | Yes |
| `agents/openai.yaml` (per skill) | No | No | Yes (UI metadata) |
| `.plugin` zip bundle | No | Yes (upload or chat drop) | No |

Because Codex reads Claude's marketplace file for compatibility, the
`.claude-plugin/marketplace.json` is effectively the cross-vendor lowest common
denominator for repo-hosted catalogs.

## Manifest philosophy

- Claude's plugin.json is **loader-shaped**: only `name` is required; everything else
  has defaults and auto-discovery; unknown fields are ignored by design so a manifest
  can serve other ecosystems.
- Codex's plugin.json is **store-listing-shaped**: five required top-level fields plus a
  seven-field required `interface` block; unknown fields are rejected
  (additionalProperties false).
- Claude's plugin.json is a strict subset of its marketplace plugin entry (entry equals
  manifest plus `source`, `category`, `tags`, `strict`); with `strict: false` a
  marketplace entry can fully stand in for a manifest. Codex mirrors the idea from the
  other direction: extra marketplace-entry fields flatten into a fallback manifest when
  the plugin has none.

## Shared source vocabulary

Both marketplace formats use near-identical source keys (`url`, `path`, `ref`, `sha`,
`package`, `version`, `registry`):

| Variant | Claude Code | Codex |
| --- | --- | --- |
| Bare relative path | Yes (`./...` string) | Yes (untagged string) |
| local | via bare path | `{"source": "local", "path"}` |
| github (owner/repo) | `{"source": "github", "repo"}` | **Not supported** (use url or git-subdir) |
| url (any git host) | Yes | Yes (adds optional `path`) |
| git-subdir | Yes | Yes |
| npm | Yes | Yes |

## Skill metadata layering

- Claude Code layers extra behavior **inside SKILL.md frontmatter** (about 15
  non-portable fields: when_to_use, context fork, paths, model, effort, dynamic command
  injection, and more).
- Codex layers extra UI metadata **in a sidecar file** (`agents/openai.yaml`), keeping
  SKILL.md pure standard. The sidecar carries display name, short description, default
  prompt, icons, brand color, an implicit-invocation policy, and MCP tool dependencies.

## Policy and enablement

- Claude: `defaultEnabled` (boolean) on the plugin or marketplace entry;
  `disable-model-invocation` and `user-invocable` per skill; managed-settings controls
  for orgs.
- Codex: `policy.installation` per marketplace entry (`NOT_AVAILABLE`, `AVAILABLE`
  default, `INSTALLED_BY_DEFAULT`), `policy.authentication` (`ON_INSTALL` default,
  `ON_USE`), `policy.products` (`chatgpt`, `codex`, `atlas`);
  `policy.allow_implicit_invocation` per skill in openai.yaml; per-skill `enabled`
  toggles in config.toml.

## Versioning

- Claude plugins: semver in plugin.json or the marketplace entry pins updates; git
  commit SHA is the implicit version otherwise; 14-day orphan window in the cache.
- Codex plugins: strict semver required in the manifest.
- Skills API versions: Unix-epoch-timestamp strings, not semver; full-snapshot uploads.
- The Agent Skills spec itself: unversioned.
