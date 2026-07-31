---
name: 11ai-operator-vercel-sandbox-v2-cheatsheet
description: "Look up Vercel Sandbox commands, configuration, lifecycle controls, and focused operations across lifecycle, commands and files, runtimes and snapshots, networking and exposure, security and limits. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel Sandbox v2 cheatsheet

Use the installed package, CLI help, and official documentation for that version. This standalone plugin routes multi-step work only to sibling skills.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect

```bash
node -p "require('@vercel/sandbox/package.json').version" 2>/dev/null
rg -n 'Sandbox\.|@vercel/sandbox|VERCEL_OIDC_TOKEN|timeout|runtime|snapshot' . --glob '*.{ts,tsx,js}' --glob '!node_modules' | head -140
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//'
```

Confirm version, project and environment, runtime, resource or run IDs, persistence, limits, and credentials by name. Never guess Vercel team and project, environment, runtime, sandbox ID, timeout, resource limits, network policy, exposed ports, file inputs, or cleanup policy.

## Common commands

```bash
npm install @vercel/sandbox@^2.9.0
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Installation and any live SDK call can change state or incur usage. Inspect code and help before execution.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-sandbox-v2-lifecycle` | Create, inspect, connect, extend, stop, timeout, and cleanup sandboxes |
| `11ai-operator-vercel-sandbox-v2-commands-files` | Run commands, stream output, upload, download, edit, and preserve paths |
| `11ai-operator-vercel-sandbox-v2-runtimes-snapshots` | Runtime choice, dependencies, images, snapshots, reproducibility, and reuse |
| `11ai-operator-vercel-sandbox-v2-networking-exposure` | Outbound access, ports, dev servers, URLs, and request boundaries |
| `11ai-operator-vercel-sandbox-v2-security-limits` | Threat model, isolation, sudo, resources, timeouts, abuse, and audit |

## Answer format

Lead with the smallest command or SDK pattern. State target, isolation or durability boundary, remote effect, limits, verification, and approval requirement.
