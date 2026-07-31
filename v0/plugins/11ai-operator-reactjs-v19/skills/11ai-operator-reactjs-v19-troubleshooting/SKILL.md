---
name: 11ai-operator-reactjs-v19-troubleshooting
description: "Diagnose React failures involving versions, rendering, state, hydration, routing, caching, async behavior, build output, tests, integrations, and performance without masking the original error. Use when React fails a check, behaves differently across environments, or renders unexpected output."
---
# 11ai React v19 troubleshooting

Separate facts from theories. Reproduce the smallest failing route or component and preserve the first error, stack, warning, request, target runtime, and production or development mode.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Evidence collection

```bash
node -p "require('react/package.json').version" 2>/dev/null
node -p "require('react-dom/package.json').version" 2>/dev/null
rg --files -g '*.{jsx,tsx,js,ts}' | head -100
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Redact tokens, session data, private server values, serialized personal data, or full production props, tokens, request bodies, and personal data. Inspect scripts before anything that can rewrite, deploy, update snapshots, or clear caches.

## Classify the failure

- **Render or hydration failure** — compare server output, client input, and boundary placement.
- **State or effect failure** — trace ownership, identity, dependencies, cleanup, and event ordering.
- **Route or data failure** — capture exact URL, cache policy, status, and execution runtime.
- **Build-only failure** — compare versions, flags, generated output, and environment variable names.
- **Performance regression** — profile the representative interaction before optimizing.

## Remediation discipline

State confidence and missing evidence. Make one bounded change, request approval for dependencies, public contracts, caches, or deployment state, then rerun the original path. Never suppress warnings, force client rendering, disable strict checks, or clear all caches blindly.

## Report

Report boundary, evidence, cause or uncertainty, fix, affected React component tree and client bundle, accessibility and compatibility impact, rollback, and verification. If the toolchain is unhealthy, hand off to `11ai-operator-reactjs-v19-environment`.
