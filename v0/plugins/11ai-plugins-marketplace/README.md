# 11ai Plugins Marketplace

Audits and researches the marketplace, plugin, and skill configuration files
that a Claude Code or Codex skills repository ships: `marketplace.json`,
`plugin.json`, `SKILL.md`, and `agents/openai.yaml`.

## Skills

| Skill | Use it for |
| --- | --- |
| [`11ai-plugins-marketplace-audit-configs`](./skills/11ai-plugins-marketplace-audit-configs/SKILL.md) | Continuously auditing marketplace, plugin, and skill configuration files against the Claude Code, Claude Cowork, OpenAI Codex, and Agent Skills specifications until no critical or major finding remains |
| [`11ai-plugins-marketplace-research-configs`](./skills/11ai-plugins-marketplace-research-configs/SKILL.md) | Answering marketplace, plugin, and skill configuration questions across Claude Code, Claude Cowork, OpenAI Codex, ChatGPT, and the Agent Skills standard from dated, source-cited research references |

## How the two skills split the work

`11ai-plugins-marketplace-research-configs` answers "what does the spec allow"
from bundled, source-cited reference files. `11ai-plugins-marketplace-audit-configs`
answers "does this specific repository conform" by reading the actual files and
writing a timestamped findings report. Start with research for an open-ended
question; start with the audit when you already know which repository to check.

## Related

[`11ai-core-skills`](../11ai-core-skills/README.md) scaffolds a brand-new
plugin end to end. Read it before writing a new skill here, so plugin
creation and plugin auditing don't drift apart.
