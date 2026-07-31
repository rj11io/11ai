---
name: 11ai-operator-vercel-core-security
description: "Operate Vercel platform security including firewall rules, WAF, bot management, security headers, deployment protection, secure compute boundaries, roles, audit, and incident safeguards. Use when hardening a project, changing traffic security, reviewing access, or responding to abuse and incidents."
---
# 11ai Vercel Core security

Platform security changes can block legitimate users or expose every deployment Resolve exact team, project, environment, deployment or domain, affected users, remote impact, and acceptance check before acting.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect first

```bash
npx vercel project ls 2>/dev/null | head -100
rg -n 'Content-Security-Policy|Strict-Transport-Security|X-Frame-Options|firewall|waf|bot|protection' . --glob '*.{json,js,ts,md}' | head -140
```

Resolve team, project, environment, current policy, rule order, traffic baseline, administrator, exception process, and rollback.

Confirm before changing:

- Least-privilege team and project roles.
- Exact match conditions and precedence.
- Observed bot and attack traffic.
- Security headers compatible with application behavior.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Stage narrow rules in preview or monitoring mode when supported, document exceptions, and preserve audit evidence.

Never enable, disable, reorder, or bulk-edit firewall, WAF, bot, access, or protection policy without explicit approval and impact preview Require explicit approval and preview exact resources, traffic, users, costs, remote effects, and rollback.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test allowed, blocked, false-positive, bypass-resistant, and rollback paths with representative traffic and audit records. Report team, project, environment, resource IDs, settings, remote actions, user and cost impact, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting` and seams to `11ai-operator-vercel-core-integrations`.
