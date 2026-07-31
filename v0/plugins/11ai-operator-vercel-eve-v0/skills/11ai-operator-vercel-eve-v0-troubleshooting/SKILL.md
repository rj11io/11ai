---
name: 11ai-operator-vercel-eve-v0-troubleshooting
description: "Diagnose Vercel eve failures involving versions, account scope, credentials, permissions, configuration, remote resources, durability, providers, observability, costs, and deployment without masking the original error. Use when Vercel eve fails, behaves differently across environments, or causes unexpected remote effects."
---
# 11ai Vercel eve v0 troubleshooting

Separate facts from theories. Preserve exact error, status, operation or run ID, timestamp, project, team, environment, version, and original input classification.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Evidence collection

```bash
node -p "require('eve/package.json').version" 2>/dev/null
find agent -maxdepth 3 -type f 2>/dev/null | sort | head -160
npx eve --help 2>/dev/null | head -100
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Redact model credentials, channel tokens, connector tokens, tool secrets, session content, approval payloads, or external records, prompts, tool inputs, external records, and personal data. Do not repeat a paid or state-changing operation until its cost and idempotency are known.

## Classify the failure

- **Scope failure** — confirm team, project, environment, and resource ID.
- **Version or schema failure** — compare local package, CLI, types, and deployed code.
- **Credential or permission failure** — confirm issuer and scopes without printing tokens.
- **Durability or concurrency failure** — inspect run IDs, checkpoints, locks, retries, and version.
- **Provider or platform failure** — preserve status, routing, usage, and observability evidence.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for credentials, policies, budgets, remote state, runs, or deployments, then rerun the original check. Never disable verification, increase limits blindly, or replay non-idempotent work.

## Report

Report boundary, evidence, cause or uncertainty, fix, remote and cost impact, data exposure, rollback, and verification. If local context is unhealthy, hand off to `11ai-operator-vercel-eve-v0-environment`.
