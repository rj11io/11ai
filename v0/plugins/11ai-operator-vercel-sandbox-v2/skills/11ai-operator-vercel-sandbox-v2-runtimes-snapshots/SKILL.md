---
name: 11ai-operator-vercel-sandbox-v2-runtimes-snapshots
description: "Configure Vercel Sandbox runtimes, dependency installation, environment images, snapshots, restore, reproducibility, and safe reuse boundaries. Use when choosing Node or Python runtime, speeding startup, capturing a prepared environment, or restoring consistent sandboxes."
---
# 11ai Vercel Sandbox v2 runtimes and snapshots

Runtime and snapshot choice fixes executable code, packages, files, and potentially sensitive residue Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect first

```bash
rg -n 'runtime:|node24|node22|python3\.13|snapshot|image:|vcr\.vercel\.com|install' TARGET
npm test --if-present -- TARGET
```

Resolve the v2 runtime (`node24`, `node22`, or `python3.13`), VCR image or snapshot, pinned dependencies, architecture, contents, owner, retention, and trust classification.

Confirm before changing:

- Exact runtime from application needs.
- Pinned reproducible dependencies.
- No credentials or user data in snapshots.
- Versioned snapshot provenance.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Build from reviewed inputs, verify checksums or lockfiles, and treat snapshots as immutable versioned artifacts.

Never create, replace, share, restore, or delete snapshots containing unknown files or secrets without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Restore into test scope, verify runtime and dependency versions, absence of secrets, expected files, and deterministic command output. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-sandbox-v2-troubleshooting` and seams to `11ai-operator-vercel-sandbox-v2-integrations`.
