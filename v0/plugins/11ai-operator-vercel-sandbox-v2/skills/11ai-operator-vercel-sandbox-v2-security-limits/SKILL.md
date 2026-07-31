---
name: 11ai-operator-vercel-sandbox-v2-security-limits
description: "Harden Vercel Sandbox use with threat modeling, process and filesystem isolation, sudo controls, compute and storage limits, timeouts, abuse prevention, audit logs, and incident cleanup. Use when running untrusted code, reviewing sandbox safety, setting resource controls, or responding to suspicious execution."
---
# 11ai Vercel Sandbox v2 security and limits

A sandbox is a containment layer, not permission to ignore least privilege, data minimization, and usage limits Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect first

```bash
rg -n 'sudo|createUser|createGroup|asUser|sharedDir|timeout|memory|cpu|network|limit|allowlist|audit|VERCEL_OIDC_TOKEN' TARGET
npm test --if-present -- TARGET
```

Identify attacker-controlled inputs, v2 users and groups, home-directory isolation, shared directories, host and external assets, credentials, allowed commands, resource bounds, telemetry, and response owner.

Confirm before changing:

- No production credentials in the guest.
- Explicit CPU, memory, disk, duration, and output bounds.
- Network and file allowlists.
- Audit IDs without sensitive content.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Minimize guest authority, isolate each untrusted job, enforce quotas before creation, and terminate on policy violation.

Never weaken isolation, grant sudo for convenience, raise limits, retain suspicious snapshots, or suppress audit evidence without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Run adversarial tests for path escape, fork or output bombs, network denial, secret access, timeout, and cleanup. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-sandbox-v2-troubleshooting` and seams to `11ai-operator-vercel-sandbox-v2-integrations`.
