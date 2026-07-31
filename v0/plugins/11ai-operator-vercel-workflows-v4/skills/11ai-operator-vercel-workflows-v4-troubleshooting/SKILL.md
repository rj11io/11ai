---
name: 11ai-operator-vercel-workflows-v4-troubleshooting
description: "Diagnose Vercel Workflows failures involving versions, scope, authentication, resource or run state, persistence, retries, timeouts, isolation, networking, observability, usage, and deployment without masking the original error. Use when Vercel Workflows fails, stalls, resumes incorrectly, or causes unexpected remote effects."
---
# 11ai Vercel Workflows v4 troubleshooting

Separate facts from theories. Preserve exact error, status, resource or run ID, timestamps, version, environment, and original operation classification.

Version baseline: Target workflow 4.6 stable. Do not copy Workflow 5 beta APIs; use v4 directives, event-sourced runs, end-to-end encryption, custom serialization, framework plugins, and current observability.

## Evidence collection

```bash
node -p "require('workflow/package.json').version" 2>/dev/null
rg -n 'use workflow|use step|sleep|workflow|retry|hook|event' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -160
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Redact workflow payloads, event tokens, connector credentials, approval data, logs containing personal data, or production environment values, file content, workflow payloads, command output containing data, and personal information. Do not repeat an operation until idempotency and cost are known.

## Classify the failure

- **Scope or auth failure** — confirm team, project, environment, issuer, and resource ID.
- **Lifecycle failure** — inspect state transitions, owner, timeout, and cleanup.
- **Persistence or retry failure** — inspect checkpoints, idempotency, attempts, and version.
- **Isolation or network failure** — inspect explicit permissions and denied boundary.
- **Platform failure** — preserve status, usage, logs, and regional evidence.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for remote state, retries, limits, exposure, cancellation, or deployment, then rerun the original check. Never remove isolation, make retries unbounded, or replay non-idempotent work.

## Report

Report boundary, evidence, cause or uncertainty, fix, remote and usage impact, data exposure, cleanup, rollback, and verification. If local context is unhealthy, hand off to `11ai-operator-vercel-workflows-v4-environment`.
