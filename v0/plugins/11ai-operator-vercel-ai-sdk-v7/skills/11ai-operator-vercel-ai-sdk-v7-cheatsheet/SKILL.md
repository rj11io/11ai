---
name: 11ai-operator-vercel-ai-sdk-v7-cheatsheet
description: "Look up Vercel AI SDK installation, inspection, core calls, operational limits, and focused patterns across generation, streaming ui, structured output, tools and agents, providers and middleware. Use when the user wants a concise reference instead of a guided workflow."
---
# 11ai Vercel AI SDK v7 cheatsheet

Use the installed SDK and official documentation for that version as the source of truth. This plugin is standalone; route multi-step work only to its sibling skills.

Version baseline: Target AI SDK 7 and matching companion packages. Use v7 agent context, approvals, WorkflowAgent durability, timeouts, sandbox support, telemetry, realtime voice, and video APIs instead of v6-era migration patterns.

## Inspect

```bash
node -p "require('ai/package.json').version" 2>/dev/null
rg -n 'generateText|streamText|Output\.|ToolLoopAgent|WorkflowAgent|useRealtime|generateVideo|useChat|providerOptions' . --glob '*.{ts,tsx,js,jsx}' --glob '!node_modules' | head -120
rg -o '^[A-Z][A-Z0-9_]*=' .env.example .env.local 2>/dev/null | sed 's/=.*//' | sort -u
```

Confirm package versions, runtime, framework boundary, configured adapters or providers, and existing scripts. Never guess AI SDK version, model ID, provider, tool permissions, token budget, output schema, telemetry policy, or runtime.

## Common commands

```bash
npm install ai@^7 zod@^4
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Installation changes the lockfile and belongs to requested setup. Inspect existing dependencies before adding packages or scaffolders.

## Domain map

| Skill | Use it for |
| --- | --- |
| `11ai-operator-vercel-ai-sdk-v7-generation` | Text, realtime voice, image, video, speech, and transcription generation |
| `11ai-operator-vercel-ai-sdk-v7-streaming-ui` | UI messages, useChat, stream responses, data parts, and reconnection |
| `11ai-operator-vercel-ai-sdk-v7-structured-output` | Output schemas, partial values, validation, and repair |
| `11ai-operator-vercel-ai-sdk-v7-tools-agents` | Tool schemas, execution, loops, approvals, stop conditions, and results |
| `11ai-operator-vercel-ai-sdk-v7-providers-middleware` | Provider registries, model middleware, fallbacks, telemetry, and options |

## Answer format

Lead with the smallest SDK call or command. State runtime, external effect or cost, secret boundary, verification, and whether approval is required before executing it.
