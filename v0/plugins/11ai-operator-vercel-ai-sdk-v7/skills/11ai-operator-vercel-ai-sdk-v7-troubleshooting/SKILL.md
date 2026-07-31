---
name: 11ai-operator-vercel-ai-sdk-v7-troubleshooting
description: "Diagnose Vercel AI SDK failures involving versions, configuration, credentials, runtime boundaries, streaming or events, persistence, external APIs, rate limits, costs, deployments, and recovery without masking the original error. Use when Vercel AI SDK fails, behaves differently across environments, or causes unexpected external effects."
---
# 11ai Vercel AI SDK v7 troubleshooting

Separate facts from theories. Reproduce the smallest failing operation and preserve the exact error, status, request or event ID, timestamps, runtime, environment, and SDK version.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Evidence collection

```bash
node -p "require('ai/package.json').version" 2>/dev/null
rg -n 'generateText|streamText|Output\.|ToolLoopAgent|WorkflowAgent|useRealtime|generateVideo|useChat|providerOptions' . --glob '*.{ts,tsx,js,jsx}' --glob '!node_modules' | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Redact provider API keys, AI Gateway keys, OIDC tokens, prompts containing private data, tool credentials, or raw telemetry payloads, user content, model prompts, message bodies, and personal data. Do not repeat a live request until its cost and side effects are known.

## Classify the failure

- **Package or type mismatch** — compare local version, imports, and generated types.
- **Credential or scope failure** — confirm environment and variable names without printing values.
- **Streaming or event failure** — locate the producer, transport, parser, and consumer boundary.
- **Persistence or concurrency failure** — inspect IDs, locks, retries, deduplication, and cold-start behavior.
- **External service failure** — preserve status, retry guidance, usage, and provider evidence.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for credentials, budgets, external actions, remote resources, persistence, or deployment, then rerun the original check. Never disable verification, remove limits, add unbounded retries, or switch production providers speculatively.

## Report

Report boundary, evidence, cause or uncertainty, fix, cost and external impact, data exposure, rollback, and verification. If local setup is unhealthy, hand off to `11ai-operator-vercel-ai-sdk-v7-environment`.
