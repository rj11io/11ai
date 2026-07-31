---
name: 11ai-operator-vercel-sandbox-v2-environment
description: "Inspect Vercel Sandbox package and CLI versions, project and account context, configuration, environment variable names, resources or runs, persistence, limits, and safe checks without changing anything. Use before Vercel Sandbox work, when the target is uncertain, or when the user asks what is configured."
---
# 11ai Vercel Sandbox v2 environment

Resolve exact project, team, environment, installed version, runtime, and resource or run scope. Keep this pass read-only.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect local context

```bash
node -p "require('@vercel/sandbox/package.json').version" 2>/dev/null
rg -n 'Sandbox\.|@vercel/sandbox|VERCEL_OIDC_TOKEN|timeout|runtime|snapshot' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

List environment variable names only. Require `@vercel/sandbox` major 2 and record the exact SDK and CLI versions; another major may have different lifecycle and persistence semantics.

## Inspect safe checks

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Do not create, start, resume, replay, cancel, stop, snapshot, expose, delete, deploy, or modify remote resources during inspection.

## Interpretation

- **Wrong scope** — distinguish local, preview, production, team, project, resource, and run.
- **Version drift** — use local types and help before examples.
- **Credential mismatch** — confirm mode and variable names without values.
- **Missing persistence or limits** — report the risk; do not invent a backend or quota.

## Report

State versions, scope, resources or runs, runtime, auth mode, persistence, limits, observability, and ambiguities. Hand missing setup to `11ai-operator-vercel-sandbox-v2-setup` and failures to `11ai-operator-vercel-sandbox-v2-troubleshooting`.
