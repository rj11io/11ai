---
name: 11ai-operator-vercel-ai-sdk-v7-integrations
description: "Connect Vercel AI SDK to application runtimes, persistence, authentication, observability, CI, deployment, and adjacent external services while preserving credential, data, and action boundaries. Use when Vercel AI SDK must cross another system or operate consistently from local development through production."
---
# 11ai Vercel AI SDK v7 integrations

Name both systems, data and actions crossing the seam, trust boundary, persistence owner, credential source, and production target before editing.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect the seams

```bash
node -p "require('ai/package.json').version" 2>/dev/null
rg -n 'generateText|streamText|Output\.|ToolLoopAgent|WorkflowAgent|useRealtime|generateVideo|useChat|providerOptions' . --glob '*.{ts,tsx,js,jsx}' --glob '!node_modules' | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
rg -n "webhook|route|database|redis|telemetry|deploy|workflow|sandbox" . --glob '!node_modules' | head -100
```

Find existing adapters and middleware before adding another. Keep this plugin standalone and document external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone runtime, persistence, auth, observability, testing, and deployment patterns.

Change one seam. Keep provider API keys, AI Gateway keys, OIDC tokens, prompts containing private data, tool credentials, or raw telemetry payloads server-side, validate untrusted inputs, minimize retained content, and make externally visible actions explicit.

## Verify end to end

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test a bounded success, rejection, timeout, duplicate, and recovery path. Use test targets or mocks unless the user approves a real external call.

## Report

State systems, trust and persistence boundaries, credentials by name, externally visible actions, data retention, budget or rate limits, files, checks, and rollback. Hand failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting`.
