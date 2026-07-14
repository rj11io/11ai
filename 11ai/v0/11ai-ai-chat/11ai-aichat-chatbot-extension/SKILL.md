---
name: 11ai-aichat-chatbot-extension
description: "Extend an AI chat into a Slack (or other messaging platform) chatbot using the Chat SDK — webhook route, mention/DM/thread handlers, streaming replies, slash-command model switching, and Redis-backed conversation state. Use when shipping the assistant as a Slack bot or adding a new messaging platform."
---

# Chatbot extension (Slack via Chat SDK)

The same AI core that powers a web chat (provider, model registry, tools, system prompt) can be exposed as a messaging-platform bot. The Chat SDK (`chat` npm package) abstracts the platform: adapters handle Slack specifics, a state backend holds conversation/config state, and your handlers just call `streamText` and stream the result into the thread.

## Dependencies

```
chat                        # Chat SDK core
@chat-adapter/slack         # Slack adapter (more platforms = more adapters)
@chat-adapter/state-redis   # shared state backend
ai + @ai-sdk/*              # the same AI SDK core the web chat uses
```

Env: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `REDIS_URL`, plus the model provider key (e.g. `GITHUB_TOKEN` — see `11ai-ai-chat-github-provider`).

## Bot definition

```ts
import { Chat, toAiMessages, type SlashCommandEvent, type Thread } from "chat"
import { createSlackAdapter } from "@chat-adapter/slack"
import { createRedisState } from "@chat-adapter/state-redis"

type BotState = {
  modelId?: SupportedModelId   // anything you want scoped to thread/channel
}

const adapters = {
  slack: createSlackAdapter(),
}

export const bot = new Chat<typeof adapters, BotState>({
  userName: "mybot",
  adapters,
  state: createRedisState(),
  onLockConflict: "force",
})
```

- `BotState` is the typed shape of per-thread and per-channel state — model selection lives here, not in memory, so it survives restarts and scales across instances.
- The `adapters` map is the multi-platform seam: add `discord`, `whatsapp`, etc. later without touching handlers.

## Webhook route (Next.js)

One catch-all route serves every platform — the bot exposes a handler per adapter key:

```ts
// app/api/webhooks/[platform]/route.ts
import { after } from "next/server"
import { bot } from "@/lib/bot"

export async function POST(request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params
  const handler = bot.webhooks[platform as keyof typeof bot.webhooks]
  if (!handler) {
    return new Response(`Unknown platform: ${platform}`, { status: 404 })
  }
  return handler(request, {
    waitUntil: (task) => after(() => task),
  })
}
```

`after()` is the critical piece on serverless: Slack requires a fast webhook ACK, so the actual AI work runs as a background task after the response is returned.

## Conversation handlers

Three entry points, one shared responder:

```ts
bot.onNewMention(async (thread) => {
  await thread.subscribe()          // future replies in this thread come to onSubscribedMessage
  await respondWithAi(thread)
})

bot.onSubscribedMessage(async (thread, message) => {
  if (!message.text.trim()) return  // ignore empty/attachment-only messages
  await respondWithAi(thread)
})

bot.onDirectMessage(async (thread, message) => {
  if (!message.text.trim()) return
  await thread.subscribe()
  await respondWithAi(thread)
})
```

The subscription model is the core interaction pattern: @mention starts a subscribed thread, replies in that thread continue the conversation without re-mentioning, DMs auto-subscribe.

Wrap each handler body in try/catch and post a friendly, actionable error **into the thread** — webhook errors are invisible to users otherwise:

```ts
try {
  await respondWithAi(thread)
} catch (error) {
  console.error("Mention handler failed", error)
  await thread.post(
    "I couldn't generate a reply right now. Confirm the model provider token is configured."
  )
}
```

## The AI responder

Platform history is the source of truth — no separate session store needed (contrast with the web chat's `11ai-ai-chat-session-mgmt`); the thread *is* the session:

```ts
const HISTORY_LIMIT = 30

async function getConversationHistory(thread: Thread<BotState>) {
  const messages = []
  for await (const message of thread.messages) {
    messages.push(message)
    if (messages.length >= HISTORY_LIMIT) break
  }
  return toAiMessages(messages, { includeNames: true })
}

async function respondWithAi(thread: Thread<BotState>) {
  const modelId = await getConversationModelId(thread)
  const model = createLanguageModel(modelId)        // same provider seam as the web chat
  const history = await getConversationHistory(thread)
  const system = await getSystemPrompt()

  await thread.startTyping()                        // platform-native "typing" indicator

  const result = streamText({
    model,
    system,
    messages: history,
    tools: assistantTools,                          // same tool set design — see 11ai-ai-chat-tool-design
    stopWhen: stepCountIs(3),
    onError({ error }) {
      console.error("AI stream failed", error)
    },
  })

  await thread.post(result.fullStream)              // streams into the platform message
}
```

Notes:

- `toAiMessages(..., { includeNames: true })` annotates speakers — important in multi-user channels so the model knows who said what.
- Cap history (`HISTORY_LIMIT`) — channel threads can be long and you pay tokens for all of it.
- `thread.post(result.fullStream)` accepts the AI SDK stream directly; the adapter handles progressive message updates.
- Keep `stepCountIs` lower than the web chat (3 vs 6) — chat-platform users expect fast replies.
- Cache the system prompt in a module-level promise if it's assembled asynchronously.

## Scoped state + `/model` slash command

State resolution cascades: thread → channel → default. This lets a channel set a house model while a specific thread overrides it:

```ts
async function getConversationModelId(thread: Thread<BotState>) {
  const threadState = await thread.state
  if (threadState?.modelId) return threadState.modelId
  const channelState = await thread.channel.state
  if (channelState?.modelId) return channelState.modelId
  return DEFAULT_MODEL_ID
}
```

The slash command handles `list` (or empty), `reset`, and a model name — replying **ephemerally** so config chatter doesn't spam the channel:

```ts
bot.onSlashCommand("/model", async (event) => {
  const requested = event.text.trim()

  if (!requested || requested.toLowerCase() === "list") {
    await showModelHelp(event)   // current model + listModelOptions() via postEphemeral
    return
  }

  if (requested.toLowerCase() === "reset") {
    await event.channel.setState({ modelId: DEFAULT_MODEL_ID }, { replace: true })
    await event.channel.postEphemeral(event.user, `Model reset to ...`, { fallbackToDM: false })
    return
  }

  const selected = resolveModelSelection(requested)
  if (!selected) {
    await event.channel.postEphemeral(event.user,
      `Unknown model: \`${requested}\`\n\nAvailable models:\n${listModelOptions()}`,
      { fallbackToDM: false })
    return
  }

  await event.channel.setState({ modelId: selected.id }, { replace: true })
  await event.channel.postEphemeral(event.user, `Model switched to ${selected.label}`, { fallbackToDM: false })
})
```

Because users type model names by hand, the registry needs `label` and `aliases` on top of the web picker's fields (see `11ai-ai-chat-multiple-models`), with normalized matching:

```ts
{
  id: "openai/gpt-4o",          // gateway-qualified, what the provider gets
  label: "GPT-4o",              // human display
  provider: "openai",
  modelId: "gpt-4o",            // bare model name
  aliases: ["gpt-4o", "gpt4o", "openai/gpt-4o"],
}

function resolveModelSelection(input: string) {
  const n = (v: string) => v.trim().toLowerCase().replace(/\s+/g, "")
  return supportedModels.find((m) =>
    n(m.id) === n(input) || n(m.label) === n(input) || m.aliases.some((a) => n(a) === n(input))
  )
}
```

## Onboarding touch

Post an intro when the bot joins a channel (guard on the bot's own user id so other joins don't trigger it):

```ts
bot.onMemberJoinedChannel(async (event) => {
  if (event.userId !== event.adapter.botUserId) return
  await event.adapter.postMessage(event.channelId, CHANNEL_INTRO_MESSAGE)
})
```

The intro should state what the bot does and how to talk to it ("tag me in a message and I'll reply; you can also DM me").

## Slack app configuration checklist

Code alone isn't enough — the Slack app must be configured to deliver the events:

- **App Home**: enable the Messages Tab (required for DMs).
- **Event Subscriptions**: point the request URL at `/api/webhooks/slack`; subscribe to bot events `app_mention`, `message.im` (DMs), and `member_joined_channel` (intro post).
- **Slash Commands**: register `/model` pointing at the same webhook URL.
- **OAuth scopes**: `chat:write`, `im:history`, `im:read`, `channels:read`, `groups:read`.
- **Reinstall the app** after changing scopes or event subscriptions — changes don't apply to existing installs.

## What's shared with the web chat vs. what changes

| Concern | Web chat | Chatbot |
|---|---|---|
| Provider/model factory | shared | shared |
| Model registry | shared (+ `label`/`aliases`) | shared (+ `label`/`aliases`) |
| Tools + system prompt | shared | shared (tighter step cap) |
| Sessions | app-managed store | the platform thread + state backend |
| Model selection | picker, per-message body | `/model` command, thread/channel state |
| Streaming target | UI message stream | `thread.post(result.fullStream)` |

Keep the AI core (`lib/ai/*`: providers, models, tools) in shared modules with no platform imports — the chatbot and the web chat should both be thin consumers of it.
