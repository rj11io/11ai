---
name: 11ai-operator-reactjs-v19-integrations
description: "Connect React to styling, data sources, tests, browser and server runtimes, build tools, CI, observability, and deployment while preserving component and execution boundaries. Use when React crosses another subsystem or must behave consistently through production."
---
# 11ai React v19 integrations

Name both sides of the seam, the data and code crossing it, execution environment, serialization contract, and ownership before editing.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect the seams

```bash
node -p "require('react/package.json').version" 2>/dev/null
node -p "require('react-dom/package.json').version" 2>/dev/null
rg --files -g '*.{jsx,tsx,js,ts}' | head -100
rg -n "build|lint|test|deploy|instrument|hydrate|server|client" package.json .github . 2>/dev/null | head -100
```

Find existing adapters and providers before adding new ones. This plugin is standalone and does not reference another 11ai plugin.

## Wire deliberately

Read [references/integrations.md](references/integrations.md) for standalone build, test, runtime, and deployment patterns.

Change one seam, keep tokens, session data, private server values, serialized personal data, or full production props server-side, serialize only supported values, and preserve ownership of generated artifacts.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Run producer and consumer checks, production build, one runtime path, and one failure path. Inspect client output and hydration or routing behavior.

## Report

State systems connected, boundary, files and scripts, serialized contract, secret handling, checks, deployment impact, and rollback. Hand failures to `11ai-operator-reactjs-v19-troubleshooting`.
