---
name: 11ai-ai-chat-stack
description: End-to-end recipe for a grounded, tool-using AI chat in a Next.js App Router app — streaming route, tool sets, sessions, auto-titling, and client UI, using the Vercel AI SDK. Use when adding a complete AI chat surface to an app from scratch.
---

# Full AI chat stack

The complete architecture for a production-feeling AI chat grounded in your own data, built on the Vercel AI SDK (`ai` v6 + `@ai-sdk/react`). Companion skills cover each layer in depth:

- `11ai-ai-chat-github-provider` — free inference provider
- `11ai-ai-chat-tool-design` — tool sets, mini variant
- `11ai-ai-chat-client-hooks` — useChat wiring
- `11ai-ai-chat-autotitle` — session naming
- `11ai-ai-chat-session-mgmt` — session persistence
- `11ai-ai-chat-ui-ux` — UI feature set

## Architecture

```
app/<area>/ai-chat/
  page.tsx                      # client page: sidebar + ChatArea (useChat)
  _hooks/use-chat-sessions.ts   # session CRUD hook (localStorage / client store / service API)
app/<area>/api/chat/
  route.ts                      # POST: streamText + tools → UI message stream
  title/route.ts                # POST: one-shot generateText → { title }
app/<area>/api/_lib/
  chat-tools.ts                 # full tool set
  chat-tools-mini.ts            # token-lean tool set (same names/schemas)
  *-data.ts                     # server-only data layer the tools call
```

Data flow: input → `useChat.sendMessage` → POST `/api/chat` → `streamText` runs a bounded tool loop against the data layer → UI message stream → bubbles render text parts → on stream completion the full `UIMessage[]` is persisted to the active session. First message also fires the title endpoint fire-and-forget.

## 1. Chat route

```ts
// app/<area>/api/chat/route.ts
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai"
import { createOpenAI } from "@ai-sdk/openai"

import { chatMiniTools } from "../_lib/chat-tools-mini"
import { chatTools } from "../_lib/chat-tools"

const GITHUB_MODELS_BASE_URL = "https://models.github.ai/inference"
const AI_MINI = process.env.NEXT_PUBLIC_AI_MINI === "true"

function getModel() {
  const apiKey = process.env.GITHUB_TOKEN
  if (!apiKey) return null
  return createOpenAI({
    apiKey,
    baseURL: GITHUB_MODELS_BASE_URL,
    name: "github-models",
  }).chat("gpt-4.1-mini")
}

const SYSTEM_PROMPT = [
  "You are the <product> AI assistant.",
  "You help users explore <domain> data using the available tools.",
  "",
  "Always use tools before answering <domain> questions.",
  "Only answer with information supported by tool results.",
  "Be concise, practical, and specific.",
].join("\n")

export async function POST(req: Request) {
  const model = getModel()
  if (!model) {
    return Response.json(
      { error: "AI chat is unavailable because GITHUB_TOKEN is not configured." },
      { status: 503 }
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: AI_MINI ? chatMiniTools : chatTools,
    stopWhen: stepCountIs(6),
    onError({ error }) {
      console.error("AI stream error:", error)
    },
  })

  return result.toUIMessageStreamResponse()
}
```

The load-bearing pieces:

- `convertToModelMessages` — translates persisted `UIMessage[]` (incl. tool parts) into model messages.
- `stopWhen: stepCountIs(6)` — bounds the tool loop; enough for search → detail → compare.
- `toUIMessageStreamResponse()` — the wire format `useChat`'s `DefaultChatTransport` expects.
- Missing key → readable 503, not a crash; the message surfaces in the client error banner.
- System prompt makes grounding mandatory: tools-before-answering, tool-results-only.

## 2. Tools

Two sets, identical names and input schemas, different output budgets (full code in `11ai-ai-chat-tool-design`):

- Search/detail pairs per entity type: search returns compact projections **with ids**; detail fetches by id.
- A zero-arg overview/KPI tool gives the model a cheap orientation call.
- Mini set: page size 5, `take(n)` caps on every nested array, summarizer functions instead of raw records, `null` for not-found.
- Tools call a `server-only` data layer (in-memory/indexed) — keep `execute` fast; it runs inside the stream.

## 3. Title route

One-shot `generateText` with a strict system prompt ("3 to 6 words, no quotes, respond with only the title"), same provider seam, called fire-and-forget from the client on the first message (details in `11ai-ai-chat-autotitle`).

## 4. Sessions

`useChatSessions()` hook exposing `{ sessions, create, rename, togglePin, remove, saveMessages, getSession }` over your persistence of choice — localStorage for zero-backend, or a small REST surface for server persistence. Sessions store `UIMessage[]` verbatim, sort pinned-first then `updatedAt`. Page-level lifecycle: bootstrap most-recent-or-create, delete-falls-back-to-next, switch by loading the full session. (Full patterns in `11ai-ai-chat-session-mgmt`.)

## 5. Client page

```tsx
"use client"
const transport = new DefaultChatTransport({ api: "/<area>/api/chat" })

// per-session chat area, remounted on switch:
<ChatArea key={activeSession.id} session={activeSession} ... />

// inside ChatArea:
const { messages, sendMessage, status, error, clearError } = useChat({
  transport,
  messages: session.messages,   // history restore
})
```

The critical client behaviors (full code in `11ai-ai-chat-client-hooks`):

- **Remount on session switch** via `key` — never mutate a live `useChat` instance's history.
- **Persist on stream completion only**, guarded by a saved-count ref.
- **One-shot first-message hook** (ref-guarded) → auto-title.
- **Render only messages with non-empty text parts**; thinking indicator only while loading and before assistant text arrives.
- **Auto-scroll** on new visible messages; **refocus input** when streaming ends (both rAF-wrapped).
- **Dismissible error banner** showing `error.message`.

## 6. UI shell

Sidebar (sessions: pin/rename/delete via hover kebab, inline rename) + chat column (hint-chip empty state, bubbles, bottom input row), `svh`-based height math with `min-h-0` flex chain, mobile dropdown fallback. (Full checklist in `11ai-ai-chat-ui-ux`.)

## Environment

```
GITHUB_TOKEN=ghp_...          # server-only; chat + title routes
NEXT_PUBLIC_AI_MINI=true      # optional: switch to the token-lean tool set
```

## Build order

1. Data layer + full tool set; verify tools standalone (call `execute` directly).
2. Chat route; smoke-test with `curl` POSTing a `messages` array.
3. Minimal client (transport + useChat + bubbles + input) against one hardcoded session.
4. Sessions hook + sidebar + persistence-on-completion.
5. Title route + first-message trigger.
6. Mini tool set + env toggle.
7. UX polish pass: empty state hints, thinking indicator, error banner, scroll/focus, mobile.
