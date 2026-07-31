---
name: 11ai-operator-vercel-core-integrations
description: "Connect Vercel Core Platform to Git providers, build systems, DNS, identity, data services, observability destinations, CI checks, and incident processes while preserving account and environment boundaries. Use when the platform must cross another system or support an end-to-end delivery flow."
---
# 11ai Vercel Core integrations

Name both systems, team and project, environment, credential and trust boundaries, data or artifact, remote actions, and owner before editing.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect seams

```bash
npx vercel --version
npx vercel whoami 2>/dev/null
npx vercel project ls 2>/dev/null | head -100
npx vercel env ls 2>/dev/null | head -100
rg -n 'vercel|deploy|domain|otel|log drain|environment' .github package.json vercel.json . 2>/dev/null | head -160
```

Find existing integrations before adding another. This standalone plugin records external contracts locally.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for Git, CI, DNS, data, identity, observability, and incident patterns.

Change one seam, use least privilege, separate environments, keep secrets server-side, and make deployment and rollback auditable.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test local build, preview-only integration path, denied or failure behavior, source-to-deployment correlation, and rollback without promoting production.

## Report

State systems, team and project, environments, credentials by name, artifact and data boundaries, remote actions, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting`.
