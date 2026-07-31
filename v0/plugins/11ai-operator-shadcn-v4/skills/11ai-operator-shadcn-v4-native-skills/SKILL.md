---
name: 11ai-operator-shadcn-v4-native-skills
description: "Discover, compatibility-check, install, update, remove, or explain shadcn's first-party Agent Skill for CLI v4 component, registry, preset, styling, composition, and primitive-base workflows. Use when asked about native shadcn skills, agent setup, upstream guidance, or whether an installed shadcn skill matches this v4 operator."
---
# 11ai shadcn v4 native skills

Version baseline: shadcn CLI 4.14.1 (stable) and the first-party `shadcn` Agent Skill in `shadcn-ui/ui`, verified 2026-07-31; upstream skill instructions are unversioned and therefore require evidence of current CLI v4 compatibility at the selected revision.

Treat the upstream skill as a versioned dependency even though its frontmatter has no release range. The authoritative source is [skills/shadcn](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn), announced in the [CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4).

## Inspect before changing anything

```bash
npx shadcn@4.14.1 info --json
rg --files .agents .claude .codex .github 2>/dev/null | rg '/shadcn/(SKILL|cli|styling|components|blocks|forms)'
```

Inspect project and user skill locations supported by the active agent, existing upstream files, source metadata, recorded revision, allowed tools, and current repository history. Never assume one destination or silently replace a modified skill.

## Enforce compatibility

Read the upstream `SKILL.md` and linked rule files at the chosen revision. Confirm they use CLI v4 commands such as `info`, `docs`, `search`, `view`, `add --dry-run`, and `add --diff`; recognize the host base, Tailwind family, aliases, and package runner; and do not require preview CLI behavior.

Reject instructions incompatible with CLI 4.14.1 or the host's Base UI, Radix, or React Aria base. An MCP server, `llms.txt`, registry docs, or community prompt is not the first-party Agent Skill.

## Install only on request

```bash
npx skills add shadcn/ui
```

Let the user choose the agent and project or user scope. Do not use `--all`, overwrite an existing skill, or enable shell permissions without explicit approval. Review every installed file and pin or record the upstream revision.

## Verify and report

Confirm the installed skill name is `shadcn`, its source is `shadcn-ui/ui`, the active agent discovers it, allowed commands match the package runner, and its current rules fit CLI 4.14.1 plus the host configuration. Report revision, destination, scope, project versions, base, Tailwind family, and compatibility result.
