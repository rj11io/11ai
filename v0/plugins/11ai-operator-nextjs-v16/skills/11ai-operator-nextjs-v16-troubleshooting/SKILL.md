---
name: 11ai-operator-nextjs-v16-troubleshooting
description: "Diagnose Next.js failures involving versions, rendering, state, hydration, routing, caching, async behavior, build output, tests, integrations, and performance without masking the original error. Use when Next.js fails a check, behaves differently across environments, or renders unexpected output."
---
# 11ai Next.js v16 troubleshooting

Separate facts from theories. Reproduce the smallest failing route or component and preserve the first error, stack, warning, request, target runtime, and production or development mode.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Evidence collection

```bash
npx next info
rg --files app pages src/app src/pages 2>/dev/null | head -120
rg -n 'use client|use server|use cache|generateStaticParams|revalidate|runtime' app src/app 2>/dev/null | head -120
npm run lint --if-present
npm test --if-present
npm run build
```

Redact server environment values, cookies, tokens, request bodies, signed URLs, or serialized private data, tokens, request bodies, and personal data. Inspect scripts before anything that can rewrite, deploy, update snapshots, or clear caches.

## Classify the failure

- **Render or hydration failure** — compare server output, client input, and boundary placement.
- **State or effect failure** — trace ownership, identity, dependencies, cleanup, and event ordering.
- **Route or data failure** — capture exact URL, cache policy, status, and execution runtime.
- **Build-only failure** — compare versions, flags, generated output, and environment variable names.
- **Performance regression** — profile the representative interaction before optimizing.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for dependencies, public contracts, caches, or deployment state, then rerun the original path. Never suppress warnings, force client rendering, disable strict checks, or clear all caches blindly.

## Report

Report boundary, evidence, cause or uncertainty, fix, affected Next.js route, server output, and client bundle, accessibility and compatibility impact, rollback, and verification. If the toolchain is unhealthy, hand off to `11ai-operator-nextjs-v16-environment`.
