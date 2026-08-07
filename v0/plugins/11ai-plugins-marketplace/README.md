# 11ai Plugins Marketplace

A reserved home for skills that manage how 11ai plugins are listed,
versioned, and published across the Claude Code and Codex marketplaces.

## Skills

| Skill | Use it for |
| --- | --- |
| [`11ai-plugins-marketplace-placeholder`](./skills/11ai-plugins-marketplace-placeholder/SKILL.md) | Explaining what this plugin will hold, and pointing you to the tools that already scaffold and validate plugins today |

## Status

This plugin has one skill, and it is a placeholder. It does not register,
version, or publish anything yet. Two things already do related work:

- The [`11ai-meta-skills`](../11ai-meta-skills/README.md) plugin scaffolds a
  brand-new plugin end to end, and audits marketplace configuration files.
- [`v0/scripts/validate-skills.mjs`](../../scripts/validate-skills.mjs) is the
  script that checks every packaging rule a plugin must follow.

A real skill in this plugin should build on those, not repeat them.
