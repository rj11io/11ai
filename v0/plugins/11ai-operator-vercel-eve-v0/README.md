# 11ai Vercel eve v0 operator

Ten standalone skills for filesystem-first durable agents, definitions, tools, skills, sessions, workflows, subagents, approvals, channels, schedules, evals, and observability, with read-first checks around account scope, permissions, credentials, costs, remote actions, and production state.

Version baseline: eve 0.27 preview line, pinned exactly for production use.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-eve-v0-cheatsheet`](./skills/11ai-operator-vercel-eve-v0-cheatsheet/SKILL.md) | Quick commands and policy reminders |
| [`11ai-operator-vercel-eve-v0-environment`](./skills/11ai-operator-vercel-eve-v0-environment/SKILL.md) | Read-only local and remote context inspection |
| [`11ai-operator-vercel-eve-v0-setup`](./skills/11ai-operator-vercel-eve-v0-setup/SKILL.md) | Project-local setup with bounded remote effects |
| [`11ai-operator-vercel-eve-v0-integrations`](./skills/11ai-operator-vercel-eve-v0-integrations/SKILL.md) | Identity, runtime, persistence, observability, and deployment seams |
| [`11ai-operator-vercel-eve-v0-troubleshooting`](./skills/11ai-operator-vercel-eve-v0-troubleshooting/SKILL.md) | Evidence-led diagnosis with permission and cost controls |
| [`11ai-operator-vercel-eve-v0-definitions-tools`](./skills/11ai-operator-vercel-eve-v0-definitions-tools/SKILL.md) | Agent instructions, model configuration, skills, connections, and typed tools |
| [`11ai-operator-vercel-eve-v0-sessions-workflows`](./skills/11ai-operator-vercel-eve-v0-sessions-workflows/SKILL.md) | Durable sessions, streams, continuation tokens, checkpoints, and resume |
| [`11ai-operator-vercel-eve-v0-subagents-approvals`](./skills/11ai-operator-vercel-eve-v0-subagents-approvals/SKILL.md) | Delegation, isolation, permissions, human review, and durable decisions |
| [`11ai-operator-vercel-eve-v0-channels-schedules`](./skills/11ai-operator-vercel-eve-v0-channels-schedules/SKILL.md) | Slack or web channels, triggers, schedules, delivery, and autonomous runs |
| [`11ai-operator-vercel-eve-v0-evals-observability`](./skills/11ai-operator-vercel-eve-v0-evals-observability/SKILL.md) | Eval suites, CI gates, agent runs, traces, tokens, and regressions |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect versions, team and project scope, environment, resources, permissions, and policies before changing anything.

Never guess eve version, agent directory, model, provider, tool authority, channel, schedule, sandbox adapter, deployment project, or approval policy. Read exact identifiers from the repository, CLI, dashboard, or user.

Ask before initializing Git, starting an agent server, invoking paid models, executing tools, enabling schedules or channels, approving writes, deploying, or replaying sessions. Preview targets, counts, permissions, costs, recipients, and rollback.

Never print or commit model credentials, channel tokens, connector tokens, tool secrets, session content, approval payloads, or external records. Redact user and external-system data. Bound concurrency, retries, tool calls, runs, and bulk operations; verify in test scope before production.
