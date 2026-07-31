---
name: 11ai-operator-vercel-sandbox-v2-setup
description: "Install and configure Vercel Sandbox from zero with project-local packages, exact account and environment scope, server-only authentication, baseline limits and persistence, one minimal operation, and bounded verification. Use when a project has no Vercel Sandbox setup or the user explicitly asks to initialize it."
---
# 11ai Vercel Sandbox v2 setup

Resolve project root, package manager, team and project, environment, runtime, auth mode, billing owner, limits, retention, and intended operation before writing or creating remote state.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Gather first

Confirm exact resource or run name, region or runtime, network and file permissions, retry and timeout policy, and rollback. Never invent Vercel team and project, environment, runtime, sandbox ID, timeout, resource limits, network policy, exposed ports, file inputs, or cleanup policy.

## Install and configure

```bash
npm install @vercel/sandbox@^2.9.0
node -e "import('@vercel/sandbox').then(m => console.log(Object.keys(m)))"
npx vercel --version
```

Preview help and generated files. Ask before linking projects, pulling credentials, creating resources, starting runs, or deploying.

Read [references/setup.md](references/setup.md) for the standalone walkthrough and security boundaries.

## Verify narrowly

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Use local or test scope with one bounded operation. State duration, compute or storage use, external side effects, and cleanup before execution.

## Guardrails

Never print or commit VERCEL_OIDC_TOKEN, access tokens, uploaded private files, command environment values, logs containing data, or preview URLs. Ask before remote creation, execution, replay, cancellation, exposure, snapshots, policy changes, or deployment. Report versions, scopes, limits, resources, checks, usage, cleanup, and rollback.
