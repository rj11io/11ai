---
name: 11ai-operator-vercel-core-content-delivery
description: "Operate Vercel content delivery including domains, DNS, TLS, CDN caching, cache-control headers, redirects, rewrites, compression, static assets, and targeted invalidation. Use when adding a domain, fixing TLS or caching, changing redirects, or diagnosing stale and regional delivery."
---
# 11ai Vercel Core content delivery

Domains and cache policy are public routing contracts with potentially global blast radius Resolve exact team, project, environment, deployment or domain, affected users, remote impact, and acceptance check before acting.

Version baseline: Use current Vercel platform and CLI documentation as of July 2026. The platform has no single major version, so confirm availability, plan limits, and rollout status for every feature.

## Inspect first

```bash
npx vercel domains ls 2>/dev/null | head -100
rg -n 'headers|redirects|rewrites|Cache-Control|CDN-Cache-Control|s-maxage|domain' vercel.json next.config.* . 2>/dev/null | head -160
```

Resolve exact team, project, domain, DNS authority, certificate state, redirect graph, cache key and lifetime, and invalidation target.

Confirm before changing:

- Authoritative DNS and ownership.
- TLS issuance and renewal state.
- Cache privacy and vary inputs.
- Redirect loops and permanent-status impact.

## Operate

```bash
npx vercel domains --help
npm run build --if-present
```

Change one hostname or route, use explicit cache semantics, and prefer targeted revalidation or versioned assets over global purge.

Never add, remove, transfer, or verify domains; change DNS; issue broad permanent redirects; or purge global caches without approval Require explicit approval and preview exact resources, traffic, users, costs, remote effects, and rollback.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Check DNS and TLS, direct and redirected URLs, cache hit and age headers, private-data separation, multiple regions, and rollback. Report team, project, environment, resource IDs, settings, remote actions, user and cost impact, checks, observability, and rollback. Hand failures to `11ai-operator-vercel-core-troubleshooting` and seams to `11ai-operator-vercel-core-integrations`.
