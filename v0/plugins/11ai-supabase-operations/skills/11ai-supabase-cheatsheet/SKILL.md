---
name: 11ai-supabase-cheatsheet
description: "Answer quick Supabase questions with a compact reference for CLI commands, local stack control, migrations and database diffing, type generation, client query and filter syntax, auth calls, storage calls, edge function commands, and the key and URL differences between environments. Use when someone asks which Supabase CLI command or client call to use, or wants a fast lookup rather than a guided workflow."
---
# 11ai Supabase cheatsheet

A lookup surface for the Supabase CLI and client libraries. Give the command, name what it changes, and stop. For anything that migrates, deploys, or edits data, hand off to the matching operation skill.

## Project and local stack

```bash
supabase --version
supabase login
supabase init
supabase link --project-ref PROJECT_REF
supabase projects list
supabase start
supabase stop
supabase stop --no-backup
supabase status
```

`supabase start` runs the whole stack in Docker and prints the local URLs and keys. `supabase stop --no-backup` discards the local database, which is destructive.

## Migrations and schema

```bash
supabase migration new NAME
supabase migration list
supabase db diff -f NAME
supabase db diff --linked -f NAME
supabase db reset
supabase db push
supabase db pull
supabase db dump -f schema.sql
supabase db lint
```

`db reset` drops the local database and replays every migration plus seeds. `db push` applies pending migrations to the **linked remote** project — that one is production-facing.

## Types and generated code

```bash
supabase gen types typescript --local > src/database.types.ts
supabase gen types typescript --linked > src/database.types.ts
```

Regenerate after every schema change, or the types describe a database that no longer exists.

## Client queries

```ts
const { data, error } = await supabase
  .from("users")
  .select("id, email, profile(name)")
  .eq("active", true)
  .order("created_at", { ascending: false })
  .range(0, 19)

await supabase.from("users").insert({ email: "a@example.com" }).select().single()
await supabase.from("users").update({ active: false }).eq("id", id).select()
await supabase.from("users").upsert({ id, email }, { onConflict: "id" })
await supabase.from("users").delete().eq("id", id)
await supabase.from("users").select("*", { count: "exact", head: true })
await supabase.rpc("my_function", { arg: 1 })
```

The client never throws. Check `error` on every call — an ignored `error` reads as an empty result.

## Filters

```ts
.eq("col", v)      .neq("col", v)
.gt("col", v)      .gte("col", v)
.lt("col", v)      .lte("col", v)
.like("col", "%x%")   .ilike("col", "%x%")
.is("col", null)   .in("col", [1, 2])
.contains("tags", ["a"])
.or("a.eq.1,b.eq.2")
.not("col", "is", null)
.limit(10)         .single()      .maybeSingle()
```

`.single()` errors when the result is not exactly one row; `.maybeSingle()` allows zero.

## Auth

```ts
await supabase.auth.signUp({ email, password })
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signInWithOAuth({ provider: "github" })
await supabase.auth.signInWithOtp({ email })
await supabase.auth.signOut()
await supabase.auth.getUser()
await supabase.auth.getSession()
supabase.auth.onAuthStateChange((event, session) => {})
```

On a server, use `getUser()` rather than `getSession()`: it validates the token with the auth server, while `getSession()` trusts what is in storage.

## Storage

```ts
await supabase.storage.from("bucket").upload("path/file.png", file)
await supabase.storage.from("bucket").download("path/file.png")
await supabase.storage.from("bucket").remove(["path/file.png"])
await supabase.storage.from("bucket").list("path")
supabase.storage.from("bucket").getPublicUrl("path/file.png")
await supabase.storage.from("bucket").createSignedUrl("path/file.png", 3600)
```

`getPublicUrl` only works for a public bucket. For a private one use a signed URL.

## Edge functions

```bash
supabase functions new NAME
supabase functions serve NAME
supabase functions deploy NAME
supabase functions delete NAME
supabase secrets list
supabase secrets set KEY=VALUE
```

## Keys and URLs

| Value | Where it belongs |
| --- | --- |
| Project URL | Anywhere, including the browser |
| Anon or publishable key | Browser. Row level security is what protects the data |
| Service role or secret key | Server only. It bypasses row level security entirely |
| Database password | Connection strings and the CLI only |

A service role key in client code exposes every row in the database. That is the single most damaging mistake available here.

## Answer format

Lead with the command or call. Add one line on what it changes and whether it touches the linked remote project rather than the local stack. Name the operation skill when the task goes beyond a lookup: migrations to `11ai-supabase-migrations`, policies to `11ai-supabase-rls`, data and schema to `11ai-supabase-database`, and failures to `11ai-supabase-troubleshooting`.
