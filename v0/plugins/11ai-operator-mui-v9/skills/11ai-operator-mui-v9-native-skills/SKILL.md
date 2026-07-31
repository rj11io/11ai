---
name: 11ai-operator-mui-v9-native-skills
description: "Discover, compatibility-check, install, update, remove, or explain Material UI's first-party styling, theming, Next.js, and Tailwind Agent Skills for MUI v9. Use when asked about native MUI skills, agent setup, upstream guidance, or whether installed Material UI skills match this v9 operator."
---
# 11ai Material UI v9 native skills

Version baseline: Material UI 9.2.0 (stable) and the first-party Agent Skills in `mui/material-ui`, verified 2026-07-31; each current metadata file declares `muiVersion` within `>=9.0.0 <10.0.0` before it is considered compatible.

Treat upstream skills as versioned dependencies. The authoritative catalog is [Material UI's skills directory](https://github.com/mui/material-ui/tree/master/skills), linked from the official theming and customization documentation.

## Inspect before changing anything

```bash
npm ls @mui/material @mui/material-nextjs tailwindcss next --depth=0
rg --files .agents .claude .codex .github 2>/dev/null | rg '/(material-ui-styling|material-ui-theming|material-ui-nextjs|material-ui-tailwind)/'
```

Inspect project and user skill locations supported by the active agent, existing `SKILL.md`, `AGENTS.md`, `metadata.json`, recorded source and revision, and upstream history. Never assume a single global destination.

## Enforce compatibility

The first-party catalog currently contains `material-ui-styling`, `material-ui-theming`, `material-ui-nextjs`, and `material-ui-tailwind`. For every selected skill, read its actual metadata and instructions at the chosen revision and require a `muiVersion` range containing the host project's installed v9 release.

Also check relevant framework versions: the Next.js skill must match the installed router and `@mui/material-nextjs`; the Tailwind skill must match the installed Tailwind v3 or v4 path. Reject v10, older-major, preview-only, or unversioned guidance unless the user explicitly requests migration research.

## Install only on request

```bash
npx skills add mui/material-ui
```

Let the user choose only the relevant skills, agent, and project or user scope. Do not use `--all`, overwrite an existing skill, or install scripts globally without explicit approval. Review upstream `SKILL.md`, `AGENTS.md`, metadata, scripts, permissions, and provenance first.

## Verify and report

After an explicit install, update, or removal, confirm selected skill names, first-party source, pinned revision or release, destination, active-agent discovery, MUI and framework versions, and compatibility result. If compatibility cannot be established, leave the installation unchanged and report the missing evidence.
