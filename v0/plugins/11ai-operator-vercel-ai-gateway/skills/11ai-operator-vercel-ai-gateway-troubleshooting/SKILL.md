---
name: 11ai-operator-vercel-ai-gateway-troubleshooting
description: "Diagnose Vercel AI Gateway failures involving versions, account scope, credentials, permissions, configuration, remote resources, durability, providers, observability, costs, and deployment without masking the original error. Use when Vercel AI Gateway fails, behaves differently across environments, or causes unexpected remote effects."
---
# 11ai Vercel AI Gateway troubleshooting

Separate facts from theories. Preserve exact error, status, operation or run ID, timestamp, project, team, environment, version, and original input classification.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Evidence collection

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel ai-gateway --help 2>/dev/null | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Redact AI_GATEWAY_API_KEY, provider BYOK credentials, Vercel access and OIDC tokens, prompts, outputs, user tags, or reporting exports, prompts, tool inputs, external records, and personal data. Do not repeat a paid or state-changing operation until its cost and idempotency are known.

## Classify the failure

- **Scope failure** — confirm team, project, environment, and resource ID.
- **Version or schema failure** — compare local package, CLI, types, and deployed code.
- **Credential or permission failure** — confirm issuer and scopes without printing tokens.
- **Durability or concurrency failure** — inspect run IDs, checkpoints, locks, retries, and version.
- **Provider or platform failure** — preserve status, routing, usage, and observability evidence.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for credentials, policies, budgets, remote state, runs, or deployments, then rerun the original check. Never disable verification, increase limits blindly, or replay non-idempotent work.

## Report

Report boundary, evidence, cause or uncertainty, fix, remote and cost impact, data exposure, rollback, and verification. If local context is unhealthy, hand off to `11ai-operator-vercel-ai-gateway-environment`.
