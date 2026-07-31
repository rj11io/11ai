---
name: 11ai-operator-reactjs-v19-forms-actions
description: "Build React forms and actions with native semantics, controlled or uncontrolled inputs, validation, async submission, pending state, optimistic updates, and server error recovery. Use when creating a form, fixing field state, adding async actions, or handling validation and optimistic updates."
---
# 11ai React v19 forms and actions

Form field names and action payloads are contracts with the receiving boundary Resolve the exact route or component, execution boundary, public contract, target supported browser and server rendering environments, and acceptance check first.

Version baseline: Target React 19.2 within major 19, including Actions, Activity, useEffectEvent, cacheSignal, performance tracks, and current SSR streaming behavior. Avoid React 18 patterns where React 19 has a direct replacement.

## Inspect first

```bash
rg -n '<form|useActionState|useOptimistic|onSubmit|value=|defaultValue=|FormData' TARGET
npm test --if-present -- TARGET
```

Map field names, labels, initial values, validation, submission destination, pending behavior, and rollback before editing.

Confirm before changing:

- Stable field and payload contract.
- Accessible labels and errors.
- One controlledness model per field.
- Idempotent submission and retry.

## Operate

```bash
npm test --if-present -- TARGET
npm run build --if-present
```

Keep native form behavior, disable duplicate submission deliberately, preserve user input on recoverable failure, and reconcile optimistic state.

Never change submitted names, erase input on failure, trust client validation alone, or make optimistic destructive changes without rollback Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test keyboard submit, invalid and server-error cases, rapid duplicate input, pending UI, retry, and successful reset. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-reactjs-v19-troubleshooting` and seams to `11ai-operator-reactjs-v19-integrations`.
