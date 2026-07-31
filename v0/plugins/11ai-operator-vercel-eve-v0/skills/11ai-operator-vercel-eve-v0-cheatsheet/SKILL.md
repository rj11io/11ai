---
name: 11ai-operator-vercel-eve-v0-cheatsheet
description: "Look up Vercel eve commands, configuration, policy, and focused operations across definitions and tools, sessions and workflows, subagents and approvals, channels and schedules, evals and observability. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel eve v0 cheatsheet

Use installed package and CLI versions plus the official documentation for that release. This plugin is standalone and routes multi-step work only to sibling skills.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect

```bash
node -p "require('eve/package.json').version" 2>/dev/null
find agent -maxdepth 3 -type f 2>/dev/null | sort | head -160
npx eve --help 2>/dev/null | head -100
```

Confirm project, team or account, environment, runtime, configured resources, and local version. Never guess eve version, agent directory, model, provider, tool authority, channel, schedule, sandbox adapter, deployment project, or approval policy.

## Common commands

```bash
npm install eve@0.27.8
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Inspect help before running a command whose flags may change. Installation, model calls, resource creation, and deployment require explicit task scope.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-eve-v0-definitions-tools` | Agent instructions, model configuration, skills, connections, and typed tools |
| `11ai-operator-vercel-eve-v0-sessions-workflows` | Durable sessions, streams, continuation tokens, checkpoints, and resume |
| `11ai-operator-vercel-eve-v0-subagents-approvals` | Delegation, isolation, permissions, human review, and durable decisions |
| `11ai-operator-vercel-eve-v0-channels-schedules` | Slack or web channels, triggers, schedules, delivery, and autonomous runs |
| `11ai-operator-vercel-eve-v0-evals-observability` | Eval suites, CI gates, agent runs, traces, tokens, and regressions |

## Answer format

Lead with the smallest command or SDK pattern. State environment, account or project, external action, cost or access impact, verification, and approval gate.
