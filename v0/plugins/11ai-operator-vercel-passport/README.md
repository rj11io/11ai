# 11ai Vercel Passport operator

Ten standalone skills for protecting Vercel deployments with enterprise identity, with read-first checks around providers, projects, access, sessions, and secrets.

Version baseline: Current Enterprise public beta as of July 2026; no product version number.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-passport-cheatsheet`](./skills/11ai-operator-vercel-passport-cheatsheet/SKILL.md) | Quick protocol and dashboard reference |
| [`11ai-operator-vercel-passport-environment`](./skills/11ai-operator-vercel-passport-environment/SKILL.md) | Read-only plan, team, provider, and project inspection |
| [`11ai-operator-vercel-passport-setup`](./skills/11ai-operator-vercel-passport-setup/SKILL.md) | Pilot identity provider and deployment protection setup |
| [`11ai-operator-vercel-passport-integrations`](./skills/11ai-operator-vercel-passport-integrations/SKILL.md) | Application identity, authorization, audit, and deployment seams |
| [`11ai-operator-vercel-passport-troubleshooting`](./skills/11ai-operator-vercel-passport-troubleshooting/SKILL.md) | Evidence-led sign-in and coverage diagnosis |
| [`11ai-operator-vercel-passport-identity-providers`](./skills/11ai-operator-vercel-passport-identity-providers/SKILL.md) | OAuth and OIDC applications, discovery, endpoints, clients, scopes, and secrets |
| [`11ai-operator-vercel-passport-project-protection`](./skills/11ai-operator-vercel-passport-project-protection/SKILL.md) | Per-project enablement, deployment coverage, methods, previews, and rollback |
| [`11ai-operator-vercel-passport-team-policies`](./skills/11ai-operator-vercel-passport-team-policies/SKILL.md) | Team defaults, new projects, bulk assignment, exceptions, roles, and rollout |
| [`11ai-operator-vercel-passport-visitor-identity`](./skills/11ai-operator-vercel-passport-visitor-identity/SKILL.md) | Injected token header, external subject, claims, server use, and authorization |
| [`11ai-operator-vercel-passport-sessions-audit`](./skills/11ai-operator-vercel-passport-sessions-audit/SKILL.md) | Session cookies, expiry, revocation expectations, access reviews, logs, and incidents |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect Enterprise plan, team role, provider applications, project assignments, protection methods, and rollback before changing access.

Never guess provider endpoints, client type, scopes, assignments, project coverage, or session semantics. Read exact values from the provider and Vercel dashboards.

Ask before enabling or disabling Passport, creating or changing provider applications, rotating secrets, setting team defaults, bulk-assigning projects, or clearing sessions. Preview exact projects and access impact.

Never print client secrets, authorization codes, raw Passport tokens, cookies, or personal claims. Verify with test identities and a pilot project before broader rollout.
