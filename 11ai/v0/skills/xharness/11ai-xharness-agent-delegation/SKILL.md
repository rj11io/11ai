---
name: 11ai-xharness-agent-delegation
description: Decide which model gets which task when delegating work across harnesses — routes UI, design, and copywriting to Claude Fable 5 (with Sonnet 5 and Opus 4.8 fallbacks) and everything else to a GPT 5.6 tier (Luna, Terra, or Sol) by scope and impact. Use whenever an agent must choose a model for a delegated task, pick between GPT and Claude for a job, apply the team's model routing policy, or resolve a fallback when the assigned model is unavailable.
---

# 11ai Cross-Harness Agent Delegation

## Overview

This is the routing policy: which model does which kind of work. The sibling skill [11ai-xharness-agent-comms](../11ai-xharness-agent-comms/SKILL.md) covers *how* to call another harness (commands, permissions, output capture); this skill covers *who* to call. Apply this policy first, then make the call with the comms skill — high effort, normal speed by default.

## Routing Table

Check the creative rule first, then route by scope and impact:

| Task | Model | Harness |
| --- | --- | --- |
| UI, design, or copywriting — any scope, any impact | `claude-fable-5` | Claude Code |
| High impact — any scope (except UI/design/copywriting) | `gpt-5.6-sol` | Codex CLI |
| Medium scope or medium impact (except UI/design/copywriting) | `gpt-5.6-terra` | Codex CLI |
| Small scope and low impact (except UI/design/copywriting) | `gpt-5.6-luna` | Codex CLI |

Fallback chain for the creative lane: `claude-fable-5` → `claude-sonnet-5` → `claude-opus-4-8`. Use the next model only when the one before it is unavailable.

## Classifying the Task

Three questions, in order:

1. **Is it creative?** UI, design, and copywriting always go to the Claude lane, no matter how small. "Creative" means the output's quality is judged by look, feel, or voice: building or styling components, layout and visual direction, marketing copy, product copy, naming, microcopy, headlines. Mechanical text edits (fix a typo, update a version number in the README) are not copywriting — they route by scope and impact.
2. **What is the impact?** Impact is the cost of getting it wrong. High impact: touches production behavior, money, auth/security, data integrity, or anything public. Any high-impact task goes to Sol even if it is a one-line change — a one-line change to payment logic is small scope, high impact.
3. **What is the scope?** Scope is how much surface the task touches. Small: one file or one isolated function. Medium: a feature, module, or multi-file refactor.

When a task sits between two tiers, route it one tier up. A wrong upgrade costs a little money; a wrong downgrade costs quality where it hurts.

**Mixed tasks:** split them. "Build the settings page and wire it to the API" is two delegations — the page UI to Fable, the API wiring to the GPT tier its impact deserves. Don't send the whole thing to one lane because splitting feels like effort.

## Examples

- "Rename `getUser` to `fetchUser` across `src/utils/user.ts`" → small scope, low impact → `gpt-5.6-luna`
- "Write the headline and subcopy for the launch page hero" → copywriting → `claude-fable-5`
- "Refactor the retry logic in the payments worker" → touches money → high impact → `gpt-5.6-sol`, regardless of it being one file
- "Add pagination to the admin list view" → medium scope, internal surface → `gpt-5.6-terra`
- "Restyle the dashboard cards to match the new brand" → UI/design → `claude-fable-5`
- "Fable is down, need the pricing page built" → `claude-sonnet-5`; if that also fails, `claude-opus-4-8`

## Handling Unavailability

- **Claude lane:** encode the chain directly in the call — `--model claude-fable-5 --fallback-model claude-sonnet-5,claude-opus-4-8` (print mode). The harness steps down automatically when a model is overloaded or missing. Never route creative work to the GPT lane as a fallback; if all three Claude models fail, report the failure instead.
- **GPT lane:** model ids drift and availability varies by CLI version and account. If the assigned tier's id is rejected, probe for what works (see the comms skill reference) and pick the closest available OpenAI model — stepping up a tier when in doubt. If the task was high impact and no suitable model answers, report back rather than quietly downgrading.

## Delivery

When you delegate, state: the lane and model chosen, the one-line reason (creative / scope / impact), the effort level set, and any fallback that actually fired. If you split a mixed task, list each part with its route.
