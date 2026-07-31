---
name: 11ai-operator-vercel-chat-sdk-v4-integrations
description: "Connect Vercel Chat SDK to application runtimes, persistence, authentication, observability, CI, deployment, and adjacent external services while preserving credential, data, and action boundaries. Use when Vercel Chat SDK must cross another system or operate consistently from local development through production."
---
# 11ai Vercel Chat SDK v4 integrations

Name both systems, data and actions crossing the seam, trust boundary, persistence owner, credential source, and production target before editing.

Version baseline: Target Chat SDK 4, currently the 4.35 release line. Use chat/ai for AI utilities, current adapters, Vercel Connect helpers, distributed state, webhook deduplication, and current platform capability checks.

## Inspect the seams

```bash
node -p "require('chat/package.json').version" 2>/dev/null
rg -n 'new Chat|create.*Adapter|onNewMention|onSubscribedMessage|chat/ai|@vercel/connect/chat|webhooks\.|create.*State' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
rg -n "webhook|route|database|redis|telemetry|deploy|workflow|sandbox" . --glob '!node_modules' | head -100
```

Find existing adapters and middleware before adding another. Keep this plugin standalone and document external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone runtime, persistence, auth, observability, testing, and deployment patterns.

Change one seam. Keep bot tokens, signing secrets, app passwords, webhook secrets, connector credentials, message content, or personal data server-side, validate untrusted inputs, minimize retained content, and make externally visible actions explicit.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test a bounded success, rejection, timeout, duplicate, and recovery path. Use test targets or mocks unless the user approves a real external call.

## Report

State systems, trust and persistence boundaries, credentials by name, externally visible actions, data retention, budget or rate limits, files, checks, and rollback. Hand failures to `11ai-operator-vercel-chat-sdk-v4-troubleshooting`.
