---
name: 11ai-operator-vercel-core-environment
description: "Inspect Vercel CLI and account state, team and project links, Git context, deployments, environment variable names, domains, build configuration, runtime settings, and observability without changing anything. Use before Vercel platform work, when scope is uncertain, or when the user asks what is configured."
---
# 11ai Vercel Core environment

Resolve exact local repository, authenticated account, team, linked project, environment, source commit, and production deployment. Keep this pass read-only.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect local and remote context

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -100
npx vercel env ls 2>/dev/null | head -100
npx vercel ls 2>/dev/null | head -100
npx vercel domains ls 2>/dev/null | head -100
```

List environment variable names and target environments, never values. Inspect command help before relying on remembered flags.

## Inspect checks

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Do not link, pull secret values, build if scripts mutate, deploy, promote, roll back, alias, change domains or policies, or delete resources.

## Interpretation

- **Wrong project** — compare local link, team, repository, and deployment source.
- **Environment mismatch** — preview, development, and production values are independent.
- **Build mismatch** — compare local and remote commands, runtimes, and source commit.
- **Traffic mismatch** — inspect domains, aliases, cache, firewall, and production deployment.

## Report

State CLI version, account, team, project, Git source, deployments, production target, domains, variable names by environment, compute config, observability, and ambiguities. Hand missing setup to `11ai-operator-vercel-core-setup` and failures to `11ai-operator-vercel-core-troubleshooting`.
