---
name: 11ai-ai-chat-session-mgmt
description: Manage multi-session AI chat state — session entity shape, a CRUD hook with reactive refresh, pinned-first sorting, and persistence via localStorage or a service API. Use when adding chat history, pin/rename/delete, or session switching to an AI chat.
---

# Chat session management

Multi-session chat needs a small entity, a CRUD hook the UI consumes, and a persistence backend. The hook's API is the contract; the backend (localStorage, IndexedDB-style client store, or a service API) is swappable behind it.

## Session entity

```ts
import type { UIMessage } from "ai"

export interface ChatSession {
  id: string
  title: string
  pinned: boolean
  createdAt: string      // ISO strings — sortable, serializable
  updatedAt: string
  messages: UIMessage[]  // persist the AI SDK's UIMessage[] verbatim
  modelId?: string       // if the chat supports model selection
}
```

Store `UIMessage[]` as-is: it round-trips directly into `useChat({ messages })` for history restore, including tool-call parts.

If the chat supports multiple models (see `11ai-ai-chat-multiple-models`), persist `modelId` in the same write as `messages`, restore the picker from it on session select, and stamp the current selection onto newly created sessions.

## Sorting: pinned first, then most recent

```ts
function sortSessions(list: ChatSession[]) {
  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
```

Note: `togglePin` intentionally does **not** touch `updatedAt` — pinning isn't activity. Only renames and message saves bump it.

## The hook contract

Whatever the backend, expose this surface — the chat page consumes exactly this:

```ts
export function useChatSessions() {
  // ...
  return {
    sessions,        // ChatSession[] (sorted, message-light is fine for the list)
    create,          // (title?) => Promise<ChatSession>
    rename,          // (id, title) => Promise<void>
    togglePin,       // (id, pinned) => Promise<void>
    remove,          // (id) => Promise<void>
    saveMessages,    // (id, messages: UIMessage[]) => Promise<void>
    getSession,      // (id) => Promise<ChatSession | null>  — full record incl. messages
  }
}
```

All mutators wrapped in `useCallback` — downstream effects depend on their identity.

## Backend A: localStorage (zero-dependency client persistence)

```ts
const KEY = "ai-chat-sessions"

function readAll(): ChatSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

function writeAll(sessions: ChatSession[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions))
  window.dispatchEvent(new CustomEvent("ai-chat-sessions-changed"))
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const refresh = useCallback(() => setSessions(sortSessions(readAll())), [])

  useEffect(() => {
    refresh()
    // react to same-tab mutations and other-tab storage events
    window.addEventListener("ai-chat-sessions-changed", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("ai-chat-sessions-changed", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [refresh])

  const create = useCallback(async (title = "New chat") => {
    const now = new Date().toISOString()
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title, pinned: false, createdAt: now, updatedAt: now, messages: [],
    }
    writeAll([...readAll(), session])
    return session
  }, [])

  const update = useCallback(async (id: string, patch: Partial<ChatSession>) => {
    writeAll(readAll().map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const rename = useCallback(
    (id: string, title: string) =>
      update(id, { title, updatedAt: new Date().toISOString() }),
    [update]
  )
  const togglePin = useCallback(
    (id: string, pinned: boolean) => update(id, { pinned }),
    [update]
  )
  const remove = useCallback(async (id: string) => {
    writeAll(readAll().filter((s) => s.id !== id))
  }, [])
  const saveMessages = useCallback(
    (id: string, messages: UIMessage[]) =>
      update(id, { messages, updatedAt: new Date().toISOString() }),
    [update]
  )
  const getSession = useCallback(
    async (id: string) => readAll().find((s) => s.id === id) ?? null,
    []
  )

  return { sessions, create, rename, togglePin, remove, saveMessages, getSession }
}
```

localStorage caveats: ~5MB quota — long tool-heavy histories add up; consider capping stored messages per session or pruning oldest unpinned sessions. Guard SSR (`typeof window !== "undefined"`) in Next.js, or only mount the hook in client components.

## Backend B: service API (server-persisted sessions)

Same hook contract, fetch-backed. Routes:

```
GET    /api/chat/sessions            → list (without messages, for the sidebar)
POST   /api/chat/sessions            → create { title? }
GET    /api/chat/sessions/:id        → full session incl. messages
PATCH  /api/chat/sessions/:id        → { title? pinned? messages? }
DELETE /api/chat/sessions/:id
```

```ts
const create = useCallback(async (title = "New chat") => {
  const res = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  const session: ChatSession = await res.json()
  await refresh()
  return session
}, [refresh])

const saveMessages = useCallback(async (id: string, messages: UIMessage[]) => {
  await fetch(`/api/chat/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })
  await refresh()
}, [refresh])
```

Service-API notes:

- The list endpoint should omit `messages` (sidebar only needs title/pinned/updatedAt); `getSession` fetches the full record on selection.
- `saveMessages` fires once per completed stream (not per token — see `11ai-ai-chat-client-hooks`), so a plain PATCH-the-array approach is fine to start.
- Apply mutations optimistically to local state if refresh round-trips feel slow.

## Page-level session lifecycle

Patterns the consuming page needs regardless of backend:

**Bootstrap** — load the most recent session, or create one if none exist. Guard with an init ref and debounce creation slightly so a slow initial load doesn't race a phantom create:

```tsx
const initRef = useRef(false)

useEffect(() => {
  if (initRef.current) return
  if (sessions.length > 0 && !activeId) {
    initRef.current = true
    loadSession(sessions[0].id)
  } else if (sessions.length === 0 && !activeId) {
    const timer = setTimeout(async () => {
      if (initRef.current) return
      initRef.current = true
      const s = await create()
      setActiveId(s.id)
      setActiveSession(s)
    }, 300)
    return () => clearTimeout(timer)
  }
}, [sessions])
```

**Delete fallback** — deleting the active session selects the next one, or creates a fresh one if it was the last:

```tsx
async function handleDelete(id: string) {
  await remove(id)
  if (activeId === id) {
    const remaining = sessions.filter((s) => s.id !== id)
    if (remaining.length > 0) loadSession(remaining[0].id)
    else {
      const s = await create()
      setActiveId(s.id)
      setActiveSession(s)
    }
  }
}
```

**Switching** — set both `activeId` and the full `activeSession` object; the chat area remounts via `key={activeSession.id}` (see `11ai-ai-chat-client-hooks`).
