---
name: 11ai-supabase-integrations
description: "Connect Supabase to the systems around it, covering client libraries per framework and rendering model, server-side session handling, direct Postgres access from an ORM alongside the client, realtime subscriptions, database webhooks to external services, continuous integration with a throwaway database, branch environments, and third-party auth providers. Use when an application must talk to Supabase, when an ORM must coexist with the client, when realtime updates are needed, or when a pipeline must run against a real schema."
---
# 11ai supabase integrations

The question that decides every Supabase integration is which identity the connection carries: the anonymous key with the user's session, so row level security applies, or the service role key, which bypasses it entirely. Get that wrong and either nothing works or everything is exposed. Settle it before writing a line.

## Name the seam

- **Client libraries** — a browser client, a server client that reads the user's session from cookies, and an admin client that must never reach the browser. Three different objects, not one.
- **ORM alongside the client** — Prisma or Drizzle connecting directly to Postgres, which bypasses row level security because it authenticates as a database user rather than as an application user.
- **Realtime** — subscriptions to database changes, which respect row level security only when explicitly enabled for the table.
- **Database webhooks** — Postgres triggers calling an external endpoint on insert, update, or delete.
- **Pipelines** — a throwaway local stack or a branch database, so tests run against the real schema.
- **Third-party auth** — an external identity provider issuing tokens that Supabase accepts.

## Wire one deliberately

1. Inspect first: which client factories exist, whether an ORM is already connected and as which user, which tables have realtime enabled, and what the pipeline does today.
2. Default to the anon key plus the user's session for anything acting on behalf of a user. Reach for the service role key only for work that genuinely must bypass policies — a webhook handler, an administrative job — and put it behind a server-only module so importing it from a component is a build error.
3. Keep one owner for schema. If an ORM manages migrations, Supabase migrations must not, and the reverse. Two owners produce permanent drift.
4. Remember that an ORM connecting directly to Postgres is not filtered by row level security. Every query it makes must enforce access itself, in application code. That is the single most common security gap in a Supabase project with an ORM.
5. Use the pooled connection string for anything serverless, and keep one client per process rather than one per request.
6. Read [references/integrations.md](references/integrations.md) for the per-framework client factories, the ORM coexistence patterns, realtime setup, database webhooks, and the pipeline configuration.

## Verify end to end

- Sign in as one user and confirm a read returns only that user's rows through the client; then confirm the same query through the ORM returns everything, so the gap is understood and handled.
- Reload and navigate after signing in — a session that survives one but not the other is the cookie refresh path.
- Subscribe to a realtime channel, change a row as another user, and confirm the subscriber sees only what its policies allow.
- Trigger a database webhook and confirm the receiver got exactly one call, and that a retry does not double-apply.
- Run the pipeline and confirm it reset a throwaway database, applied every migration from nothing, and would fail on a broken migration.

## Report

State the seam wired, which client or connection each code path uses and therefore whose permissions apply, where the service role key lives and what guards it, who owns schema migrations, the connection mode and pool size, the files changed, and the verification evidence including the cross-user checks. Never print keys, connection strings, or webhook secrets. Flag every path that bypasses row level security and say what enforces access there instead.
