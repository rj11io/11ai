---
name: 11ai-operator-supabase-database
description: "Query and change Postgres inside a Supabase project, covering psql and Studio access, schema inspection, scoped reads and writes, transactions, database functions and triggers, extensions, generated columns, explain plans, and the difference between acting through the client and acting as a superuser. Use when data must be read or corrected, when a query is slow, when a database function or trigger is needed, or when schema details must be inspected."
---
# 11ai supabase database

Version baseline: Supabase CLI v2, supabase-js v2, and the current CLI local Postgres 17 line. Inspect the linked project, installed client patch, CLI patch, and remote Postgres version before changing configuration or migrations.

Confirm which database a statement will reach before running it: the local Docker stack or the linked remote project. Reads can run once the target is known; a write needs a scoped filter and a row count, and a schema change belongs in a migration rather than a live statement.

## Inspect first

```bash
supabase status
psql "$LOCAL_DB_URL" -c '\dt public.*'
psql "$LOCAL_DB_URL" -c '\d public.users'
```

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r';

select indexname, indexdef from pg_indexes where schemaname = 'public';
```

Read the column types, nullability, defaults, and — importantly — whether row level security is on. A table with it off is readable by anyone holding the anon key, which is published in the browser.

Take the connection string from `supabase status` for local work. For the remote database, use the pooled connection string from the project settings and never paste a password into the terminal:

```bash
grep -c 'DATABASE_URL' .env.local
psql "$DATABASE_URL" -c 'select current_database(), current_user, version()'
```

That last query is the cheapest way to confirm you are where you think you are.

## Read with intent

```sql
select id, email from public.users where active = true order by created_at desc limit 20;

select count(*) from public.users where active = true;
```

Select the columns needed, not `*`, and always bound a read with `limit`. Do not dump a whole table into this transcript — it may hold personal data or tokens. Report counts and redacted samples.

## Write with a scoped filter

```sql
select count(*) from public.users where archived is null and last_seen < now() - interval '90 days';

begin;
update public.users
set archived = now()
where archived is null and last_seen < now() - interval '90 days';
-- read the reported row count, then decide
commit;
```

The sequence is count, show, approve, execute — and for anything touching more than one row, inside a transaction so `rollback` is available until the count is confirmed.

```sql
delete from public.sessions where expires_at < now();
```

Rules that prevent the losses:

- Run the `select count(*)` with the exact same `where` clause first, and show the number.
- Never run an `update` or `delete` without a `where` clause. Postgres will happily rewrite every row.
- Get explicit approval for the exact filter on the exact database when the user did not ask for that write.
- Prefer a soft delete — setting a timestamp — over a hard one where the schema allows it.

## Functions, triggers, and extensions

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();
```

For a function called from the client with `rpc`, set the search path explicitly and choose the security mode deliberately:

```sql
create or replace function public.get_my_orders()
returns setof public.orders
language sql
security invoker
set search_path = ''
as $$
  select * from public.orders where user_id = auth.uid();
$$;
```

`security invoker` runs as the caller, so row level security still applies — this is the default you want. `security definer` runs as the function owner and **bypasses** row level security, so it must be used only when that is the deliberate intent, and always with `set search_path = ''` to prevent a search-path attack.

Every schema object created here belongs in a migration file, not only in a live statement. A function created directly in Studio exists in one environment and vanishes on the next `db reset`. Hand it to `11ai-operator-supabase-migrations`.

```sql
create extension if not exists pg_trgm;
select extname from pg_extension;
```

Extensions belong in the `extensions` schema on Supabase, and adding one is a schema change that needs a migration.

## Verify and report

```sql
explain (analyze, buffers) select ... ;
```

```sql
select id, email, archived from public.users where id = 'SPECIFIC_ID';
```

After a write, verify with a targeted read of the affected rows rather than trusting the reported count. After a schema change, re-inspect the table and regenerate types:

```bash
supabase gen types typescript --local > src/database.types.ts
```

For a slow query, read the plan before adding anything. A sequential scan on a large table usually wants an index; add it through `11ai-operator-supabase-migrations` so it exists in every environment rather than only this one.

Report which database was targeted, the exact statements run, the row counts before and after, whether it ran in a transaction, what was verified, and whether any schema change still needs capturing as a migration. Never print connection strings, passwords, or personal data.
