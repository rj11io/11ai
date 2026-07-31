# 11ai Vercel Workflows v4 operator

Ten standalone skills for Workflow SDK 4 durable definitions, event-sourced runs, encrypted payloads, steps, retries, sleeps, events, approvals, versioning, observability, and reliable long-running execution.

Version baseline: workflow 4.6 stable; Workflow 5 beta behavior is out of scope.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-workflows-v4-cheatsheet`](./skills/11ai-operator-vercel-workflows-v4-cheatsheet/SKILL.md) | Quick commands and lifecycle reminders |
| [`11ai-operator-vercel-workflows-v4-environment`](./skills/11ai-operator-vercel-workflows-v4-environment/SKILL.md) | Read-only scope, resource, and policy inspection |
| [`11ai-operator-vercel-workflows-v4-setup`](./skills/11ai-operator-vercel-workflows-v4-setup/SKILL.md) | Project-local setup with bounded remote effects |
| [`11ai-operator-vercel-workflows-v4-integrations`](./skills/11ai-operator-vercel-workflows-v4-integrations/SKILL.md) | Identity, storage, events, observability, and deployment seams |
| [`11ai-operator-vercel-workflows-v4-troubleshooting`](./skills/11ai-operator-vercel-workflows-v4-troubleshooting/SKILL.md) | Evidence-led lifecycle and platform diagnosis |
| [`11ai-operator-vercel-workflows-v4-definitions-steps`](./skills/11ai-operator-vercel-workflows-v4-definitions-steps/SKILL.md) | Workflow directives, step boundaries, serialization, determinism, and results |
| [`11ai-operator-vercel-workflows-v4-durability-retries`](./skills/11ai-operator-vercel-workflows-v4-durability-retries/SKILL.md) | Checkpoints, retry policy, backoff, idempotency, recovery, and compensation |
| [`11ai-operator-vercel-workflows-v4-sleep-events`](./skills/11ai-operator-vercel-workflows-v4-sleep-events/SKILL.md) | Durable waits, timers, hooks, events, correlation, and timeout paths |
| [`11ai-operator-vercel-workflows-v4-human-approval`](./skills/11ai-operator-vercel-workflows-v4-human-approval/SKILL.md) | Approval requests, immutable payloads, identity, expiry, denial, and resume |
| [`11ai-operator-vercel-workflows-v4-versioning-observability`](./skills/11ai-operator-vercel-workflows-v4-versioning-observability/SKILL.md) | Atomic versions, run history, logs, traces, metrics, deployment, and rollback |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect versions, team and project, environment, resources or runs, state, permissions, limits, and observability before changing anything.

Never guess Workflow SDK version, runtime, workflow and step IDs, retry and timeout policy, event schema, deployment version, persistence, or cancellation semantics. Read exact identifiers and policies from code, CLI, dashboard, or the user.

Ask before starting, resuming, replaying, canceling, or terminating workflows; changing retry or timeout policy; emitting events; approving steps; or deploying new workflow versions. Preview resources, commands or steps, permissions, counts, usage, cleanup, and rollback.

Never print or commit workflow payloads, event tokens, connector credentials, approval data, logs containing personal data, or production environment values. Redact external data. Bound concurrency, retries, duration, storage, and bulk operations; verify in test scope before production.
