---
name: 11ai-operations-plugin-creator
description: "Scaffold a new 11ai operations plugin for a tool, CLI, service, or SDK so it matches the existing operations plugins exactly, covering the skill archetypes, canonical frontmatter, safety contract, setup and integrations reference docs, Codex metadata, plugin manifests, and catalog wiring. Use when asked to create an operations plugin, add skills for a new tool, extend an existing operations plugin with a missing archetype, or check that an operations plugin follows the house pattern."
---
# 11ai operations plugin creator

Build a plugin named `11ai-TOOL-operations` that a reader cannot tell apart from the ones already in this repository. The shape is fixed, not a preference: `v0/scripts/validate-skills.mjs` rejects off-pattern frontmatter, missing Codex metadata, broken links, and catalog counts that do not add up. Read [references/plugin-blueprint.md](references/plugin-blueprint.md) before writing any file.

## Confirm the scope

Settle these before creating a directory:

- The tool and the surface being operated: a CLI, a hosted service and its dashboard, a client SDK, or a mix.
- Five to eight domain areas that each carry their own commands, failure modes, and safety rules.
- Whether an existing plugin already covers the tool. Extend that plugin rather than adding a second one.
- Which archetypes apply. Every plugin gets a cheatsheet, an environment skill, a setup skill, an integrations skill, and a troubleshooting skill; the rest are domain skills.

A domain area earns its own skill when it has commands the other areas do not, its own way of going wrong, and its own destructive operation to guard. If it has none of those, fold it into a neighbour.

## Lay out the files

```text
v0/plugins/11ai-TOOL-operations/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  README.md
  skills/11ai-TOOL-AREA/
    SKILL.md
    agents/openai.yaml
    references/setup.md
```

Every skill directory needs `SKILL.md` and `agents/openai.yaml`. Add `references/` only when the material is too long for the skill body: a setup walkthrough, an integration recipe, a command matrix, or a triage table.

## Write each skill

Follow the templates and archetype rules in [references/plugin-blueprint.md](references/plugin-blueprint.md). The rules that the validator enforces, and that break a release when missed:

- Frontmatter holds exactly two lines, `name` and `description`. The description is one double-quoted string on a single line with no angle brackets. Block scalars such as `>-` fail.
- The directory name and the `name` field must match, and the name must be unique across every plugin in the repository.
- `agents/openai.yaml` carries `display_name`, `short_description`, and `default_prompt`, all double-quoted. `short_description` must be 25 to 64 characters. `default_prompt` must contain the literal `$skill-name`.
- Every relative Markdown link must resolve from the skill directory.

Keep the safety contract in each skill, phrased in the tool's own vocabulary rather than copied: read before you write, never guess a value that changes behaviour, ask before a state change the user did not request, redact secrets before quoting output, and count or preview before a bulk change.

## Wire the plugin into the repository

A plugin that is not wired in fails validation even when every skill is perfect. Work through [references/wiring-checklist.md](references/wiring-checklist.md): both manifests, the marketplace entry, the plugin README table, the root README catalog row and layout entry and total count, and the site catalog in `v0/www/lib/skills.ts`.

## Verify

```bash
npm run validate-skills
```

Fix every reported error and rerun until it prints the new skill and plugin totals. Read the counts in the output and confirm they match what you intended to add.

## Report

Give the plugin name, the skill list with one line each, which archetypes were skipped and why, the reference docs added, the catalog files touched, and the validator's final line. Call out any domain area you deliberately folded into another skill.
