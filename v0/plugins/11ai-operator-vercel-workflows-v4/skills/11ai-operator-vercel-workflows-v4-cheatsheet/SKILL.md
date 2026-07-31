---
name: 11ai-operator-vercel-workflows-v4-cheatsheet
description: "Look up Vercel Workflows commands, configuration, lifecycle controls, and focused operations across definitions and steps, durability and retries, sleep and events, human approval, versioning and observability. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel Workflows v4 cheatsheet

Use the installed package, CLI help, and official documentation for that version. This standalone plugin routes multi-step work only to sibling skills.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Inspect

```bash
node -p "require('workflow/package.json').version" 2>/dev/null
rg -n 'use workflow|use step|sleep|workflow|retry|hook|event' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -160
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

Confirm version, project and environment, runtime, resource or run IDs, persistence, limits, and credentials by name. Never guess Workflow SDK version, runtime, workflow and step IDs, retry and timeout policy, event schema, deployment version, persistence, or cancellation semantics.

## Common commands

```bash
npm install workflow@^4.6.0
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Installation and any live SDK call can change state or incur usage. Inspect code and help before execution.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-workflows-v4-definitions-steps` | Workflow directives, step boundaries, serialization, determinism, and results |
| `11ai-operator-vercel-workflows-v4-durability-retries` | Checkpoints, retry policy, backoff, idempotency, recovery, and compensation |
| `11ai-operator-vercel-workflows-v4-sleep-events` | Durable waits, timers, hooks, events, correlation, and timeout paths |
| `11ai-operator-vercel-workflows-v4-human-approval` | Approval requests, immutable payloads, identity, expiry, denial, and resume |
| `11ai-operator-vercel-workflows-v4-versioning-observability` | Atomic versions, run history, logs, traces, metrics, deployment, and rollback |

## Answer format

Lead with the smallest command or SDK pattern. State target, isolation or durability boundary, remote effect, limits, verification, and approval requirement.
