---
name: 11ai-ai-chat-github-provider
description: "Use GitHub Models as a free OpenAI-compatible inference provider for the Vercel AI SDK. Use when wiring an AI chat, title generator, or any LLM call that should run on the free GitHub Models endpoint instead of a paid API key."
---

# GitHub Models as a free AI SDK provider

GitHub Models exposes an OpenAI-compatible inference endpoint at `https://models.github.ai/inference`, authenticated with a plain GitHub token (`GITHUB_TOKEN`). It works with the Vercel AI SDK's `createOpenAI` by overriding `baseURL` — no `@ai-sdk/openai` provider changes, no paid key. Ideal for demos, prototypes, and low-volume internal tools.

## The pattern

```ts
import { createOpenAI } from "@ai-sdk/openai"

const GITHUB_MODELS_BASE_URL = "https://models.github.ai/inference"

function getModel() {
  const apiKey = process.env.GITHUB_TOKEN
  if (!apiKey) return null

  return createOpenAI({
    apiKey,
    baseURL: GITHUB_MODELS_BASE_URL,
    name: "github-models",
  }).chat("gpt-4.1-mini")
}
```

Key points:

- `name: "github-models"` labels the provider in AI SDK telemetry/errors so failures are attributable.
- `.chat("gpt-4.1-mini")` — use the chat-completions surface. Pick a small model; GitHub Models is rate-limited and small models keep within free-tier budgets.
- Return `null` when the token is missing instead of throwing. Degrade at the route level.

## Graceful degradation in the route

Never let a missing token crash the route or surface a stack trace. Return a 503 with a human-readable message the chat UI can show in its error banner:

```ts
export async function POST(req: Request) {
  const model = getModel()

  if (!model) {
    return Response.json(
      { error: "AI chat is unavailable because GITHUB_TOKEN is not configured." },
      { status: 503 }
    )
  }

  // ... streamText({ model, ... })
}
```

## Setup

1. Create a GitHub personal access token (no special scopes needed for models inference; fine-grained tokens work).
2. Put it in `.env.local`:

```
GITHUB_TOKEN=ghp_...
```

3. Server-side only — never expose via `NEXT_PUBLIC_*`.

## Multiple model families on the same gateway

GitHub Models serves OpenAI, DeepSeek, xAI, and other model families behind the same endpoint and token. Instantiate each vendor's AI SDK provider (`createOpenAI`, `createDeepSeek`, `createXai`) with the same `baseURL`/`apiKey` — the vendor packages keep their model-specific parameter handling while the gateway unifies auth. Model ids are gateway-qualified (`"openai/gpt-4.1"`, `"deepseek/DeepSeek-R1"`, `"xai/grok-3"`). For the full registry/dispatch/picker pattern, see `11ai-ai-chat-multiple-models`.

## Caveats

- Rate limits are per-token and tight compared to paid APIs. Cap agentic loops (e.g. `stopWhen: stepCountIs(6)`) and keep tool outputs small (see `11ai-ai-chat-tool-design`).
- Model availability can change; `gpt-4.1-mini` is a good default for tool-calling chat. Check the GitHub Models catalog if a model id starts erroring.
- This is a drop-in seam: to upgrade to a paid provider later, only `getModel()` changes — the rest of the chat stack is provider-agnostic.
