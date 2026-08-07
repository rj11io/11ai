# OpenAI Codex and ChatGPT: skills, plugins, marketplaces, config

Research date: 2026-08-06. Verified against the official docs (developers.openai.com,
which 308-redirects to learn.chatgpt.com — "ChatGPT Learn"), the published JSON schemas
on schemastore.org, and the openai/codex source code (the Rust deserializers are the
authority for the marketplace format).

## 1. Codex skill discovery

Checked in this order; duplicate names are not merged (both appear in selectors):

1. Repository scope: `$CWD/.agents/skills`, `$CWD/../.agents/skills`,
   `$REPO_ROOT/.agents/skills`
2. User scope: `$HOME/.agents/skills`
3. Admin scope: `/etc/codex/skills`
4. System scope: skills bundled with Codex

`~/.codex/skills` appears in third-party tooling (including the skills.sh CLI's global
mapping) but is **not** in the current official discovery list; whether it still works as
a legacy path could not be verified.

SKILL.md follows the open Agent Skills standard; Codex reads `name` and `description` for
triggering. Invocation: `@` mention in ChatGPT; `/skills` or `$skill-name` in Codex CLI
and IDE; implicit when the task matches the description. The skills list at startup is
capped at 2% of the context window (or 8,000 characters when the window is unknown).

The old catalog repo github.com/openai/skills is marked **no longer active**; the current
path is github.com/openai/plugins and the "Build plugins" guide.

## 2. Per-skill agents/openai.yaml (UI metadata sidecar)

Schema: https://www.schemastore.org/codex-skill-metadata.json. All fields optional;
additional properties are allowed.

- `interface.display_name` — user-facing name in skill lists and chips
- `interface.short_description` — user-facing description
- `interface.default_prompt` — a **string** (unlike the plugin manifest, where the
  default prompt can be an array); snippet inserted when invoking the skill
- `interface.brand_color` — hex color for UI accents
- `interface.icon_small`, `interface.icon_large` — asset paths relative to the skill dir
- `policy.allow_implicit_invocation` — boolean, default true; when false Codex will not
  auto-invoke the skill, only explicit `$skill` invocation works
- `dependencies.tools` — array of tool dependencies: `type` (required; documented value
  `mcp`), `value` (required; for example the MCP server name), `description` (optional),
  `transport` (optional; documented value `streamable_http`), `url` (optional)

## 3. .codex-plugin/plugin.json

Schema: https://www.schemastore.org/codex-plugin-manifest.json (upstream:
`codex-rs/plugin/src/manifest.rs`). Strict: **additionalProperties false** — unknown
fields are rejected, unlike Claude's manifest. The manifest is store-listing-shaped.

**Required:** `name` (kebab-case), `version` (strict semver, prerelease and build
suffixes allowed), `description`, `author` (object: `name` required; `email` optional;
`url` optional and must be https), `interface`.

**Optional:** `id`, `skills` (relative path; absolute paths rejected), `apps` (path to
`.app.json` — ChatGPT apps; app ids look like `plugin_asdk_app_...`), `mcpServers`
(relative path such as `./.mcp.json` or an inline server map), `homepage` (https),
`repository` (https), `license`, `keywords` (unique strings).

**interface object** — required: `displayName`, `shortDescription`, `longDescription`,
`developerName`, `category` (free string, no enum), `capabilities` (array of free
strings, **minimum one item**), and one of `defaultPrompt` or `default_prompt` (string,
or array of 1 to 3 strings; each capped at 128 characters, about 50 recommended; extras
ignored). Optional: `websiteURL`, `privacyPolicyURL`, `termsOfServiceURL` (all absolute
https), `brandColor` (pattern `#` plus six hex digits), `composerIcon`, `logo`,
`logoDark` (package-relative asset paths that must exist), `screenshots` (PNG paths
under `./assets/`).

The JSON schema does **not** allow a `hooks` key in the manifest, although the plugin
root may carry `hooks/hooks.json` (lifecycle hooks; env vars `PLUGIN_ROOT` and
`PLUGIN_DATA`), `.mcp.json`, `.app.json`, and `assets/`.

## 4. .agents/plugins/marketplace.json

Authority: the Rust deserializer at `codex-rs/core-plugins/src/marketplace.rs`.
Locations: personal `~/.agents/plugins/marketplace.json`; repo
`$REPO_ROOT/.agents/plugins/marketplace.json`; and, for compatibility, **Codex also
reads Claude's `.claude-plugin/marketplace.json`**.

**Top level:** `name` (required), `interface` (optional; single field `displayName`),
`plugins` (required; array order controls display order).

**Plugin entry:** `name` (required; must match the folder and plugin.json name),
`source` (required), `policy` (optional in the deserializer — defaults apply — but the
official guidance says always include it), `category` (optional string; guidance says
include it). Any **other fields flatten into a fallback manifest**: when the plugin has
no plugin.json metadata, extra entry fields (displayName, author, interface, keywords,
and so on) are folded into a synthetic manifest.

**source variants:**

1. Bare string path (untagged)
2. `{"source": "local", "path": "./relative/path"}`
3. `{"source": "url", "url": "git url", "path": optional, "ref": optional, "sha": optional}`
4. `{"source": "git-subdir", "url": "git url", "path": required, "ref": optional, "sha": optional}`
5. `{"source": "npm", "package": required, "version": optional, "registry": optional}`

There is **no `github` source type** on the Codex side (third-party docs mention one;
the official code does not have it).

**policy object** (all fields have serde defaults):

- `installation` — exactly three values: `NOT_AVAILABLE`, `AVAILABLE` (the default),
  `INSTALLED_BY_DEFAULT`. No `RECOMMENDED` or `AUTO_INSTALL` value exists anywhere in
  openai/codex. (A separate app-server availability field uses `AVAILABLE` /
  `DISABLED_BY_ADMIN`, with `ENABLED` as a legacy API alias — those are API response
  values, not marketplace.json values.)
- `authentication` — `ON_INSTALL` (default) or `ON_USE`.
- `products` — optional array gating by product; enum values `chatgpt`, `codex`,
  `atlas` (serialized lowercase; uppercase aliases accepted). Omit unless gating is
  actually wanted.

**Install commands:** `codex plugin marketplace add owner/repo [--ref main]`,
`add GIT-URL --sparse .agents/plugins`, `add ./local-path`, plus `list`, `upgrade`,
`remove`. The ChatGPT desktop app has a UI flow, workspace sharing keeps plugins inside
the org boundary, and public distribution goes through OpenAI's submission portal.

## 5. Codex config.toml

`~/.codex/config.toml` (user) or `.codex/config.toml` (project). Skill and plugin keys:

- `[[skills.config]]` entries with `path` (path to the skill folder's SKILL.md) and
  `enabled` (boolean) — per-skill toggle without deleting files
- `features.skill_mcp_dependency_install` (boolean, default on) — prompt to install MCP
  dependencies declared by skills
- `plugins.PLUGIN.mcp_servers.SERVER.enabled`, `.default_tools_approval_mode` (one of
  `auto`, `prompt`, `writes`, `approve`), `.enabled_tools`, `.disabled_tools`, and
  per-tool `.tools.TOOL.approval_mode`
- `features.plugin_sharing = false` — only in the cloud-managed admin file
  `requirements.toml`; disables workspace plugin sharing

## 6. ChatGPT

Skills are a first-class ChatGPT surface: the same official doc covers ChatGPT and Codex
(mention a skill by typing `@`). Today's "plugins" are skills-plus-MCP-plus-apps bundles
installed and shared through the ChatGPT desktop app, org-bounded workspace sharing, and
a public directory behind a submission portal. `.app.json` ties plugins to registered
apps from the Apps SDK lineage. This system is unrelated to the 2023 ChatGPT plugin
system.

## Sources

- https://developers.openai.com/codex/skills (redirects to
  https://learn.chatgpt.com/docs/build-skills)
- https://developers.openai.com/plugins/build/plugins
- https://learn.chatgpt.com/docs/config-file/config-reference.md
- https://www.schemastore.org/codex-plugin-manifest.json
- https://www.schemastore.org/codex-skill-metadata.json
- https://www.schemastore.org/codex-hooks.json
- https://github.com/openai/codex — codex-rs/plugin/src/manifest.rs,
  codex-rs/core-plugins/src/marketplace.rs, codex-rs/protocol/src/protocol.rs
- https://github.com/openai/plugins and https://github.com/openai/skills (inactive)
