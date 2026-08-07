# The Agent Skills open standard

Research date: 2026-08-06. Verified against agentskills.io and the spec repository.

The Agent Skills standard defines the portable skill format that both Anthropic and
OpenAI products consume. It was created by Anthropic and released as an open standard;
code is Apache-2.0, docs are CC-BY-4.0, and the community develops it at
github.com/agentskills/agentskills. The spec itself carries **no version number** — there
is no formal spec-versioning policy as of the research date.

## What a skill is

A skill is a **directory** containing a `SKILL.md` file (YAML frontmatter plus a Markdown
body), with optional conventional subdirectories:

- `scripts/` — executable code
- `references/` — documentation loaded on demand
- `assets/` — templates, images, data

Any other files are allowed.

## SKILL.md frontmatter — the complete standard field set

| Field | Required | Constraints |
| --- | --- | --- |
| `name` | Yes | 1–64 characters; lowercase `a-z`, `0-9`, and hyphens only; no leading, trailing, or consecutive hyphens; **must match the parent directory name** |
| `description` | Yes | 1–1024 characters, non-empty; should say what the skill does and when to use it |
| `license` | No | License name or a pointer to a bundled license file; keep it short |
| `compatibility` | No | 1–500 characters if present; environment requirements (intended product, system packages, network access); most skills should omit it |
| `metadata` | No | Arbitrary map of string keys to string values for client-specific properties; use reasonably unique key names |
| `allowed-tools` | No | Space-separated string of pre-approved tools, for example `Bash(git:*) Read`. Marked **experimental** — support varies by client |

No other frontmatter fields are part of the standard. The body is unrestricted Markdown;
non-normative guidance says keep it under roughly 5,000 tokens / 500 lines.

## Progressive disclosure

Three loading stages:

1. **Metadata** — name and description only, roughly 100 tokens, loaded at startup for
   every installed skill.
2. **Instructions** — the full SKILL.md body, loaded when the skill activates.
3. **Resources** — bundled files, read only when needed, referenced by relative paths
   kept one level deep from the skill root.

## Validation

The reference validator lives in the spec repository: `skills-ref validate ./my-skill`.

## Adopting products

The official client list (agentskills.io/clients) named about 45 products at research
time, including: Claude Code, Claude (claude.ai — covers Desktop and Cowork), ChatGPT
and Codex (OpenAI), Cursor, GitHub Copilot, VS Code, Gemini CLI, Goose (Block),
OpenCode, OpenHands, Amp, Letta, JetBrains Junie, Roo Code, Kiro, Factory, Databricks
Genie Code, Snowflake Cortex Code, Mistral AI Vibe, Spring AI, Tabnine, TRAE
(ByteDance), Qodo, Laravel Boost, and Pulumi Neo.

## Sources

- https://agentskills.io/specification
- https://agentskills.io/home and https://agentskills.io/clients
- https://github.com/agentskills/agentskills (reference validator under `skills-ref/`)
