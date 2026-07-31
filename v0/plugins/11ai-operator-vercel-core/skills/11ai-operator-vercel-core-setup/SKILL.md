---
name: 11ai-operator-vercel-core-setup
description: "Install and configure Vercel Core Platform access from zero with a project-local CLI, exact team and project, Git and build settings, separated environments, safe authentication, one local build, and explicit deployment approval. Use when a repository has no Vercel setup or the user asks to initialize platform access."
---
# 11ai Vercel Core setup

Resolve repository, package manager, team, project ownership, framework, build and output commands, environments, domains, roles, billing, and deployment process before changing local or remote state.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Gather first

Confirm whether to create or link a project, Git provider and branch policy, preview and production variables by name, runtime, regions, domains, and rollback owner. Never invent identifiers or secrets.

## Install and configure

```bash
npm install --save-dev vercel
npx vercel --version
npx vercel link --help
```

Preview link and project-creation choices. Linking or creating a project is remote state and requires approval; authentication tokens never belong in commands or committed files.

Read [references/setup.md](references/setup.md) for the standalone setup sequence.

## Verify locally

```bash
npx vercel build --help
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run a local production build first. A preview deployment is a separate approved action, not an automatic setup check.

## Guardrails

Never print tokens or variable values, create projects, change Git integration, pull or write secrets, add domains, deploy, or promote without approval. Report files, team, project, environments, commands, checks, remote state, and rollback.
