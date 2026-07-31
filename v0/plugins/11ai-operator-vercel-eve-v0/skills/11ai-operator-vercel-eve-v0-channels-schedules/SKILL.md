---
name: 11ai-operator-vercel-eve-v0-channels-schedules
description: "Configure eve channels and schedules with platform triggers, cron definitions, identities, delivery targets, autonomous-run bounds, timezone handling, and failure recovery. Use when putting an agent in chat, adding scheduled work, changing triggers, or diagnosing duplicate and missed autonomous runs."
---
# 11ai Vercel eve v0 channels and schedules

Channels reach real people and schedules run without a person present Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect first

```bash
find agent/channels agent/schedules -maxdepth 2 -type f 2>/dev/null | sort
rg -n 'cron:|channel|schedule|slack|discord|github' agent 2>/dev/null
```

Resolve exact workspace or surface, bot identity, recipients, trigger rules, cron timezone, concurrency, cost budget, and deduplication.

Confirm before changing:

- Test versus production channel.
- Explicit timezone and schedule owner.
- Idempotent autonomous work.
- Recipient and notification scope.

## Operate

```bash
npm test --if-present
npm run typecheck --if-present
```

Keep handlers narrow, schedules bounded, and every outbound action attributable to a run and user or policy.

Never enable, alter, or delete live schedules; install channels; or send messages without explicit approval and target confirmation Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Use a test channel or simulated clock to test trigger, duplicate, missed run, timezone edge, delivery failure, and disable path. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-eve-v0-troubleshooting` and seams to `11ai-operator-vercel-eve-v0-integrations`.
