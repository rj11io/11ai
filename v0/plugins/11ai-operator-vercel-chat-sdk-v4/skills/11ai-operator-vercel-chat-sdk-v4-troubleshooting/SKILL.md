---
name: 11ai-operator-vercel-chat-sdk-v4-troubleshooting
description: "Diagnose Vercel Chat SDK failures involving versions, configuration, credentials, runtime boundaries, streaming or events, persistence, external APIs, rate limits, costs, deployments, and recovery without masking the original error. Use when Vercel Chat SDK fails, behaves differently across environments, or causes unexpected external effects."
---
# 11ai Vercel Chat SDK v4 troubleshooting

Separate facts from theories. Reproduce the smallest failing operation and preserve the exact error, status, request or event ID, timestamps, runtime, environment, and SDK version.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Evidence collection

```bash
node -p "require('chat/package.json').version" 2>/dev/null
rg -n 'new Chat|create.*Adapter|onNewMention|onSubscribedMessage|webhooks\.|create.*State' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Redact bot tokens, signing secrets, app passwords, webhook secrets, connector credentials, message content, or personal data, user content, model prompts, message bodies, and personal data. Do not repeat a live request until its cost and side effects are known.

## Classify the failure

- **Package or type mismatch** — compare local version, imports, and generated types.
- **Credential or scope failure** — confirm environment and variable names without printing values.
- **Streaming or event failure** — locate the producer, transport, parser, and consumer boundary.
- **Persistence or concurrency failure** — inspect IDs, locks, retries, deduplication, and cold-start behavior.
- **External service failure** — preserve status, retry guidance, usage, and provider evidence.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for credentials, budgets, external actions, remote resources, persistence, or deployment, then rerun the original check. Never disable verification, remove limits, add unbounded retries, or switch production providers speculatively.

## Report

Report boundary, evidence, cause or uncertainty, fix, cost and external impact, data exposure, rollback, and verification. If local setup is unhealthy, hand off to `11ai-operator-vercel-chat-sdk-v4-environment`.
