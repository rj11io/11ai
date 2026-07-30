# Supabase setup reference

## Install the CLI

```bash
brew install supabase/tap/supabase
```

```bash
npm install --save-dev supabase
npx supabase --version
```

```bash
supabase --version
```

A project dev dependency pins the version for everyone, which matters because CLI behaviour changes between releases. Do not install globally with `npm install -g supabase` — it is unsupported and produces confusing failures.

Docker is required for the local stack:

```bash
docker info --format '{{.ServerVersion}}'
```

## Authenticate and initialize

```bash
supabase login
supabase init
```

`login` opens a browser and stores a personal access token in the CLI's own config. Never paste a token into the terminal.

`init` creates:

```text
supabase/
  config.toml
  migrations/
  seed.sql
```

Settings in `config.toml` worth knowing before starting:

```toml
project_id = "my-app"

[api]
port = 54321
schemas = ["public", "graphql_public"]

[db]
port = 54322
major_version = 15

[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["http://127.0.0.1:3000/**"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_confirmations = false
```

Two of these cause most local auth confusion. `site_url` and `additional_redirect_urls` must match the application's real local address, or an OAuth or magic-link redirect is rejected. And `db.major_version` should match the remote project's Postgres version — a mismatch lets a migration pass locally and fail on push.

## Link to a remote project

```bash
supabase projects list
supabase link --project-ref PROJECT_REF
```

Read the list and confirm the name before linking. After linking, these commands act on the **remote** project:

| Command | Target |
| --- | --- |
| `supabase db push` | remote |
| `supabase db diff --linked` | remote |
| `supabase db pull` | remote |
| `supabase functions deploy` | remote |
| `supabase secrets set` | remote |
| `supabase db reset` | local only |
| `supabase db diff` | local only |

The link is stored in `supabase/.temp/`, which should be ignored:

```text
supabase/.temp/
supabase/.branches/
```

## Start the local stack

```bash
supabase start
supabase status
```

First run pulls several container images and takes a few minutes. `status` prints:

```text
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJ...
service_role key: eyJ...
```

The local keys are fixed development values, identical across every Supabase project, so they are not secrets. The database password is literally `postgres`. Never carry these habits to a hosted project.

```bash
supabase stop
```

`supabase stop` keeps the local data. `supabase stop --no-backup` discards it, which is destructive and needs approval.

## Environment files

### Next.js

```text
# .env.local  (ignored)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

```text
# .env.example  (committed, no values)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The naming is the safety mechanism. Anything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle. The service role key has no prefix because it must never go there — it bypasses every row level security policy, so a copy in the browser exposes the whole database to anyone who opens developer tools.

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
grep -rn 'NEXT_PUBLIC_SUPABASE_SERVICE\|NEXT_PUBLIC.*SERVICE_ROLE' . --include='*.ts' --include='*.tsx' --include='.env*' 2>/dev/null
```

The second command should return nothing. Any hit is an exposure to report and rotate.

### Vite

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

A pure client application has no safe place for a service role key. If server-side work is needed, it belongs in an edge function or a separate server, not in the client build.

## Client factories

### Browser client

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server client, cookie-based sessions

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
            // called from a Server Component, where cookies cannot be set
          }
        },
      },
    }
  )
}
```

This client uses the **anon** key and the user's session, so row level security applies. That is what you want for anything acting on behalf of a user.

The `try` around `setAll` is required, not defensive noise: Server Components cannot set cookies, and the refresh path attempts to.

### Admin client, server only

```ts
// src/lib/supabase/admin.ts
import "server-only"
import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
```

The `server-only` import is the guard: importing this module from a client component becomes a build error rather than a silent leak. Use this client only for work that genuinely must bypass row level security — a webhook handler, an administrative script — and never as a way around a policy that is inconveniently strict.

## Generate types

```bash
supabase gen types typescript --local > src/database.types.ts
supabase gen types typescript --linked > src/database.types.ts
```

```ts
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/database.types"

export const supabase = createBrowserClient<Database>(url, key)
```

Add it as a script so it is regenerated rather than remembered:

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > src/database.types.ts"
  }
}
```

Stale types are worse than none: they describe columns that no longer exist and the compiler confirms code that will fail at runtime. Regenerate after every migration.

## Enable row level security immediately

```sql
alter table public.profiles enable row level security;
```

A table without row level security is fully readable and writable by anyone holding the anon key, which is published in the browser bundle. Enabling it with no policies denies everything, which is the correct starting point — then add policies deliberately.

Check the whole schema:

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r';
```

Any `false` in that output is a table exposed to the internet.

## Verify

```bash
supabase status
supabase migration list
npx tsc --noEmit
```

Then two checks in the running application:

1. A read through the anon client returns data or a policy denial — not a connection error.
2. A table with row level security enabled and no policy returns zero rows to the anon key.

The second is the one people skip, and it is the only one that proves the protection is actually on.
