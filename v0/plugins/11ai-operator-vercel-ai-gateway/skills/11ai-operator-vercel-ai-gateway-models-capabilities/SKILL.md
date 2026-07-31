---
name: 11ai-operator-vercel-ai-gateway-models-capabilities
description: "Discover and select AI Gateway models and providers by canonical model ID, capability, modality, context window, pricing, region, and API compatibility. Use when choosing or changing a model, checking capability support, or building a model catalog."
---
# 11ai Vercel AI Gateway models and capabilities

A model string chooses capability, provider options, price, and data terms Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Use current generally available AI Gateway behavior as of July 2026, including AI SDK 7, multimodal and realtime models, routing, budgets, BYOK, regional inference, and data-retention controls.

## Inspect first

```bash
rg -n 'model:|creator/model|ai-gateway.vercel.sh|/v1/models' TARGET
npx vercel ai-gateway --help 2>/dev/null | head -100
```

Resolve exact current model metadata from the public catalog or models endpoint and compare application requirements, including text, image, video, embeddings, speech, transcription, or realtime voice capability.

Confirm before changing:

- Canonical creator/model identifier.
- Required modality and tool or schema support.
- Context and output bounds.
- Current pricing and provider availability.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Centralize approved model aliases, validate capabilities before requests, and record catalog retrieval time without hardcoding transient availability.

Never switch production models or make benchmark calls without approval, budget, and behavior review Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test one bounded request or mock for each required capability and confirm usage metadata and unsupported-feature handling. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-gateway-troubleshooting` and seams to `11ai-operator-vercel-ai-gateway-integrations`.
