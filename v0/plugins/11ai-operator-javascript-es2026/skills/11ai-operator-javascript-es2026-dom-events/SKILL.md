---
name: 11ai-operator-javascript-es2026-dom-events
description: "Operate browser DOM queries, element creation, event listeners, delegation, custom events, observers, focus, and lifecycle cleanup. Use when adding browser interaction, fixing duplicate handlers or stale nodes, or integrating with native DOM behavior."
---
# 11ai JavaScript ES2026 DOM and events

DOM work must preserve semantics, focus, event ordering, and teardown Resolve the exact module, public contract, target browser, server, worker, or embedded JavaScript runtimes, and acceptance check before editing.

Version baseline: Target the stable ECMAScript 2026 edition. Prefer ES2026 APIs only after verifying native runtime support or an explicit transform and polyfill policy.

## Inspect first

```bash
rg -n 'querySelector|addEventListener|dispatchEvent|MutationObserver|IntersectionObserver|innerHTML' TARGET
npm test --if-present -- TARGET
```

Identify the actual document lifecycle, event phase, target/currentTarget use, listener ownership, and server-rendered markup.

Confirm before changing:

- Semantic element before scripted behavior.
- Stable delegation boundary.
- Listener and observer teardown.
- Trusted versus synthetic input.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Use scoped queries, event delegation where ownership is stable, and AbortSignal or explicit cleanup for listeners.

Never inject unsanitized HTML, suppress default keyboard behavior, or remove shared listeners without approval Require approval for a broader or destructive change and preview affected files, exports, callers, or runtime behavior.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test mouse, keyboard, focus, repeated mount/unmount, dynamic children, and malformed input. Report target, files, public behavior, compatibility or security impact, checks, and rollback. Hand configuration failures to `11ai-operator-javascript-es2026-troubleshooting` and seams to `11ai-operator-javascript-es2026-integrations`.
