---
name: 11ai-ai-chat-multiple-models
description: Let users pick between multiple LLMs (across providers) in an AI chat — model registry, per-provider SDK instances over one gateway, per-message modelId routing, model picker UI, and per-session model persistence. Use when adding model selection or multi-provider support to an AI chat.
---

# Multiple models in an AI chat

Multi-model support is four pieces: a **model registry** (the single source of truth), **per-provider SDK instances** on the server, a **`modelId` passed with every request**, and a **picker persisted per session**. The model is chosen per message, so users can switch mid-conversation.

## 1. Model registry

One typed catalog shared by the route (validation, provider lookup) and the client (picker options). First entry is the default:

```ts
// lib/models/types.ts
export interface Model {
  id: string        // gateway-qualified id, e.g. "openai/gpt-4.1"
  model: string     // display/model name, e.g. "gpt-4.1"
  provider: string  // key into the route's providers map
}

// lib/models/index.ts
export const models: Model[] = [
  { id: "openai/gpt-4.1",            model: "gpt-4.1",          provider: "openai" },
  { id: "openai/gpt-4o",             model: "gpt-4o",           provider: "openai" },
  { id: "deepseek/DeepSeek-V3-0324", model: "DeepSeek-V3-0324", provider: "deepseek" },
  { id: "deepseek/DeepSeek-R1",      model: "DeepSeek-R1",      provider: "deepseek" },
  { id: "xai/grok-3-mini",           model: "grok-3-mini",      provider: "xai" },
  { id: "xai/grok-3",                model: "grok-3",           provider: "xai" },
]
```

- `id` is what travels over the wire and what the gateway expects (`provider/model` form for GitHub Models).
- Adding/removing a model is a one-line registry change — route and picker pick it up automatically.
- To disable a model temporarily, comment it out of the registry; nothing else references it directly.

## 2. Per-provider SDK instances over one gateway

Use each vendor's AI SDK provider package — `@ai-sdk/openai`, `@ai-sdk/deepseek`, `@ai-sdk/xai` — even when everything routes through a single OpenAI-compatible gateway. The provider-specific packages carry the correct parameter handling and quirks for each model family; the gateway only unifies auth and transport:

```ts
import { createOpenAI } from "@ai-sdk/openai"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createXai } from "@ai-sdk/xai"

const GATEWAY = "https://models.github.ai/inference"  // see 11ai-ai-chat-github-provider

const openai   = createOpenAI({   baseURL: GATEWAY, apiKey: process.env.GITHUB_TOKEN })
const deepseek = createDeepSeek({ baseURL: GATEWAY, apiKey: process.env.GITHUB_TOKEN })
const xai      = createXai({      baseURL: GATEWAY, apiKey: process.env.GITHUB_TOKEN })

const providers = { openai, deepseek, xai }
```

The `providers` map keys match `Model.provider` in the registry — that's the whole dispatch mechanism.

## 3. Route: resolve modelId → provider → model

The client sends `modelId` in the request body alongside `messages`. The route validates against the registry, falls back to the default, and dispatches:

```ts
export async function POST(req: Request) {
  const { messages, modelId } = (await req.json()) as {
    messages: UIMessage[]
    modelId?: string
  }

  const effectiveModelId = modelId ?? models[0]?.id
  if (!effectiveModelId) {
    return new Response("No model configured", { status: 500 })
  }

  const modelDef = models.find((m) => m.id === effectiveModelId)
  if (!modelDef) {
    return new Response(`Model ${effectiveModelId} not found`, { status: 400 })
  }

  const provider = providers[modelDef.provider as keyof typeof providers]
  if (!provider) {
    return new Response(`Provider ${modelDef.provider} not supported`, { status: 400 })
  }

  const result = streamText({
    model: provider.chat(effectiveModelId),  // full gateway-qualified id
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
```

Validation order matters: unknown model → 400 (client bug or stale registry), never a silent fallback that masks a misroute. Only a *missing* `modelId` falls back to the default.

## 4. Client: send modelId per message

`useChat`'s `sendMessage` accepts per-call request options — extra `body` fields are merged into the POST. This is what makes mid-conversation switching work, with no transport rebuild:

```tsx
const [selectedModelId, setSelectedModelId] = useState(models[0]?.id ?? "")

await sendMessage(
  { text },
  { body: { modelId: selectedModelId } }
)
```

Don't bake `modelId` into the `DefaultChatTransport` config — transport-level body is fixed at construction; per-message body follows the picker live.

## 5. Picker UI

A compact select in the prompt input footer (next to the send button), listing `model (provider)`:

```tsx
<Select value={selectedModelId} onValueChange={setSelectedModelId}>
  <SelectTrigger className="h-8 w-[210px] text-xs">
    <SelectValue placeholder="Select model" />
  </SelectTrigger>
  <SelectContent>
    {models.map((m) => (
      <SelectItem key={m.id} value={m.id}>
        {m.model} ({m.provider})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Gate submission on a model being selected: `canSubmit = input.trim().length > 0 && Boolean(selectedModelId)`.

## 6. Persist the model per session

Add `modelId` to the session entity (see `11ai-ai-chat-session-mgmt`) so each conversation remembers its model:

```ts
export interface ChatSession {
  // ...existing fields
  modelId: string
}
```

Lifecycle rules:

- **Create**: stamp the currently selected model onto the new session.
- **Save**: include `modelId` in the same write as `messages` (on stream completion), so a mid-chat switch is remembered.
- **Select session**: restore the picker — `setSelectedModelId(session.modelId || defaultModelId)`.
- **New chat**: reset the picker to the default.

## Caveats

- **Tool support varies by model.** If the chat uses tools (see `11ai-ai-chat-tool-design`), verify each registry entry handles tool calls; either keep the registry tools-capable-only or flag entries that aren't.
- **Reasoning models** (R1-style) stream thinking content and respond slower — make sure the UI only renders text parts, and consider labeling them in the picker.
- **One env var, many providers** is a gateway property (GitHub Models). With native vendor APIs, each `create*` call gets its own `baseURL`/`apiKey` — the registry/dispatch pattern is unchanged.
- The per-message `modelId` means the *next* message uses the new model; in-flight streams are unaffected. Pair the picker with a stop button (`useChat`'s `stop`) so users can abort and re-ask on a different model.
