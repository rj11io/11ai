---
name: 11ai-operator-vercel-chat-sdk-v4-environment
description: "Inspect Vercel Chat SDK package versions, runtime and framework context, configuration, environment variable names, adapters or providers, persistence, scripts, and safe local checks without changing anything. Use before Vercel Chat SDK work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel Chat SDK v4 environment

Resolve the exact project, package manager, installed version, runtime, external account or platform, and environment before interpreting behavior. Keep this pass read-only.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect packages and code

```bash
node -p "require('chat/package.json').version" 2>/dev/null
rg -n 'new Chat|create.*Adapter|onNewMention|onSubscribedMessage|chat/ai|@vercel/connect/chat|webhooks\.|create.*State' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List environment variable names only and redact values in logs. Require `chat` major 4 and compatible `@chat-adapter/*` majors; report mixed-major adapters or deprecated top-level AI imports before application behavior.

## Inspect checks

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Run only existing read-safe checks. Do not scaffold, install, send messages, invoke models, create resources, deploy, rotate credentials, or mutate remote state.

## Interpretation

- **Missing local dependency** — report it; do not use an unpinned global fallback.
- **Version drift** — use local types and bundled docs before current examples.
- **Environment mismatch** — confirm development, preview, and production independently.
- **Persistence missing** — in-memory state can fail across processes or cold starts.

## Report

State versions, runtime, framework, environment names, configured providers or adapters, persistence, safe scripts, and uncertainties. Report secrets as set or unset only. Hand absent setup to `11ai-operator-vercel-chat-sdk-v4-setup` and failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting`.
