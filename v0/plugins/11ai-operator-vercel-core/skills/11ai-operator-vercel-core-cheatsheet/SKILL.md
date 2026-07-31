---
name: 11ai-operator-vercel-core-cheatsheet
description: "Look up Vercel Core Platform CLI commands, account and project context, deployment, security, delivery, compute, observability, and CI/CD patterns. Use when the user wants a concise platform reference instead of a guided workflow."
---
# 11ai Vercel Core cheatsheet

Use the installed Vercel CLI and current project context as truth. This standalone plugin routes multi-step work only to sibling skills.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -100
npx vercel env ls 2>/dev/null | head -100
```

Confirm exact team, project, environment, deployment, domain, and account before any command. Never infer production from the current directory.

## Common commands

```bash
npx vercel inspect DEPLOYMENT
npx vercel logs DEPLOYMENT
npx vercel build
npx vercel deploy --help
```

Commands that deploy, promote, roll back, change domains or variables, or mutate policy require explicit approval. Use help and read-only inspection first.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-core-security` | Firewall, WAF, bot controls, headers, deployment protection, and access policy |
| `11ai-operator-vercel-core-content-delivery` | Domains, DNS, TLS, CDN caching, redirects, headers, and invalidation |
| `11ai-operator-vercel-core-fluid-compute` | Functions, regions, concurrency, duration, memory, streaming, and resource policy |
| `11ai-operator-vercel-core-observability` | Logs, metrics, traces, analytics, alerts, retention, and incident evidence |
| `11ai-operator-vercel-core-cicd` | Projects, Git integration, builds, previews, environments, promotion, rollback, and cleanup |

## Answer format

Lead with the smallest read-only command. State team, project, environment, deployment or domain, remote effect, verification, and approval gate.
