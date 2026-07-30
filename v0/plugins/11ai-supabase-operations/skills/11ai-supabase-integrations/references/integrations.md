# Supabase integrations reference

## Three clients, three identities

| Client | Key | Row level security | Where it may run |
| --- | --- | --- | --- |
| Browser | anon | applies, as the signed-in user | anywhere |
| Server, cookie session | anon | applies, as the signed-in user | server |
| Admin | service role | **bypassed** | server only |

Getting this table wrong is the whole risk surface. An admin client imported into a component ships the service role key to the browser and exposes every row in the database.

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Browser

```ts
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/database.types"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server, reading the user's session

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/database.types"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies; middleware handles refresh
          }
        },
      },
    }
  )
}
```

Create this per request. Caching it across requests leaks one user's session to another — the most serious bug available in this file.

### Admin, guarded

```ts
// lib/supabase/admin.ts
import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/database.types"

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
```

The `server-only` import turns a mistaken client import into a build failure. `persistSession: false` stops it writing a session anywhere.

```bash
grep -rn 'SERVICE_ROLE' --include='*.tsx' app/ components/ 2>/dev/null
```

That should return nothing.

## Middleware for session refresh

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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

Two things break this if changed: removing the `getUser()` call, which is what performs the refresh, and returning a response built before the cookies were set, which drops the refreshed token.

## Other frameworks

### Vite or a single-page application

```ts
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

There is no safe place for a service role key in a purely client-side build. Put privileged work in an edge function.

### A Node server

```ts
import { createClient } from "@supabase/supabase-js"

export function clientForToken(accessToken: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })
}
```

Passing the caller's token is what makes row level security apply as that user. Validate it first with `getUser()`; do not trust a user id from the request body.

## An ORM alongside the client

The critical fact: an ORM connects to Postgres as a **database user**, so row level security does not filter its queries. Every access check must be in application code.

```bash
npm install prisma @prisma/client
```

```text
# .env  (ignored)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Two connection strings, and both are needed. Port 6543 is the transaction-mode pooler for application queries; port 5432 is a direct connection for migrations and introspection, which the pooler cannot support. `pgbouncer=true` disables prepared statements, which transaction-mode pooling cannot hold.

Decide one schema owner:

- **Supabase migrations own the schema.** Use `prisma db pull` to introspect and never `prisma migrate`. This is the better default, because policies, triggers, and storage rules live in SQL migrations anyway.
- **The ORM owns the schema.** Then policies and triggers still need SQL migrations, so you have two systems regardless — usually not worth it.

```bash
npx prisma db pull
npx prisma generate
```

Drizzle follows the same rules:

```ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client)
```

`prepare: false` for the same pooling reason.

Use the ORM for server-side work where you enforce access explicitly, and the Supabase client for anything acting as a user. Mixing them without that rule is how a query returns rows a user should never see.

## Realtime

```sql
alter publication supabase_realtime add table public.messages;
```

```ts
const channel = supabase
  .channel("messages-room-1")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "messages", filter: "room_id=eq.1" },
    (payload) => append(payload.new)
  )
  .subscribe((status) => {
    if (status === "CHANNEL_ERROR") console.error("realtime failed")
  })

// on unmount
supabase.removeChannel(channel)
```

Points that matter:

- A table must be added to the publication or nothing is broadcast. This is the usual cause of a subscription that connects and receives nothing.
- Row level security applies to realtime for authenticated subscribers, so a user receives only changes they could read. Verify it as a second user rather than assuming.
- `filter` is evaluated server-side; filtering in the callback still ships every row to every client.
- Always remove the channel on unmount. Leaked channels accumulate and hit the connection limit.
- `DELETE` payloads carry only the primary key unless replica identity is set to full.
- Realtime is not a durable queue. A client offline during a change never receives it, so reconcile with a fetch on reconnect.

## Database webhooks

A trigger calling an external endpoint on a data change:

```sql
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform extensions.net.http_post(
    url := 'https://api.example.com/hooks/order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', current_setting('app.webhook_secret', true)
    ),
    body := jsonb_build_object('id', new.id, 'total', new.total)
  );
  return new;
end;
$$;

create trigger orders_created
after insert on public.orders
for each row execute function public.notify_order_created();
```

`pg_net` sends asynchronously, so the insert is not blocked by a slow receiver — and equally, a failed call does not roll back the insert and there is no retry. If delivery must be guaranteed, write to an outbox table and have a worker drain it.

Do not embed the secret in the function body. Set it as a database setting and read it with `current_setting`, so it is not visible in the function definition to anyone who can read the schema.

## Pipelines

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - run: supabase start
      - run: supabase db reset
      - run: supabase gen types typescript --local > src/database.types.ts
      - run: git diff --exit-code src/database.types.ts

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ env.SUPABASE_ANON_KEY }}

      - if: always()
        run: supabase stop
```

What each step buys:

- `supabase db reset` replays every migration from nothing, which is the only way to prove the chain works for a fresh environment.
- `git diff --exit-code` on the generated types fails the build when someone changed the schema and did not regenerate. Stale types are worse than none.
- The local anon key is a fixed development value, so it is not a secret here.
- `if: always()` on the stop step releases the containers even when tests fail.

For a deploy step, push migrations only from the main branch, with the access token and project reference as secrets:

```yaml
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

This applies schema changes to a live project. Gate it on the default branch and on a passing test job.

## Third-party auth providers

Supabase can accept tokens issued by an external identity provider, configured per project. The application then passes that token instead of a Supabase session:

```ts
const supabase = createClient(url, anonKey, {
  accessToken: async () => await getTokenFromProvider(),
})
```

Row level security policies read the claims from that token, so `auth.uid()` maps to whatever the provider puts in `sub`. Confirm the claim shape against what the policies expect before wiring it; a mismatch makes every policy silently deny.
