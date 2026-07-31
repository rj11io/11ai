---
name: 11ai-operator-vercel-ai-sdk-v7-generation
description: "Operate AI SDK text, image, video, speech, transcription, and realtime generation with explicit models, inputs, abort signals, usage accounting, stop conditions, and error handling. Use when adding a model call or controlling modality, latency, cost, streaming, and cancellation."
---
# 11ai Vercel AI SDK v7 generation

Every model call has cost, data disclosure, and nondeterminism Resolve the exact environment, external target, data boundary, cost or delivery impact, and acceptance check before acting.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect first

```bash
rg -n 'generateText|streamText|generateImage|generateVideo|generateSpeech|transcribe|useRealtime|model:|abortSignal|stopWhen' TARGET
npm test --if-present -- TARGET
```

Resolve modality, model, provider path, input data classification, expected output, size or token bounds, cancellation, media storage, and usage reporting.

Confirm before changing:

- Exact installed API and model ID.
- Maximum steps and output tokens.
- Abort and timeout propagation.
- Usage and finish-reason reporting.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Centralize model choice and bounded defaults, pass AbortSignal, handle partial streams and finish reasons, and record usage without content.

Never send private prompts, remove token or step bounds, or execute a live paid request without stating model and estimated scope Require explicit approval before that operation and preview target, count, cost, recipients, permissions, or rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test deterministic fixtures, abort, provider rejection, truncated output, stream disconnect, and usage accounting. Report environment, target, files, external actions, cost or delivery count, secret handling, checks, and rollback. Hand configuration failures to `11ai-operator-vercel-ai-sdk-v7-troubleshooting` and system seams to `11ai-operator-vercel-ai-sdk-v7-integrations`.
