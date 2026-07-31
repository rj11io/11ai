---
name: 11ai-operator-vercel-ai-sdk-v7-structured-output
description: "Generate and stream structured AI SDK outputs with explicit schemas, descriptions, validation, partial object handling, error recovery, and compatibility checks. Use when a model must return typed data, object generation fails validation, or a schema must evolve."
---
# 11ai Vercel AI SDK v7 structured output

A schema is a runtime contract with probabilistic output, not a guarantee from TypeScript alone Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect first

```bash
rg -n 'generateText|streamText|Output\.(object|array|choice|json)|Schema|z\.object|safeParse' TARGET
npm test --if-present -- TARGET
```

Inspect the AI SDK 7 output API, schema, downstream consumers, optionality, partial-output behavior, and invalid-output handling. Do not introduce the deprecated `generateObject` or `streamObject` APIs.

Confirm before changing:

- Runtime schema and useful descriptions.
- Bounded arrays and strings.
- Partial-stream consumer tolerance.
- No automatic action on unvalidated output.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Keep schemas small, validate final values again at action boundaries, and version persisted output when shapes change.

Never loosen schemas to any, auto-repair into privileged actions, or migrate stored output without approval Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test valid, invalid, truncated, extra-field, partial, and schema-version cases with mocked model output. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting` and system seams to `11ai-operator-vercel-ai-sdk-v7-integrations`.
