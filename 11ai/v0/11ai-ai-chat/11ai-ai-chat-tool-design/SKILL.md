---
name: 11ai-ai-chat-tool-design
description: "Design AI SDK tool sets that ground a chat assistant in a dataset — search/detail tool pairs, Zod schemas, output projection, and a token-lean \"mini\" tool-set variant. Use when adding or changing tools for an AI chat or agent endpoint."
---

# Tool design for grounded AI chat

Tools are how the assistant earns the right to answer. The system prompt enforces it ("Always use tools before answering... Only answer with information supported by tool results"), but the tool *design* decides whether a small model can actually use them within its context budget.

## Core principles

1. **Search → detail pairs per entity type.** Search tools take a free-text query and return compact projections *with ids*; detail tools take an id and return one record. Never one mega-tool.
2. **Project, never dump.** Tool `execute` returns hand-picked fields, not raw records. Every field you return is tokens the model must read on every subsequent step.
3. **Cap every list.** Page sizes of 5–8 for search; `take(n)` on every nested array in detail results.
4. **Simple input schemas.** One required `z.string()` beats five optional filters — small models fumble complex schemas. Add `.describe()` only where the name is ambiguous.
5. **Bound the loop.** `stopWhen: stepCountIs(6)` in `streamText` — enough for search → detail → compare flows, prevents runaway loops.

## The shape

```ts
import { tool } from "ai"
import { z } from "zod"

export const chatTools = {
  searchProducts: tool({
    description:
      "Search product records by name, SKU, category, status, tags, and vendor.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      const result = queryProducts({ q: query, page: 1, pageSize: 8 })
      return {
        total: result.total,
        products: result.items.map((p) => ({
          sku: p.sku,                  // the id the detail tool needs
          name: p.name,
          status: p.status,
          category: p.category,
          openTickets: p.metrics.openTicketCount,
        })),
      }
    },
  }),
  getProductDetails: tool({
    description: "Get a compact product summary by SKU.",
    inputSchema: z.object({ sku: z.string() }),
    execute: async ({ sku }) => summarizeProduct(sku),
  }),
  getOverviewKpis: tool({
    description: "Get the top-level KPI counts.",
    inputSchema: z.object({}),  // zero-arg tools are fine — give the model a cheap orientation call
    execute: async () => getOverview().kpis,
  }),
}
```

Tool descriptions should enumerate *what fields are searchable* — that's what the model uses to pick a tool and phrase its query.

## The mini tool-set pattern

Maintain two tool sets with **identical names and input schemas** but different output shaping, switched by an env flag:

```ts
const AI_MINI = process.env.NEXT_PUBLIC_AI_MINI === "true"
// in the route:
tools: AI_MINI ? chatMiniTools : chatTools,
```

Identical schemas mean prompts, evals, and the client are unaffected by the switch — only token spend changes.

The mini variant applies a summarizer to detail results instead of returning the record:

```ts
const SEARCH_RESULT_LIMIT = 5

function take<T extends readonly unknown[]>(
  items: T | null | undefined,
  limit: number
): T[number][] {
  return (items ?? []).slice(0, limit) as T[number][]
}

function summarizeProduct(sku: string) {
  const product = getProduct(sku)
  if (!product) return null

  return {
    sku: product.sku,
    name: product.name,
    status: product.status,
    category: product.category,
    statusFlags: {
      hasReviews: product.derived.hasReviews,
      hasOpenIncidents: product.derived.hasOpenIncidents,
      hasPendingRecalls: product.derived.hasPendingRecalls,
    },
    metrics: {
      orders: product.metrics.orderCount,
      activeVariants: product.metrics.activeVariantCount,
      incidents: product.metrics.incidentCount,
    },
    tags: take(product.tags, 4),
    topVariants: take(product.variants, 5).map((v) => ({
      id: v.id, name: v.name, size: v.size, active: v.active,
    })),
    recentOrders: take(product.activity?.recentOrders, 5).map((o) => ({
      date: o.date, channel: o.channel, quantity: o.quantity,
    })),
    incidents: take(product.incidents, 5).map((i) => i.message),
  }
}
```

Mini-variant rules:

- Search page size drops (8 → 5).
- Every nested array gets a `take()` cap (variants 5, recent orders 5, tags 4, attachments 3...).
- Booleans/counts replace lists where possible (`hasReviews` instead of the review items; `incidentCount` plus the top 5 messages).
- Summaries still include child ids so the model can drill down with the detail tools.
- Return `null` for not-found — the model handles it honestly; don't throw.

**Recommendation: make the summarized shape the default.** A detail tool that returns a full raw record is the anti-pattern the mini set exists to fix — keep a "full" variant only if something genuinely needs exhaustive records.

## System prompt contract

The tools only ground the chat if the prompt demands it:

```
Always use tools before answering product, order, or customer questions.
Only answer with information supported by tool results.
Be concise, practical, and specific.
```

Optionally pin demo behavior ("If asked to suggest a record to inspect, suggest <example A> and <example B>") so hint prompts in the UI always succeed.
