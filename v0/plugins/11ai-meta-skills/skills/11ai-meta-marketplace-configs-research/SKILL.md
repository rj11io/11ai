---
name: 11ai-meta-marketplace-configs-research
description: "Answer questions about marketplace, plugin, and skill configuration formats across Claude Code, Claude Cowork, claude.ai, the Claude API, OpenAI Codex, ChatGPT, the open Agent Skills standard, and the skills.sh CLI, from bundled research references verified against official docs, JSON schemas, and vendor source code on 2026-08-06. Covers file locations, every schema field and enum value, source variants, policy values, install flows, settings, caching, and how this repository's own config surfaces and validator map onto each ecosystem. Use when a user asks how any of these config files work, which fields or values are allowed, how the ecosystems differ, or where 11ai deviates from a spec."
---
# 11ai meta marketplace configs research

Answer configuration questions from the bundled references, not from memory. Every
reference was verified against a primary source (official docs pages, published JSON
schemas, or the vendor's own source code) on 2026-08-06. Each reference lists its source
URLs at the end.

## Answer contract

- Route the question with the table below, read the routed reference, and answer with a
  citation to the reference file and, where it matters, the original source URL it names.
- State the research date when the answer could have changed since: these are snapshots
  of fast-moving specs, not live truth. For "is this still current?" questions, fetch the
  source URL listed in the reference and compare.
- For questions about this repository's current state (counts, manifests, validator
  behavior), treat [references/11ai-repo-mapping.md](references/11ai-repo-mapping.md) as a
  dated snapshot and re-verify against the working tree: `v0/scripts/validate-skills.mjs`
  is the live authority for packaging rules.
- If the references do not cover a question, say so and name the source URL most likely
  to answer it. Do not guess field names, limits, or enum values.

## Routing table

| Question is about | Read |
| --- | --- |
| SKILL.md frontmatter fields, limits, naming rules, directory layout, progressive disclosure, adopting products | [references/agent-skills-standard.md](references/agent-skills-standard.md) |
| Claude Code marketplace.json fields, source variants, reserved names, renames | [references/claude-code.md](references/claude-code.md) |
| Claude Code plugin.json fields, component paths, userConfig, dependencies, hooks, MCP and LSP shapes | [references/claude-code.md](references/claude-code.md) |
| Claude Code skill frontmatter extensions, install flow, settings scopes, caching, auto-update, container env vars | [references/claude-code.md](references/claude-code.md) |
| Claude Cowork plugins, the .plugin file, the plugin directory, org distribution, Cowork versus Claude Code | [references/claude-cowork-claude-ai.md](references/claude-cowork-claude-ai.md) |
| Skills in claude.ai, Claude Desktop, org provisioning, the /v1/skills API | [references/claude-cowork-claude-ai.md](references/claude-cowork-claude-ai.md) |
| Codex skill discovery paths, agents/openai.yaml fields, implicit invocation, tool dependencies | [references/openai-codex-chatgpt.md](references/openai-codex-chatgpt.md) |
| .codex-plugin/plugin.json fields, the interface block, .agents/plugins/marketplace.json, policy enums, product gating | [references/openai-codex-chatgpt.md](references/openai-codex-chatgpt.md) |
| Codex config.toml keys, ChatGPT skills and plugin sharing | [references/openai-codex-chatgpt.md](references/openai-codex-chatgpt.md) |
| The skills.sh CLI, npx skills add, discovery, lockfiles, supported agents | [references/skills-cli.md](references/skills-cli.md) |
| Cross-ecosystem comparison: shared source vocabulary, manifest shapes, which product reads which file | [references/cross-ecosystem.md](references/cross-ecosystem.md) |
| How 11ai maps onto each ecosystem, what the validator enforces, known gaps and deviations | [references/11ai-repo-mapping.md](references/11ai-repo-mapping.md) |

## Escalation

- What a spec allows: the ecosystem reference.
- Whether a specific 11ai file conforms: the repo-mapping reference, then the file itself
  and `v0/scripts/validate-skills.mjs`.
- Whether the spec changed since 2026-08-06: fetch the source URL the reference cites.
