# Claude Code: marketplace.json, plugin.json, skills, install flow

Research date: 2026-08-06. Verified against the official docs at code.claude.com and the
published JSON schemas at json.schemastore.org.

## 1. marketplace.json

Lives at `.claude-plugin/marketplace.json` in the marketplace repository root. Schema:
https://json.schemastore.org/claude-code-marketplace.json.

### Top level

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Kebab-case marketplace id, used in `plugin@marketplace`. One marketplace per name per user; adding a second with the same name replaces the first. Many names are reserved and blocked, including `claude-plugins-official`, `anthropic-plugins`, `agent-skills`, `knowledge-work-plugins`, `anthropic-agent-skills`, and impersonation variants |
| `owner` | Yes | Object: `name` (required), `email` (optional), `url` (optional) |
| `plugins` | Yes | Array of plugin entries (below) |
| `$schema` | No | Editor autocomplete only; ignored at load time |
| `description`, `version` | No | Marketplace metadata |
| `metadata` | No | Free-form object Claude Code does not read, except `metadata.pluginRoot`: a base directory prepended to relative plugin source paths |
| `allowCrossMarketplaceDependenciesOn` | No | Array of marketplace names whose plugins may be auto-installed as dependencies; only the root marketplace's allowlist applies (no transitive trust) |
| `renames` | No | Map of old plugin name to new name, or `null` when removed; Claude Code migrates user settings automatically. Requires v2.1.193+ |
| `forceRemoveDeletedPlugins` | No | Boolean; plugins removed from the catalog are auto-uninstalled and flagged |

### Plugin entries

Required: `name` and `source`. Optional: everything a plugin.json can carry (section 2),
**plus four marketplace-only fields**: `category` (string), `tags` (array of strings),
`strict` (boolean, default `true`), and `relevance` (plugin-suggestion signals, honored
only for marketplaces allowlisted via managed settings, v2.1.152+). Also `displayName`
(v2.1.143+), `version` (pins updates; git commit SHA is used when absent; the marketplace
entry version takes precedence over plugin.json per the marketplace docs), and
`defaultEnabled` (install disabled when `false`, v2.1.154+).

`strict` semantics: when `true`, the plugin's own plugin.json is the source of truth and
the marketplace entry supplements it; when `false`, the marketplace entry defines the
entire plugin and a conflicting plugin.json fails the load.

### source variants (all five)

1. **Relative path string** — must match `^\./.*`; resolved from the marketplace root
   (the directory containing `.claude-plugin/`), not from `.claude-plugin/` itself.
2. **github** — object `source: "github"`, `repo: "owner/repo"` (required), optional
   `ref` (branch or tag) and `sha` (exactly 40 hex characters).
3. **url** — object `source: "url"`, `url` (required; any git host, https or git@),
   optional `ref` and `sha`.
4. **git-subdir** — object `source: "git-subdir"`, `url` (required), `path` (required;
   the subdirectory containing the plugin; cloned sparsely), optional `ref` and `sha`.
5. **npm** — object `source: "npm"`, `package` (required), optional `version` (exact or
   range) and `registry` (custom registry URI).

## 2. plugin.json

Lives at `.claude-plugin/plugin.json` inside the plugin. Schema:
https://json.schemastore.org/claude-code-plugin-manifest.json.

The manifest is **optional**: components are auto-discovered in default locations and the
plugin name falls back to the directory name. If present, only **`name`** is required.
The schema is exactly the marketplace plugin entry minus `source`, `category`, `tags`,
and `strict` — 22 top-level properties, byte-identical shapes. Unrecognized top-level
fields are ignored (warnings only under `claude plugin validate`), which is deliberate so
one manifest can double for other ecosystems.

### Metadata fields

`$schema`, `displayName`, `version` (semver; pins updates), `description`, `author`
(object: `name` required, `email` and `url` optional), `homepage`, `repository`,
`license`, `keywords`, `metadata` (free-form, unread), `defaultEnabled`.

### Component path fields

Relative paths, must start `./`; string or array of strings unless noted.

| Field | Default location | Behavior |
| --- | --- | --- |
| `skills` | `skills/` (directories with SKILL.md) | **Adds to** the default scan |
| `commands` | `commands/` (legacy flat .md files) | Replaces the default |
| `agents` | `agents/` | Replaces the default |
| `hooks` | `hooks/hooks.json` | Merges; path, array, or inline object |
| `mcpServers` | `.mcp.json` | Merges; path, object map, or array |
| `lspServers` | `.lsp.json` | Merges |
| `outputStyles` | `output-styles/` | Replaces |
| `themes` | `themes/` | Replaces (experimental) |
| `monitors` | `monitors/monitors.json` | Persistent background watcher commands; each stdout line becomes a task notification |
| `workflows` | `workflows/` | Documented in the docs but **absent from the published JSON schema** |

### userConfig

Options Claude Code prompts the user for when the plugin is enabled. Per option: `type`
(required; one of `string`, `number`, `boolean`, `directory`, `file`), `title`
(required), `description` (required), `required`, `default`, `multiple` (string type
only), `sensitive` (masks input; stored in the macOS Keychain or
`~/.claude/.credentials.json` instead of settings), `min` and `max` (number type only).
Values substitute as `${user_config.KEY}` in MCP, LSP, and hook commands and export to
hook processes as `CLAUDE_PLUGIN_OPTION_KEY` environment variables. Non-sensitive values
are stored in settings under `pluginConfigs`.

### dependencies

Other plugins this plugin requires: strings (`"name"`, `"name@marketplace"`, optionally
with a `@^version` suffix) or objects `{name, version, marketplace}` with semver
constraints. Dependencies are auto-installed and auto-enabled.

### channels

Message-injection channels: array of `{server (required; must match an mcpServers key),
displayName (optional), userConfig (optional, same option shape)}`.

### Hooks

Object keyed by event name; each event maps to an array of `{matcher, hooks}`. The full
event enum has 29 values: PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch,
Notification, UserPromptSubmit, UserPromptExpansion, SessionStart, SessionEnd, Stop,
StopFailure, SubagentStart, SubagentStop, PreCompact, PostCompact, PermissionRequest,
PermissionDenied, Setup, TeammateIdle, TaskCreated, TaskCompleted, Elicitation,
ElicitationResult, ConfigChange, WorktreeCreate, WorktreeRemove, InstructionsLoaded,
CwdChanged, FileChanged. Five hook types: `command` (command required; optional `if`,
`shell` bash or powershell, `timeout`, `statusMessage`, `once`, `async`, `asyncRewake`),
`prompt` (prompt required; optional model), `agent` (prompt required; default timeout
60, default model Haiku), `http` (url required; `headers`, `allowedEnvVars`), and
`mcp_tool` (server and tool required; `input` with path interpolation).

### MCP and LSP shapes

MCP transports: `stdio` (command required; args default empty; env), `sse` and `http`
(type and url required; headers, headersHelper, oauth object with clientId,
callbackPort, authServerMetadataUrl, scopes, xaa), `ws` (url; headers; no oauth).

LSP servers (keyed by name, no extra properties): `command` and `extensionToLanguage`
required; optional `args`, `transport` (stdio default, or socket), `env`,
`initializationOptions`, `settings`, `workspaceFolder`, `startupTimeout`,
`shutdownTimeout`, `restartOnCrash`, `maxRestarts`.

### Environment variables for substitution

`${CLAUDE_PLUGIN_ROOT}` (plugin install directory), `${CLAUDE_PLUGIN_DATA}` (persistent
`~/.claude/plugins/data/{id}/`, survives updates), `${CLAUDE_PROJECT_DIR}` (project
root).

### Validation

`claude plugin validate ./my-plugin`; the `--strict` flag turns unknown-field warnings
into errors (useful in CI). Also checks duplicate names, path traversal, and Claude
Desktop name compatibility (max 128 chars; alphanumerics plus `.`, `_`, `-`).

## 3. Skill frontmatter extensions beyond the standard

Claude Code accepts the six standard Agent Skills fields plus its own extensions. The
extensions are **not portable**: uploading a skill using them to claude.ai errors with
the unexpected keys listed.

- Triggering: `when_to_use` (appended to description; the combined text is capped at
  1,536 characters), `paths` (glob patterns limiting auto-activation),
  `disable-model-invocation` (manual `/name` only; also blocks preloading into subagents
  and scheduled-task prompts), `user-invocable: false` (hidden from the slash menu).
- Execution: `argument-hint`, `arguments` (named positional arguments), `allowed-tools`
  (grant clears on the next user message), `disallowed-tools`, `model`, `effort` (low
  through max), `context: fork` with `agent` and `background`, `shell` (bash or
  powershell), `hooks` (skill-scoped).
- Dynamic context injection: a line of the form backtick-command preceded by `!` runs
  and its output replaces the line before Claude reads the skill; triple-backtick blocks
  prefixed `!` do the same.
- Body substitutions: `$ARGUMENTS`, indexed `$ARGUMENTS[N]` or `$0`, named `$name`,
  `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`, `${CLAUDE_SKILL_DIR}`,
  `${CLAUDE_PROJECT_DIR}`.
- Boolean frontmatter accepts yes/no/on/off/1/0 in any case (v2.1.218+).
- Skill locations by scope: `~/.claude/skills/` (personal), `.claude/skills/` (project),
  plugin skills (invoked namespaced as `/plugin:skill`; the frontmatter `name` replaces
  the directory name in that command), and enterprise via managed settings.
- Invoked skill content enters the conversation once and is not re-read on later turns.

## 4. Install flow, settings, caching

- Flow: `/plugin marketplace add SOURCE`, then `/plugin install name@marketplace`.
- Recorded in `enabledPlugins` (map of `"plugin@marketplace": true`) at user
  (`~/.claude/settings.json`), project (`.claude/settings.json`), or local
  (`.claude/settings.local.json`) scope; a read-only `managed` scope exists for
  administrators (with `strictKnownMarketplaces` and `blockedMarketplaces` controls).
- Team auto-install: `extraKnownMarketplaces` plus `enabledPlugins` in the project's
  `.claude/settings.json`; since v2.1.195 plugins from external sources prompt the user
  instead of loading silently.
- Caches: marketplaces at `~/.claude/plugins/marketplaces/NAME/`; plugins at
  `~/.claude/plugins/cache/MARKETPLACE/PLUGIN/VERSION/`. Replaced versions are orphaned
  and deleted after 14 days; running sessions keep working during that window.
- Background auto-update: enabled by default for official Anthropic marketplaces,
  disabled by default for third-party and local ones; toggled per marketplace.
- Container and offline env vars: `CLAUDE_CODE_PLUGIN_SEED_DIR`,
  `CLAUDE_CODE_PLUGIN_CACHE_DIR`, `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`,
  `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`, `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`.

## Sources

- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/discover-plugins
- https://json.schemastore.org/claude-code-marketplace.json
- https://json.schemastore.org/claude-code-plugin-manifest.json
