---
name: 11ai-ai-chat-ui-ux
description: The UX feature set and layout patterns for a polished AI chat surface — hint-chip empty state, message bubbles, thinking indicator, dismissible errors, sessions sidebar with pin/rename/delete, mobile fallback, scroll/focus behavior. Use when building or reviewing an AI chat UI.
---

# AI chat UI/UX patterns

The feature set that makes a chat surface feel finished, with the layout math and interaction details that are easy to get wrong.

## Layout skeleton

Two-pane: sessions sidebar (desktop only) + chat column. The chat column is `header-aware` fixed height so the message list scrolls internally, never the page:

```tsx
<div className="flex h-[calc(100svh-3.5rem-2.5rem-1px)] min-h-0">
  {/* sidebar: hidden below lg */}
  <div className="hidden w-60 shrink-0 flex-col border-r border-border/60 lg:flex">...</div>
  {/* chat column */}
  <div className="flex min-h-0 flex-1 flex-col">...</div>
</div>
```

- Use `svh` (not `vh`) so mobile browser chrome doesn't clip the input.
- Subtract every fixed bar (app header, footer strip, borders) explicitly.
- `min-h-0` on every flex level between the viewport and the scroll container — without it the inner `overflow-y-auto` never engages.
- Message column content capped at `max-w-2xl mx-auto` for readable line lengths.

## Empty state: hint chips, not a blank box

First impression is a branded empty state with clickable example prompts. Hints should be real, working queries against your data — they double as a demo script:

```tsx
const HINTS = [
  "Find the Acme Pro Widget and give me the compact product summary.",
  "Compare the Acme Pro Widget and the Globex Gadget on orders, reviews, and incidents.",
  "Show the top-level KPI counts, then suggest one product to inspect.",
]
```

Clicking a hint **fills the input and focuses it** — it does not auto-send. The user keeps the final say and can edit:

```tsx
onSelect={(hint) => {
  setInput(hint)
  requestAnimationFrame(() => inputRef.current?.focus())
}}
```

Grid of bordered chips, responsive columns (`sm:grid-cols-2 xl:grid-cols-3`), muted text that brightens on hover.

## Message bubbles

- User right-aligned (`flex-row-reverse`), brand background, white text. Assistant left-aligned, `bg-muted`, with an avatar image.
- `max-w-[75%]`, `rounded-xl`, `whitespace-pre-wrap` for the text.
- Render only messages that have non-empty text parts — tool-call-only steps must not produce empty bubbles.

## Thinking indicator

Pulsing avatar + "Thinking..." bubble, shown only while loading **and** before assistant text starts streaming (i.e. last visible message is the user's). Once tokens arrive, the real bubble replaces it — no double indicator:

```tsx
{isLoading && lastVisibleIsUser && (
  <div className="flex gap-3">
    <Image ... className="size-8 shrink-0 animate-pulse rounded-full" />
    <div className="rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
      Thinking...
    </div>
  </div>
)}
```

## Input row

- Sticky to the bottom of the chat column (`border-t` + padding), form with text input + icon send button.
- Disable input *and* send while streaming; also disable send when the input is blank.
- Refocus the input automatically when streaming ends (rAF after re-enable — see `11ai-ai-chat-client-hooks`).

## Error banner

Inline above the input, destructive-tinted, with the actual error message (routes return human-readable errors) and a Dismiss button wired to `clearError`. Never a toast that disappears before the user reads it; never a dead chat with no explanation.

## Sessions sidebar

Each row: icon + truncated title + pin indicator + a kebab menu revealed on hover.

- **Title truncation**: slice to ~25 chars + ellipsis. Auto-generated titles are 3–6 words, so most fit.
- **Pin indicator**: small rotated pin icon, pinned sessions sort to the top.
- **Kebab menu** (`opacity-0 group-hover:opacity-100`): Pin/Unpin, Rename, Delete (destructive styling). The trigger stops propagation so opening the menu doesn't switch sessions:

```tsx
<button onClick={(e) => e.stopPropagation()} className="... opacity-0 group-hover:opacity-100">
  <MoreHorizontal className="size-3.5" />
</button>
```

- **Inline rename**: the row swaps to an autofocused input inside a form; commit on Enter (submit) or blur:

```tsx
<form onSubmit={(e) => { e.preventDefault(); handleFinishRename() }}>
  <Input value={renameValue} onChange={...} onBlur={handleFinishRename} className="h-7 text-xs" autoFocus />
</form>
```

- Header: "Chats" label + a small `+` new-chat button. Empty list shows "No chats yet".

## Mobile fallback

Below `lg`, the sidebar disappears; a compact toolbar above the chat shows a "New chat" button and a dropdown listing sessions with the active title as its trigger. Same actions, no second pane.

## Micro-details checklist

- Auto-scroll to bottom on new visible message or loading change (rAF-wrapped).
- New chat from anywhere → switches immediately to the fresh, empty session (hint chips show again).
- First message triggers auto-titling (see `11ai-ai-chat-autotitle`); sidebar title updates in place when it lands.
- Deleting the active session falls back to the next session or a fresh one — never an empty dead state.
- "Loading chat..." centered placeholder while the initial session resolves.
- Brand the assistant (avatar, name in the empty state heading and input placeholder) — it reads as a product feature, not a widget.
