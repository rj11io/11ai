# 11ai Vercel Core Platform operator

Ten standalone skills for Vercel security, content delivery, Fluid Compute, observability, and CI/CD, with read-first checks around production traffic and remote state.

Version baseline: Current Vercel platform and CLI behavior as of July 2026; no single platform major.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-core-cheatsheet`](./skills/11ai-operator-vercel-core-cheatsheet/SKILL.md) | Quick CLI and platform reference |
| [`11ai-operator-vercel-core-environment`](./skills/11ai-operator-vercel-core-environment/SKILL.md) | Read-only account, project, deployment, and configuration inspection |
| [`11ai-operator-vercel-core-setup`](./skills/11ai-operator-vercel-core-setup/SKILL.md) | Project-local CLI and platform setup |
| [`11ai-operator-vercel-core-integrations`](./skills/11ai-operator-vercel-core-integrations/SKILL.md) | Git, DNS, data, identity, observability, and CI seams |
| [`11ai-operator-vercel-core-troubleshooting`](./skills/11ai-operator-vercel-core-troubleshooting/SKILL.md) | Evidence-led platform diagnosis |
| [`11ai-operator-vercel-core-security`](./skills/11ai-operator-vercel-core-security/SKILL.md) | Firewall, WAF, bot controls, headers, deployment protection, and access policy |
| [`11ai-operator-vercel-core-content-delivery`](./skills/11ai-operator-vercel-core-content-delivery/SKILL.md) | Domains, DNS, TLS, CDN caching, redirects, headers, and invalidation |
| [`11ai-operator-vercel-core-fluid-compute`](./skills/11ai-operator-vercel-core-fluid-compute/SKILL.md) | Functions, regions, concurrency, duration, memory, streaming, and resource policy |
| [`11ai-operator-vercel-core-observability`](./skills/11ai-operator-vercel-core-observability/SKILL.md) | Logs, metrics, traces, analytics, alerts, retention, and incident evidence |
| [`11ai-operator-vercel-core-cicd`](./skills/11ai-operator-vercel-core-cicd/SKILL.md) | Projects, Git integration, builds, previews, environments, promotion, rollback, and cleanup |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect authenticated account, team, linked project, environment, source commit, current production deployment, domains, variables by name, and policies before changing anything.

Never guess project IDs, environments, deployments, domains, build settings, runtime, regions, cache policy, firewall rules, or variable values.

Ask before linking or creating projects, changing variables, deploying, promoting, rolling back, aliasing, changing domains or DNS, invalidating caches, editing security policy, or deleting resources. Preview exact production and user impact.

Never print tokens, variable values, private logs, request bodies, signed URLs, or personal data. Count projects, deployments, domains, rules, and affected traffic before bulk changes and verify preview before production.
