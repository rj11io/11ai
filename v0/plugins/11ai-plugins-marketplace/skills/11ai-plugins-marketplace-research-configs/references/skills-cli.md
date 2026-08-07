# The skills.sh CLI (npx skills)

Research date: 2026-08-06. Verified against github.com/vercel-labs/skills and
skills.sh/docs/cli.

Maintained by **Vercel Labs**, MIT-licensed. skills.sh is the public catalog, populated
partly by install telemetry. This is the CLI the 11ai README recommends:
`npx skills add rj11io/11ai --full-depth`.

## Commands

`add`, `use`, `list` (alias `ls`), `find`, `remove` (alias `rm`), `update`, `init`,
`check`, and `install` with no arguments, which restores skills from the lockfile.

## Key flags on add

- `-g` / `--global` — install to the user scope instead of the project
- `-a` / `--agent AGENTS...` — target specific agents
- `-s` / `--skill SKILLS...` — pick specific skills
- `--copy` — copy files instead of symlinking
- `-y`, `--all`, `-l` / `--list`
- `--full-depth` — discovers SKILL.md files outside the standard container directories
  (for example under examples/ or tests/). This is why 11ai needs it: the collection
  organizes skills under `v0/plugins/PLUGIN/skills/` instead of one top-level `skills/`
  directory.

## Discovery

Standard discovery walks `skills/` (including `.curated`, `.experimental`, and `.system`
sublayouts), the repo root, and roughly 40 known agent directories (`.claude/skills/`,
`.agents/skills/`, `.cursor/skills/`, and so on), up to three levels deep; shallower
skills shadow deeper ones with the same name.

## Supported agents

Roughly 76 agents at research time. Mappings that matter here: Claude Code installs to
`.claude/skills/` (project) — note this differs from 11ai's plugin-based Claude
distribution; Codex installs to `.agents/skills/` (project) and `~/.codex/skills`
(global — the CLI's mapping, even though Codex's own official user path is
`~/.agents/skills`); plus Cursor, Gemini CLI, GitHub Copilot, OpenCode, Windsurf, Amp,
Goose, and many more.

## Lockfiles and env vars

- Project lockfile: `skills-lock.json` — minimal schema, sorted keys, SHA-256 content
  hashes; meant to be committed.
- Global lockfile: `~/.agents/.skill-lock.json` (or `$XDG_STATE_HOME/skills/.skill-lock.json`).
- Env vars: `INSTALL_INTERNAL_SKILLS=1`; `DISABLE_TELEMETRY` or `DO_NOT_TRACK`.
- A skill with `metadata.internal: true` in its frontmatter is hidden from discovery.

## Sources

- https://github.com/vercel-labs/skills
- https://www.skills.sh/docs/cli
- https://vercel.com/changelog/introducing-skills-the-open-agent-skills-ecosystem
