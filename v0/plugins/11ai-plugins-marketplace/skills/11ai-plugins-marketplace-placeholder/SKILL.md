---
name: 11ai-plugins-marketplace-placeholder
description: "A stand-in for the 11ai-plugins-marketplace plugin, reserved for skills that manage how 11ai plugins are listed, versioned, and published across the Claude Code and Codex marketplaces. It does not register or publish anything itself. Read 11ai-meta-skills first: it already scaffolds new plugins and audits marketplace config files, and any new skill here should build on that instead of repeating it."
---

# 11ai Plugins Marketplace Placeholder

## What this skill does right now

Nothing. It does not register a plugin, bump a version, or publish a release.
It is a sign-post for the `11ai-plugins-marketplace` plugin, which exists but
has no working skill yet.

## What already covers this ground

Two things in this repository do real work here today, and a new skill should
read both before adding anything:

- [`11ai-meta-operator-plugin-creator`](../../../11ai-meta-skills/skills/11ai-meta-operator-plugin-creator/SKILL.md)
  (in the `11ai-meta-skills` plugin) scaffolds a brand-new plugin end to end —
  its manifest files, its skill folder, and its entry in both marketplace
  files.
- [`v0/scripts/validate-skills.mjs`](../../../../scripts/validate-skills.mjs)
  checks every rule those files must follow: naming, versions matching
  `package.json`, marketplace entries on both sides, and README catalog
  counts. It is the actual source of truth, not this skill.

## What this plugin might hold once it is built

The gap those two do not fill is anything past a plugin's first commit:
keeping a plugin's marketplace listing current as it changes, moving or
renaming a plugin across both marketplace files, or managing how a plugin's
category and installation policy are set. None of that is decided yet — this
file exists so the plugin ships with a valid skill, not to lock in a design.

## If you are the one building the next skill here

Confirm the work is not already inside `11ai-meta-skills` first. If it is
genuinely new, delete this file, add the real skill under `skills/`, and
update this plugin's [README](../../README.md) and its two manifest files
(`.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`) the same way
every other 11ai plugin does it.
