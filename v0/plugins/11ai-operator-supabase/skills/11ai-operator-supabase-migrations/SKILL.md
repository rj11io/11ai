---
name: 11ai-operator-supabase-migrations
description: "Create, review, and apply Supabase migrations, covering handwritten migration files, generating one from a schema diff, local reset and replay, seed data, remote push and its approval boundary, drift between local and remote, repairing migration history, and safe patterns for destructive or long-running schema changes. Use when the schema must change, when a Studio change needs capturing as a file, when local and remote have diverged, or before pushing anything to a linked project."
---
# 11ai supabase migrations

Version baseline: Supabase CLI v2, supabase-js v2, and the current CLI local Postgres 17 line. Inspect the linked project, installed client patch, CLI patch, and remote Postgres version before changing configuration or migrations.

`supabase db push` applies migrations to the **linked remote project**, so it is a production-facing command whenever production is linked. Establish the link and the local-versus-remote state before anything else, and treat a push as a change needing explicit approval for that project.

## Establish state on both sides

```bash
supabase migration list
supabase migration list --linked
cat supabase/.temp/project-ref 2>/dev/null || echo "not linked"
supabase projects list
```

`supabase migration list` shows local and remote applied versions side by side. Read it as the answer to one question: is there anything applied on one side and not the other. That is drift, and pushing over it fails or produces a schema nobody described.

Confirm the linked project's name, not just its reference. A push to the wrong project is not recoverable by rerunning it.

## Create a migration

Two routes, and the choice matters:

```bash
supabase migration new add_users_archived
```

Write the SQL by hand into the generated file. This is the better route: the file says exactly what was intended, in the order intended, with the guards you chose.

```bash
supabase db diff -f add_users_archived
supabase db diff --linked -f capture_studio_changes
```

`db diff` generates SQL from the difference between the current schema and the migrations. Use it to capture changes made through Studio, then **read and edit the output** before committing it. Generated diffs routinely include unrelated noise, reorder statements, and express a rename as a drop plus an add — which loses the column's data.

```sql
-- supabase/migrations/20260729120000_add_users_archived.sql
alter table public.users
  add column if not exists archived timestamptz;

create index if not exists users_archived_idx
  on public.users (archived)
  where archived is null;

alter table public.users enable row level security;
```

Write migrations that are safe to replay: `if not exists`, `if exists`, `create or replace`. A migration that fails halfway on a second run blocks every later one.

Every new table needs row level security enabled in the same migration that creates it. A table shipped without it is readable by anyone holding the published anon key.

## Test locally before pushing

```bash
supabase db reset
supabase migration list
supabase db lint
psql "$LOCAL_DB_URL" -c '\d public.users'
```

`supabase db reset` drops the local database and replays every migration plus `seed.sql`. It is destructive locally and safe by design — but it is the only way to prove the migration chain works from nothing, which is what a fresh environment and the remote project will do.

Run it twice. A migration that only works against an already-migrated database is a migration that will fail for the next contributor.

Keep seed data in `supabase/seed.sql`, idempotent, and free of real user data:

```sql
insert into public.plans (id, name) values ('free', 'Free')
on conflict (id) do nothing;
```

Then regenerate types and typecheck, because a schema change that breaks the application should fail here rather than in production:

```bash
supabase gen types typescript --local > src/database.types.ts
npx tsc --noEmit
```

## Push deliberately

```bash
supabase db push --dry-run
supabase db push
```

Before pushing, confirm all of: which project is linked and its name, the exact migrations that will apply, whether any of them is destructive, and whether the change is backward compatible with the currently deployed application.

Order matters for a live application. Deploy in expand-then-contract steps: add the new column, ship code that writes both, backfill, ship code that reads the new one, and only then drop the old column in a later migration. A migration that drops or renames a column in one step breaks every running instance still using it.

For destructive or long-running changes:

- A `drop column` or `drop table` is unrecoverable without a backup. Take one, and get approval naming the object.
- A rename loses data if expressed as drop plus add. Use `alter table ... rename column`.
- Adding a `not null` column to a populated table requires a default or a backfill first.
- Creating an index on a large table locks writes. Use `create index concurrently`, which cannot run inside a transaction — so it belongs in its own migration file.

Never edit a migration that has already been applied to the remote project. Add a new one. Editing an applied file makes local history disagree with what the database actually contains.

## Verify and repair drift

```bash
supabase migration list --linked
supabase db diff --linked
psql "$REMOTE_DB_URL" -c '\d public.users'
```

An empty `db diff --linked` after a push is the cleanest proof that the remote schema matches the migrations.

When history is genuinely out of step — a migration applied by hand, or a file removed after being applied:

```bash
supabase migration repair --status applied VERSION
supabase migration repair --status reverted VERSION
```

`migration repair` rewrites the tracking table without changing the schema. It resolves bookkeeping, and it will hide a real difference if used to silence an error you have not understood. Inspect the actual schema first and get approval before running it against a remote project.

## Report

State the linked project and its name, the migration files created or changed, whether the local reset replayed cleanly from nothing, the dry-run output, exactly which migrations were pushed and to where, any destructive statement and whether a backup exists, the regenerated types and typecheck result, and the post-push diff. Call out any change that is not backward compatible with the deployed application, and anything still needing a follow-up migration.
