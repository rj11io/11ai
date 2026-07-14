---
name: 11ai-ai-chat-client-hooks
description: "Client-side wiring of @ai-sdk/react useChat — transport setup, per-session remounting, restoring history, persisting on stream completion, and the ref guards that prevent duplicate saves/titles/focus bugs. Use when building or debugging the React side of an AI chat."
---

# useChat client wiring

The `useChat` hook from `@ai-sdk/react` looks simple but has several integration subtleties: when to persist, how to switch sessions, and how to avoid effect re-fire bugs. These are the patterns that make it solid.

## Transport — module scope, once

```tsx
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

const transport = new DefaultChatTransport({ api: "/api/chat" })
```

Create the transport at module scope, not inside the component — a new transport per render breaks streaming state.

## One useChat per session, via `key` remount

`useChat` holds message state internally. Don't try to swap its contents when the user changes session — **remount the whole chat area** with a session-keyed component:

```tsx
<ChatArea
  key={activeSession.id}          // remount on session switch
  session={activeSession}
  onMessagesChange={handleMessagesChange}
  onFirstMessageSent={handleFirstMessageSent}
/>
```

Inside, restore history through the initial `messages` value:

```tsx
const { messages, sendMessage, status, error, clearError } = useChat({
  transport,
  messages: session.messages,   // restored history
})

const isLoading = status === "streaming" || status === "submitted"
```

## Persist only when streaming completes

Saving on every token wastes writes and can persist half-streamed messages. Save when the count grows *and* streaming is done, guarded by a ref so the effect is idempotent:

```tsx
const savedCountRef = useRef(session.messages.length)

useEffect(() => {
  if (messages.length > savedCountRef.current && !isLoading) {
    savedCountRef.current = messages.length
    onMessagesChange(messages)
  }
}, [messages, isLoading, onMessagesChange])
```

`onMessagesChange` upstream writes the full `UIMessage[]` to whatever persistence layer is in use (see `11ai-ai-chat-session-mgmt`).

## Fire side effects exactly once — ref guards

**First-message hook (e.g. auto-titling)** — guard with a ref, fire before `sendMessage`:

```tsx
const titleRequestedRef = useRef(false)

function handleSubmit(text: string) {
  if (!text.trim()) return
  const trimmed = text.trim()

  if (messages.length === 0 && !titleRequestedRef.current) {
    titleRequestedRef.current = true
    onFirstMessageSent(trimmed)   // fire-and-forget (see 11ai-ai-chat-autotitle)
  }

  sendMessage({ text: trimmed })
  setInput("")
}
```

To send per-request fields (e.g. the selected model when supporting multiple models — see `11ai-ai-chat-multiple-models`), use `sendMessage`'s options instead of the transport config, so the value is read live at send time:

```tsx
sendMessage({ text: trimmed }, { body: { modelId: selectedModelId } })
```

**Refocus input after a stream ends** — track the loading edge with a ref; `requestAnimationFrame` waits for the disabled input to re-enable:

```tsx
const wasLoadingRef = useRef(false)

useEffect(() => {
  if (isLoading) {
    wasLoadingRef.current = true
    return
  }
  if (!wasLoadingRef.current) return
  wasLoadingRef.current = false
  requestAnimationFrame(() => inputRef.current?.focus())
}, [isLoading])
```

## Render only meaningful messages

Tool-call-only assistant steps have no text parts and would render as empty bubbles. Filter first:

```tsx
const visible = messages.filter((msg) =>
  msg.parts.some((p) => p.type === "text" && p.text.trim())
)
const lastVisibleIsUser =
  visible.length === 0 || visible[visible.length - 1]?.role === "user"
```

Render text parts only:

```tsx
{message.parts.map((part, i) =>
  part.type === "text" ? (
    <div key={i} className="whitespace-pre-wrap">{part.text}</div>
  ) : null
)}
```

Show the "Thinking..." indicator only while loading **and** the last visible message is the user's — once assistant text starts streaming, the indicator yields to the real bubble.

## Auto-scroll

Scroll the container on visible-count or loading changes, inside `requestAnimationFrame` so the DOM has the new node:

```tsx
useEffect(() => {
  const el = scrollRef.current
  if (!el) return
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
}, [visible.length, isLoading])
```

## Stable callbacks at the page level

Handlers passed into `ChatArea` must be `useCallback`-stable or the save effect re-fires:

```tsx
const handleMessagesChange = useCallback(
  (messages: UIMessage[]) => {
    if (activeId) saveMessages(activeId, messages)
  },
  [activeId, saveMessages]
)
```

## Error surface

`useChat` exposes `error` and `clearError`. Render a dismissible banner — and remember the route returns readable messages (e.g. the 503 "AI chat is unavailable..." when the provider key is missing), so `error.message` is user-presentable:

```tsx
{error && (
  <div className="...destructive banner...">
    {error.message || "Something went wrong. Please try again."}
    <Button variant="ghost" size="sm" onClick={clearError}>Dismiss</Button>
  </div>
)}
```
