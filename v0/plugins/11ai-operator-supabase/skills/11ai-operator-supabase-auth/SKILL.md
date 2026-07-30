---
name: 11ai-operator-supabase-auth
description: "Configure and debug Supabase authentication, covering email and password sign-in, magic links, OAuth providers, redirect URL allow lists, session cookies and server-side refresh, validating a user on the server, the auth.users table and a linked profiles row, app metadata versus user metadata, email templates, and administrative user operations. Use when sign-in must be added or repaired, when a redirect is rejected, when a session is lost on refresh, or when a user record must be created or inspected."
---
# 11ai supabase auth

Two things decide whether Supabase auth works: the redirect allow list, and where the session is stored and refreshed. Establish both before changing code, because a rejected redirect and a lost session produce nearly identical symptoms and neither error names the real cause.

## Inspect first

```bash
supabase status
grep -c 'SUPABASE_URL\|SUPABASE_ANON_KEY' .env.local
grep -n 'site_url\|additional_redirect_urls\|enable_confirmations' supabase/config.toml
grep -rn 'getSession\|getUser' --include='*.ts' --include='*.tsx' src/ app/ 2>/dev/null | head -20
```

```sql
select id, email, created_at, last_sign_in_at, confirmed_at, raw_app_meta_data
from auth.users
order by created_at desc
limit 10;
```

Never select `encrypted_password` or a refresh token. Read the metadata columns to see what a session's claims will contain.

Check which provider is configured and, in the hosted dashboard, which redirect URLs are allowed. Locally these come from `config.toml`; on a hosted project they are dashboard settings and the two are separate lists that must both be correct.

## Configure sign-in

For local development, the URLs must match the application's real address:

```toml
[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["http://127.0.0.1:3000/**"]

[auth.email]
enable_confirmations = false
```

`127.0.0.1` and `localhost` are different origins to this allow list. A mismatch produces a redirect rejection that reads as a provider misconfiguration.

Turning off email confirmations locally is convenient; leaving it off in production means anyone can register with an address they do not control.

```ts
await supabase.auth.signInWithPassword({ email, password })

await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${origin}/auth/callback` },
})

await supabase.auth.signInWithOAuth({
  provider: "github",
  options: { redirectTo: `${origin}/auth/callback` },
})

await supabase.auth.signOut()
```

Every one of these returns `{ data, error }` and none of them throws. An unchecked `error` looks like a silent failure to sign in.

For a hosted OAuth provider, three URLs must agree: the provider's callback, the Supabase project's callback, and the application's `redirectTo`. A mismatch in any one produces a generic failure.

## Sessions and validating a user

For a server-rendered application, the session lives in cookies and must be refreshed by middleware — without that, the token expires and the user is signed out on the next navigation:

```ts
// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

Two details are load-bearing. The `getUser()` call is what triggers the refresh — remove it and the middleware does nothing useful. And the response must be rebuilt after setting cookies, or the refreshed token never reaches the browser.

On the server, always validate rather than trust:

```ts
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) redirect("/sign-in")
```

`getUser()` verifies the token with the auth server. `getSession()` reads whatever is in cookie storage and does not verify it, so it must never be the basis of a server-side authorization decision. Use `getSession()` only in the browser, where the session is the user's own.

## Users, metadata, and administrative operations

`auth.users` is managed by Supabase. Keep application data in your own table, linked by id:

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
```

Create the row with a trigger so a profile always exists:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

The `on conflict do nothing` matters: without it a retried sign-up fails at the trigger and the user cannot register.

The metadata distinction is a security boundary:

- **`user_metadata`** is writable by the user through `updateUser`. Never read a role or an entitlement from it — a user can grant themselves anything.
- **`app_metadata`** is writable only with the service role key. Roles, plans, and permissions belong here, and row level security policies should read from here.

```ts
import "server-only"

await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: "admin" },
})

await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 50 })
await supabaseAdmin.auth.admin.deleteUser(userId)
```

These require the service role key and must run server-side only. `deleteUser` is irreversible and cascades to rows referencing the user — confirm the specific user id and get approval.

## Verify

Test the whole loop, not the call:

1. Sign in, then reload the page and navigate — the session must survive both. Losing it on reload is the middleware; losing it after an hour is the refresh.
2. Sign out and confirm a protected route redirects.
3. Request a protected server route with no cookie and confirm it refuses.
4. Confirm a user cannot read another user's rows — that is `11ai-operator-supabase-rls`, and auth without it protects nothing.
5. For each provider, complete a real round trip rather than only checking that the redirect starts.

## Report

State the providers configured, the redirect URLs on both the local and hosted side, where the session is stored and what refreshes it, which calls validate on the server, the profile table and trigger if added, and the verification results including the signed-out and cross-user checks. Never print tokens, passwords, or the contents of an environment file. Flag any server-side authorization based on `getSession()`, any role read from `user_metadata`, and any admin call reachable from client code.
