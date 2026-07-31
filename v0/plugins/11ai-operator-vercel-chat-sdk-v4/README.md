# 11ai Vercel Chat SDK v4 operator

Ten standalone skills for Chat SDK 4 platform adapters, event handlers, messages, cards, `chat/ai` tools, Vercel Connect, distributed state, concurrency, webhooks, streaming, and deployment.

Version baseline: Chat SDK 4, currently the 4.35 release line.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-chat-sdk-v4-cheatsheet`](./skills/11ai-operator-vercel-chat-sdk-v4-cheatsheet/SKILL.md) | Quick commands, calls, and policy reminders |
| [`11ai-operator-vercel-chat-sdk-v4-environment`](./skills/11ai-operator-vercel-chat-sdk-v4-environment/SKILL.md) | Read-only package, runtime, and environment inspection |
| [`11ai-operator-vercel-chat-sdk-v4-setup`](./skills/11ai-operator-vercel-chat-sdk-v4-setup/SKILL.md) | Project-local installation and bounded configuration |
| [`11ai-operator-vercel-chat-sdk-v4-integrations`](./skills/11ai-operator-vercel-chat-sdk-v4-integrations/SKILL.md) | Runtime, persistence, auth, observability, and deployment seams |
| [`11ai-operator-vercel-chat-sdk-v4-troubleshooting`](./skills/11ai-operator-vercel-chat-sdk-v4-troubleshooting/SKILL.md) | Evidence-led diagnosis with cost and external-effect controls |
| [`11ai-operator-vercel-chat-sdk-v4-adapters`](./skills/11ai-operator-vercel-chat-sdk-v4-adapters/SKILL.md) | Platform adapters, capabilities, credentials, and custom adapter contracts |
| [`11ai-operator-vercel-chat-sdk-v4-events-handlers`](./skills/11ai-operator-vercel-chat-sdk-v4-events-handlers/SKILL.md) | Mentions, messages, reactions, commands, actions, and handler routing |
| [`11ai-operator-vercel-chat-sdk-v4-messages-ui`](./skills/11ai-operator-vercel-chat-sdk-v4-messages-ui/SKILL.md) | Posts, streaming, edits, reactions, files, cards, modals, and ephemeral output |
| [`11ai-operator-vercel-chat-sdk-v4-state-concurrency`](./skills/11ai-operator-vercel-chat-sdk-v4-state-concurrency/SKILL.md) | Persistent state, subscriptions, locks, overlap strategies, and deduplication |
| [`11ai-operator-vercel-chat-sdk-v4-webhooks-deployment`](./skills/11ai-operator-vercel-chat-sdk-v4-webhooks-deployment/SKILL.md) | Webhook routes, verification, local tunnels, platform registration, and production rollout |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect installed versions, runtime, environment, provider or adapter, persistence, and existing policies before changing anything.

Never guess Chat SDK version, platform adapter, bot identity, webhook route, credential source, state backend, overlap strategy, recipients, or delivery environment. Obtain exact values from the user, repository, or target dashboard.

Ask before sending messages, DMs, reactions, or modals; subscribing threads; registering webhooks; changing overlap strategy; or deploying a bot. Preview recipients, resources, costs, permissions, and rollback for every external action.

Never print or commit bot tokens, signing secrets, app passwords, webhook secrets, connector credentials, message content, or personal data. Redact user content and personal data. Count requests, events, messages, tool calls, and resources before bulk work; keep retries and concurrency bounded.
