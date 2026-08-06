---
name: 11ai-operator-plugin-creator
description: "Scaffold a version-focused 11ai operator plugin for a tool, CLI, service, or SDK so it matches the existing operator plugins exactly, covering version selection, identity naming, first-party native-skill discovery and compatibility, skill archetypes, safety, manifests, and catalog wiring. Use when asked to create or extend an operator plugin, add skills for a technology, or check that an operator plugin follows the house pattern and targets the requested or latest stable version."
---
# 11ai operator plugin creator

Build a plugin named `11ai-operator-TOOL-ID` that a reader cannot tell apart from the ones already in this repository. `TOOL-ID` includes the technology's version identifier when applicable. The shape is fixed: `v0/scripts/validate-skills.mjs` rejects off-pattern frontmatter, missing Codex metadata, broken links, and catalog counts that do not add up. Read [references/plugin-blueprint.md](references/plugin-blueprint.md) before writing any file.

## Confirm the scope

Settle these before creating a directory:

- The tool and the surface being operated: a CLI, a hosted service and its dashboard, a client SDK, or a mix.
- The requested version, or the latest stable production version when none was requested.
- Five to eight domain areas that each carry their own commands, failure modes, and safety rules.
- Whether an existing plugin already covers the tool. Extend that plugin rather than adding a second one.
- Which archetypes apply. Every plugin gets a cheatsheet, an environment skill, a setup skill, an integrations skill, and a troubleshooting skill; the rest are domain skills.
- Whether the publisher documents first-party Agent Skills. Search official product documentation and publisher-owned repositories; when they exist, add one common `11ai-operator-TOOL-ID-native-skills` bridge.

A domain area earns its own skill when it has commands the other areas do not, its own way of going wrong, and its own destructive operation to guard. If it has none of those, fold it into a neighbour.

## Establish the version baseline

Honor an explicitly requested version even when it is not the newest. Otherwise, browse current primary sources—official documentation, release notes, specifications, and publisher-owned registry metadata—to verify the latest stable production release; do not rely on model memory or a neighbouring plugin. Record the exact release or standard, stability status, research date, and official sources. Do not silently select a beta, release candidate, canary, or preview; use one only when requested or when the product has no stable release, and label that status prominently.

Use the ecosystem's conventional public version form in every plugin and skill name. Use `-vMAJOR` for package, framework, compiler, runtime, CLI, or product release families conventionally treated as versioned releases, such as `reactjs-v19` and `aws-cli-v2`. Use a bare hyphenated number when the number is part of a named standard or language generation, such as `html-5` and `css-3`; do not insert a `v` between the technology and that number. Preserve an official edition or cross-SDK release-family label such as `javascript-es2026` or `clerk-core-3`. Use the major or generation in the identity while documenting and pinning the exact current compatible release in the content. If the technology has no public version number, omit the suffix—never invent one. Keep the baseline uniform across all skills, manifests, references, prompts, links, and catalogs.

Treat native skills as versioned dependencies of the operator. Before recommending or installing one, compare its release, metadata, changelog, and actual instructions with the plugin's requested/latest technology baseline and the host project's installed version. A first-party skill that targets another major must be rejected or clearly gated as migration-only; an unversioned upstream skill still needs a documented compatibility check. Never rename the operator to match the native-skill package version—the technology baseline controls the identity.

## Lay out the files

```text
v0/plugins/11ai-operator-TOOL-ID/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  README.md
  skills/11ai-operator-TOOL-ID-AREA/
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
- Every skill states its version baseline near the top and uses only APIs, commands, defaults, runtime requirements, and migration advice valid for that baseline. Explicitly exclude newer prerelease APIs and identify deprecated or legacy patterns instead of presenting them as current.
- Setup and integration references pin or constrain dependencies to the chosen version family and link to the primary sources used to establish it.
- A conditional `*-native-skills` skill names only first-party Agent Skills sources, inspects existing agent/project skill locations, checks compatibility with the plugin and host-project versions, and installs, updates, or removes skills only when the user requests that state change. Do not mislabel MCP servers, `llms.txt`, prompts, rules files, or community skills as native skills.

Keep the safety contract in each skill, phrased in the tool's own vocabulary rather than copied: read before you write, never guess a value that changes behaviour, ask before a state change the user did not request, redact secrets before quoting output, and count or preview before a bulk change.

## Wire the plugin into the repository

A plugin that is not wired in fails validation even when every skill is perfect. Work through [references/wiring-checklist.md](references/wiring-checklist.md): both manifests, the marketplace entry, the plugin README table, the root README catalog row and layout entry and total count, and the site catalog in `v0/www/lib/skills.ts`.

## Verify

```bash
npm run validate-skills
```

Fix every reported error and rerun until it prints the new skill and plugin totals. Read the counts in the output and confirm they match what you intended to add. Search the plugin and catalogs for the unversioned or previous identity, mismatched version labels, cross-plugin dependencies, and native-skill instructions incompatible with the chosen technology baseline; none may remain.

## Report

Give the plugin name, version baseline and primary sources, the skill list with one line each, which archetypes were skipped and why, the native-skill source and compatibility decision (or the official search result that none exists), the reference docs added, the catalog files touched, and the validator's final line. Explain why the identity has no version suffix when the technology has no public version number. Call out any domain area you deliberately folded into another skill.
