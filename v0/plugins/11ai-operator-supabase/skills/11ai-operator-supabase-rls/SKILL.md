---
name: 11ai-operator-supabase-rls
description: "Write and verify Postgres row level security policies in Supabase, covering enabling security per table, separate policies per command, using and check expressions, the auth helper functions, joins and membership checks, performance of policy predicates, security definer helper functions, and testing a policy from the perspective of an anonymous, wrong, and correct user. Use when a table must be protected, when a query returns no rows or too many, or when a policy must be reviewed before shipping."
---
# 11ai supabase rls

Version baseline: Supabase CLI v2, supabase-js v2, and the current CLI local Postgres 17 line. Inspect the linked project, installed client patch, CLI patch, and remote Postgres version before changing configuration or migrations.

Row level security is the only thing standing between a Supabase table and the internet, because the anon key is published in the browser. Establish the current state per table before writing anything, and verify every policy by trying to break it — a policy that has only been tested with the correct user has not been tested.

## Inspect the current state

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

Read two separate facts. `relrowsecurity` false means the table is wide open to anyone with the anon key — report that immediately. And security enabled with **no** policies denies everything, which is safe but is often mistaken for a broken query.

## Enable, then add one policy per command

```sql
alter table public.posts enable row level security;
```

Enabling denies all access by default. Add access back deliberately, one command at a time:

```sql
create policy "posts_select_own"
on public.posts for select
to authenticated
using (author_id = (select auth.uid()));

create policy "posts_insert_own"
on public.posts for insert
to authenticated
with check (author_id = (select auth.uid()));

create policy "posts_update_own"
on public.posts for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

create policy "posts_delete_own"
on public.posts for delete
to authenticated
using (author_id = (select auth.uid()));
```

The distinction that causes most bugs: `using` filters the rows a statement may see or touch, and `with check` validates the rows it tries to write. An `update` policy with only `using` lets a user change a row they own into a row owned by someone else. Give `update` both.

Name the role with `to authenticated` or `to anon`. A policy with no role applies to `public`, which includes anonymous callers.

Write `(select auth.uid())` rather than a bare `auth.uid()`. Wrapping it in a select lets Postgres evaluate it once per statement instead of once per row, which is the difference between a fast query and a table scan on a large table.

## Membership, joins, and helper functions

For access through a join, keep the policy predicate cheap and indexed:

```sql
create policy "posts_select_team"
on public.posts for select
to authenticated
using (
  team_id in (
    select team_id from public.team_members
    where user_id = (select auth.uid())
  )
);
```

Index the columns a policy reads, on both sides — `team_members(user_id, team_id)` and `posts(team_id)` here. A policy predicate runs for every candidate row, so an unindexed lookup inside it turns every query on the table slow.

When a policy needs to read a table that itself has row level security, the nested read is also filtered and the policy can silently return nothing, or recurse. Use a `security definer` helper for that case, carefully:

```sql
create or replace function public.is_team_member(check_team_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = (select auth.uid())
  );
$$;

create policy "posts_select_team"
on public.posts for select
to authenticated
using (public.is_team_member(team_id));
```

`security definer` bypasses row level security inside the function, which is exactly why it must take the identity from `auth.uid()` internally and never from a parameter. A function that accepts a user id and trusts it is an authorization bypass with extra steps. `set search_path = ''` is required to prevent a search-path attack, and `stable` lets the planner cache the result within a statement.

Reading the current user's claims:

```sql
(select auth.uid())
(select auth.jwt() ->> 'email')
(select auth.jwt() -> 'app_metadata' ->> 'role')
```

Read roles from `app_metadata`, never `user_metadata`. `user_metadata` is writable by the user, so a policy trusting it lets anyone grant themselves any role.

## Verify by trying to break it

Test three identities for every policy: anonymous, an authenticated user who should **not** have access, and one who should.

```sql
begin;
select set_config('request.jwt.claims', '{"sub":"USER_A_UUID","role":"authenticated"}', true);
set local role authenticated;

select count(*) from public.posts;

rollback;
```

```sql
begin;
set local role anon;
select count(*) from public.posts;
rollback;
```

Run the middle case deliberately: as user B, confirm a `select` returns zero of user A's rows, an `update` of user A's row changes nothing, and an `insert` claiming `author_id = USER_A` is rejected. That last one is what proves `with check` is doing its job.

Also confirm the service role still bypasses everything as expected, and that no client code path uses it — a service role key reachable from the browser makes every policy here irrelevant.

## Report

Policies are schema. Put every statement in a migration file rather than only in Studio, or it exists in one environment and disappears on the next reset. Hand the file to `11ai-operator-supabase-migrations`.

Report each table's security state, the policies by command and role, the expressions used, which indexes support the predicates, and the results of all three identity tests including the negative ones. Flag any table with security disabled, any policy reading `user_metadata`, any `security definer` function taking an identity as a parameter, and any service role usage reachable from client code.
