---
name: 11ai-operator-vercel-core-cicd
description: "Operate Vercel CI and CD including projects, Git integration, builds, previews, environment variables, checks, deployment inspection, aliases, promotion, rollback, and cleanup. Use when linking or deploying a project, configuring preview and production, diagnosing builds, promoting, rolling back, or cleaning deployments."
---
# 11ai Vercel Core CI and CD

A deployment command can create public state and promotion changes production traffic Resolve exact team, project, environment, deployment or domain, affected users, remote impact, and acceptance check before acting.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect first

```bash
npx vercel project ls 2>/dev/null
npx vercel ls 2>/dev/null | head -100
npx vercel env ls 2>/dev/null | head -100
rg -n 'vercel|deploy|preview|production' .github package.json vercel.json 2>/dev/null | head -160
```

Resolve team, project, Git repository and branch, environment, build command, output, variables by name, current production deployment, checks, and rollback target.

Confirm before changing:

- Exact team, project, and environment.
- Preview and production variable separation.
- Build reproducibility and checks.
- Immutable deployment selected for promotion.

## Operate

```bash
npx vercel build --help
npx vercel deploy --help
npx vercel promote --help
```

Build locally when possible, create previews only on request, inspect immutable deployment output, and promote only a reviewed deployment.

Never link repositories, create or delete projects, change environment values, deploy, alias, promote, roll back, or remove deployments without explicit approval Require explicit approval and preview exact resources, traffic, users, costs, remote effects, and rollback.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Confirm build, preview URL and access, exact source commit, variables by name, checks, production alias after approved promotion, and rollback. Report team, project, environment, resource IDs, settings, remote actions, user and cost impact, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting` and seams to `11ai-operator-vercel-core-integrations`.
