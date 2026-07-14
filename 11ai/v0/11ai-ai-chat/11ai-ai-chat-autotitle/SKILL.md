---
name: 11ai-ai-chat-autotitle
description: Auto-name a new chat session from the user's first message using a tiny one-shot LLM endpoint, called fire-and-forget from the client. Use when adding session titles to an AI chat.
---

# Auto-titling chat sessions

New sessions start as "New chat" and get renamed to a 3–6 word title generated from the user's first message. The generation is a separate, tiny endpoint — it must not touch the chat stream or block sending.

## The title endpoint

A one-shot `generateText` call. Same provider seam as the chat route (see `11ai-ai-chat-github-provider`), same graceful 503 when unconfigured:

```ts
// app/.../api/chat/title/route.ts
import { generateText } from "ai"

export async function POST(req: Request) {
  const model = getModel()
  if (!model) {
    return Response.json(
      { error: "AI chat is unavailable because GITHUB_TOKEN is not configured." },
      { status: 503 }
    )
  }

  const { message }: { message: string } = await req.json()
  const { text } = await generateText({
    model,
    system:
      "Generate a short chat title of 3 to 6 words with no quotes. Respond with only the title.",
    prompt: message,
  })

  return Response.json({ title: text.trim() })
}
```

The system prompt does all the work: hard word range, "no quotes", "respond with only the title". Keep it that strict — small models pad otherwise.

## Client: fire-and-forget, never block

A helper that swallows every failure — titling is cosmetic; the chat must work identically if it 503s, times out, or returns garbage:

```ts
async function generateChatTitle(message: string): Promise<string | null> {
  try {
    const res = await fetch("/api/chat/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    if (!res.ok) return null
    const { title } = await res.json()
    return title || null
  } catch {
    return null
  }
}
```

## Trigger exactly once, on the first message

In the submit handler, before `sendMessage`, guarded by a ref (full wiring in `11ai-ai-chat-client-hooks`):

```tsx
const titleRequestedRef = useRef(false)

if (messages.length === 0 && !titleRequestedRef.current) {
  titleRequestedRef.current = true
  onFirstMessageSent(trimmed)
}
```

## Apply the title when it lands

The user may have switched sessions while the title was generating — capture the session id at call time and match against it when updating local state:

```tsx
const handleFirstMessageSent = useCallback(
  (text: string) => {
    if (!activeId) return
    const id = activeId                      // capture now
    generateChatTitle(text).then((title) => {
      if (title) {
        rename(id, title)                    // persist to the session store
        setActiveSession((prev) =>
          prev && prev.id === id ? { ...prev, title } : prev   // only if still active
        )
      }
    })
  },
  [activeId, rename]
)
```

## Rules of thumb

- Don't fold titling into the chat stream (e.g. asking the chat model to emit a title) — it pollutes the conversation and couples two concerns. A separate cheap call is simpler and cancellable-by-neglect.
- Title from the **user's first message**, not the assistant's reply — it's available immediately and reflects intent.
- Users can still rename manually; auto-title is just the default. Never overwrite a manual rename with a late-arriving generated title (the `prev.id === id` check plus one-shot ref guard covers this).
