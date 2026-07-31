---
name: 11ai-operator-vercel-sandbox-v2-networking-exposure
description: "Operate Vercel Sandbox networking including outbound requests, DNS, development servers, port exposure, live preview URLs, request proxying, and network restrictions. Use when a sandbox needs network access, must run a server, expose a preview, or cannot reach a dependency."
---
# 11ai Vercel Sandbox v2 networking and exposure

Network access turns isolated code into an actor that can reach services or expose content publicly Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect first

```bash
rg -n 'port|expose|network|fetch\(|curl|listen\(|hostname|preview' TARGET
npm test --if-present -- TARGET
```

Resolve allowed destinations, credentials, egress data, server bind address, port, exposure lifetime, authentication, and audience.

Confirm before changing:

- Destination allowlist and SSRF defense.
- No credential forwarding to untrusted code.
- Exact exposed port and process.
- Private versus public preview access.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Deny network by default when possible, proxy allowlisted operations, bind intentionally, and tear down exposure with the sandbox.

Never grant unrestricted egress, expose a port, publish a URL, or access internal metadata or private services without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test allowed and denied destinations, redirect handling, DNS rebinding defenses, port closure, auth, timeout, and data egress. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-sandbox-v2-troubleshooting` and seams to `11ai-operator-vercel-sandbox-v2-integrations`.
