# Claude Cowork, claude.ai, Claude Desktop, and the Skills API

Research date: 2026-08-06. Verified against claude.com, support.claude.com,
platform.claude.com, and the anthropics GitHub organization.

## 1. Claude Cowork plugins

Cowork is Anthropic's desktop agent workspace. Plugin support launched January 30, 2026
as a research preview for all paid Claude plans.

**Cowork uses the Claude Code plugin format unchanged.** Anthropic's own
create-cowork-plugin skill states the schema "is shared with Claude Code's plugin
system": the same `.claude-plugin/plugin.json`, `skills/` directories with SKILL.md,
`commands/` (legacy flat markdown — the Cowork UI presents commands and skills as one
"Skills" concept), `agents/`, `hooks/hooks.json`, and `.mcp.json` for connectors. No
Cowork-specific manifest field exists in any official source (no icons or policy field).

**What a Cowork plugin bundles:** skills, connectors (MCP servers), slash commands,
sub-agents, and hooks. Two components are Cowork-only relative to the chat surfaces:
**sub-agents and hooks do not run in web chat or the Desktop Chat tab**. Anthropic's own
guidance calls agents uncommon and hooks rare in Cowork plugins. Claude Code components
absent from the Cowork docs: LSP servers, monitors, themes, workflows, output styles,
channels, and plugin dependencies.

**The .plugin file:** a `.plugin` file is simply **a zip of the plugin directory renamed
with the .plugin extension**, named after plugin.json's `name`. Minimum content:
`.claude-plugin/plugin.json` with at least a kebab-case `name`. Dropped into a Cowork
chat, it renders a rich preview with a browse-and-accept button. Packaging command shape:
zip the plugin directory recursively, excluding `.DS_Store`.

**Install paths in Cowork:**

1. The public directory at claude.com/plugins — 100+ plugins, filters for "Works with:
   Cowork / Claude Code", install counts, Anthropic-verified badges; submissions via a
   directory-submission form.
2. Upload a `.plugin` file.
3. Add a marketplace: the Plugins tab offers "Add marketplace" (Anthropic-built ones) and
   "Add from a repository" — git and GitHub-hosted marketplace repos work in Cowork.

**Cowork conventions:** connector placeholders written as `~~category` (for example
`~~project tracker`) let a plugin reference a connector category rather than a specific
server, with a `CONNECTORS.md` file at the plugin root documenting requirements for
externally shared plugins.

**Org distribution:** Team and Enterprise admins can distribute plugins organization-wide
from Organization settings; required plugins cannot be removed by users, auto-installed
ones can be uninstalled, and Enterprise admins can scope availability by group.

**Reference plugins:** github.com/anthropics/knowledge-work-plugins — 11 open-source
plugins (productivity, sales, customer support, product management, marketing, legal,
finance, data, enterprise search, bio-research, cowork-plugin-management) that install in
both Cowork and Claude Code from the same repo.

## 2. Skills in claude.ai and Claude Desktop

- Upload flow: Settings, then Capabilities, enable "Code execution and file creation";
  then Customize, Skills, upload a ZIP whose top-level folder contains SKILL.md. Only
  the six standard Agent Skills frontmatter fields are accepted; Claude Code extension
  fields cause an upload error listing the unexpected keys.
- Org provisioning: Team and Enterprise owners enable Skills under Organization
  settings and can provision skills org-wide by uploading a zip.
- Claude Desktop stores claude.ai-synced skills locally as a standard plugin (observed
  at Application Support/Claude/local-agent-mode-sessions/skills-plugin/ with a normal
  `.claude-plugin/plugin.json` named `anthropic-skills` plus a Desktop-specific
  manifest.json listing each skill with skillId, creatorType, and enabled flags) —
  local observation, not an official doc.

## 3. The Skills API

Beta endpoints under `/v1/skills` with header `anthropic-beta: skills-2025-10-02`:

- `POST /v1/skills` — multipart upload; all files under one top-level directory
  containing SKILL.md.
- `GET /v1/skills` — paginated; `source` filter takes `custom` or `anthropic`.
- `GET` / `DELETE /v1/skills/{skill_id}`.
- `POST` / `GET /v1/skills/{skill_id}/versions`; `GET` / `DELETE` on a version;
  `GET .../versions/{version}/content` downloads the version as a zip.
- Skill object: `id` (prefix `skill_`), `display_title` (never sent to the model),
  `latest_version`, `source` (`custom` or `anthropic`), timestamps. Version object:
  `id` (prefix `skillver_`), `version` (a Unix-epoch-timestamp string, **not semver**),
  `name` and `description` extracted from SKILL.md, `directory`. Each version is a full
  snapshot re-upload, not a delta.

## 4. Marketplace surfaces on the Anthropic side

- github.com/anthropics/skills — the official example-skills collection (creative,
  dev, enterprise, and the document skills docx/pdf/pptx/xlsx). It doubles as a Claude
  Code marketplace: add it with the plugin marketplace command, then install for
  example `document-skills@anthropic-agent-skills`.
- The consumer directory is claude.com/plugins. No dedicated claude.com/skills consumer
  directory could be verified at research time.

## Sources

- https://claude.com/blog/cowork-plugins
- https://support.claude.com/en/articles/13837440-use-plugins-in-claude
- https://support.claude.com/en/articles/12512180-use-skills-in-claude
- https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization
- https://claude.com/plugins
- https://github.com/anthropics/knowledge-work-plugins (including the
  create-cowork-plugin skill under cowork-plugin-management)
- https://github.com/anthropics/skills
- https://platform.claude.com/docs/en/api/beta/skills and
  https://platform.claude.com/docs/en/build-with-claude/skills-guide
