# 11ai Vercel AI SDK v7 operator

Ten standalone skills for AI SDK 7 text, image, video, speech, transcription, realtime generation, streaming UI, structured outputs, tools, durable agents, providers, telemetry, and bounded model use.

Version baseline: AI SDK 7 and matching companion-package majors.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-ai-sdk-v7-cheatsheet`](./skills/11ai-operator-vercel-ai-sdk-v7-cheatsheet/SKILL.md) | Quick commands, calls, and policy reminders |
| [`11ai-operator-vercel-ai-sdk-v7-environment`](./skills/11ai-operator-vercel-ai-sdk-v7-environment/SKILL.md) | Read-only package, runtime, and environment inspection |
| [`11ai-operator-vercel-ai-sdk-v7-setup`](./skills/11ai-operator-vercel-ai-sdk-v7-setup/SKILL.md) | Project-local installation and bounded configuration |
| [`11ai-operator-vercel-ai-sdk-v7-integrations`](./skills/11ai-operator-vercel-ai-sdk-v7-integrations/SKILL.md) | Runtime, persistence, auth, observability, and deployment seams |
| [`11ai-operator-vercel-ai-sdk-v7-troubleshooting`](./skills/11ai-operator-vercel-ai-sdk-v7-troubleshooting/SKILL.md) | Evidence-led diagnosis with cost and external-effect controls |
| [`11ai-operator-vercel-ai-sdk-v7-generation`](./skills/11ai-operator-vercel-ai-sdk-v7-generation/SKILL.md) | Text generation, streaming, sampling, usage, and stop controls |
| [`11ai-operator-vercel-ai-sdk-v7-streaming-ui`](./skills/11ai-operator-vercel-ai-sdk-v7-streaming-ui/SKILL.md) | UI messages, useChat, stream responses, data parts, and reconnection |
| [`11ai-operator-vercel-ai-sdk-v7-structured-output`](./skills/11ai-operator-vercel-ai-sdk-v7-structured-output/SKILL.md) | Schemas, object generation, partial values, validation, and repair |
| [`11ai-operator-vercel-ai-sdk-v7-tools-agents`](./skills/11ai-operator-vercel-ai-sdk-v7-tools-agents/SKILL.md) | Tool schemas, execution, loops, approvals, stop conditions, and results |
| [`11ai-operator-vercel-ai-sdk-v7-providers-middleware`](./skills/11ai-operator-vercel-ai-sdk-v7-providers-middleware/SKILL.md) | Provider registries, model middleware, fallbacks, telemetry, and options |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect installed versions, runtime, environment, provider or adapter, persistence, and existing policies before changing anything.

Never guess AI SDK version, model ID, provider, tool permissions, token budget, output schema, telemetry policy, or runtime. Obtain exact values from the user, repository, or target dashboard.

Ask before invoking paid models, enabling tools that change external state, increasing step or token limits, changing providers, retaining prompts, or deploying production routes. Preview recipients, resources, costs, permissions, and rollback for every external action.

Never print or commit provider API keys, AI Gateway keys, OIDC tokens, prompts containing private data, tool credentials, or raw telemetry payloads. Redact user content and personal data. Count requests, events, messages, tool calls, and resources before bulk work; keep retries and concurrency bounded.
