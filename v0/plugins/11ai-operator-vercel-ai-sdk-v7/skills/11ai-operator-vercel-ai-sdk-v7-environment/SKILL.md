---
name: 11ai-operator-vercel-ai-sdk-v7-environment
description: "Inspect Vercel AI SDK package versions, runtime and framework context, configuration, environment variable names, adapters or providers, persistence, scripts, and safe local checks without changing anything. Use before Vercel AI SDK work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel AI SDK v7 environment

Resolve the exact project, package manager, installed version, runtime, external account or platform, and environment before interpreting behavior. Keep this pass read-only.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect packages and code

```bash
node -p "require('ai/package.json').version" 2>/dev/null
rg -n 'generateText|streamText|Output\.|ToolLoopAgent|WorkflowAgent|useRealtime|generateVideo|useChat|providerOptions' . --glob '*.{ts,tsx,js,jsx}' --glob '!node_modules' | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

List environment variable names only and redact values in logs. Require `ai` major 7 and compatible `@ai-sdk/*` package majors before applying v7 APIs; report mixed-major dependency graphs as the first failure boundary.

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

State versions, runtime, framework, environment names, configured providers or adapters, persistence, safe scripts, and uncertainties. Report secrets as set or unset only. Hand absent setup to `11ai-operator-vercel-ai-sdk-v7-setup` and failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting`.
