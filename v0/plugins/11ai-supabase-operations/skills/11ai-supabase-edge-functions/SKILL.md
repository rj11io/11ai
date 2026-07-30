---
name: 11ai-supabase-edge-functions
description: "Write, run, and deploy Supabase edge functions, covering the Deno runtime and imports, local serving with secrets, request handling and CORS, calling the database with the caller's session or the service role, verifying the JSON Web Token or accepting unauthenticated webhooks, scheduling, logs, and deployment to a linked project. Use when a server-side endpoint is needed, when a function fails locally or after deploy, or when a webhook receiver must be built."
---
# 11ai supabase edge functions

Functions run on Deno, not Node, and `supabase functions deploy` publishes to the **linked remote project**. Establish both facts before writing: Node built-ins and `node_modules` are not available the way they are elsewhere, and a deploy is an externally visible change.

## Inspect first

```bash
supabase status
ls -la supabase/functions/
cat supabase/functions/NAME/index.ts 2>/dev/null | head -30
supabase secrets list
grep -n 'verify_jwt' supabase/config.toml
```

`supabase secrets list` prints names and digests, not values. Read it to see what the deployed function can access; a function failing only in production is usually a secret set locally and never set remotely.

## Write the function

```bash
supabase functions new hello
```

```ts
// supabase/functions/hello/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data, error } = await supabase.from("posts").select("id").limit(10)
    if (error) throw error

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("hello failed", error)
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
```

The decisions in that code:

- **Imports come from a URL or `jsr:`/`npm:` specifier**, not from `node_modules`. Pin the version; an unpinned import can change under you between deploys.
- **Passing the caller's `Authorization` header into the client** is what makes row level security apply as that user. Without it the function acts anonymously and reads nothing.
- **`getUser()` validates the token.** Decoding it without verification, or trusting a user id from the request body, is an authorization bypass.
- **Handle `OPTIONS`** or every browser call fails preflight. Set the origin from configuration rather than `*` when the endpoint takes credentials.
- **Log the real error, return a generic one.** The response body reaches the caller; stack traces and database messages should not.

Use the service role key only when the work genuinely must bypass row level security, and never accept an identity from the request when using it:

```ts
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them as secrets yourself.

## Run locally

```bash
supabase functions serve hello
supabase functions serve hello --no-verify-jwt
supabase functions serve hello --env-file supabase/functions/.env.local
```

```bash
curl -i http://127.0.0.1:54321/functions/v1/hello \
  -H "Authorization: Bearer LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ping":true}'
```

By default the platform rejects a request with no valid token before your code runs. `--no-verify-jwt` is needed for a webhook receiver, which is called by a third party with no session — and it makes the endpoint public, so the function must then verify the caller itself by checking a signature.

Keep the local secrets file ignored, and confirm rather than print:

```bash
grep -q 'functions/.env' .gitignore || echo "function env file is NOT ignored"
```

## Deploy and schedule

```bash
supabase secrets set STRIPE_SECRET_KEY=... --project-ref PROJECT_REF
supabase secrets list
supabase functions deploy hello
supabase functions deploy hello --no-verify-jwt
```

Set secrets **before** deploying, or the first invocations fail on a missing value. Never paste a secret into the terminal where it enters shell history and this transcript — have the user set it, or read it from a file.

Confirm which project is linked before deploying; this publishes a live endpoint. Deploying with `--no-verify-jwt` makes it publicly callable, which is correct for a webhook and wrong for anything else — say so explicitly when using it.

For scheduled work, use a cron entry in the database rather than an external caller:

```sql
select cron.schedule(
  'nightly-digest',
  '0 3 * * *',
  $$ select net.http_post(
       url := 'https://PROJECT_REF.supabase.co/functions/v1/digest',
       headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
     ) $$
);
```

That embeds a key in the database, so restrict who can read `cron.job`. Prefer a function that requires no elevated caller where possible.

## Verify and report

```bash
supabase functions list
curl -i https://PROJECT_REF.supabase.co/functions/v1/hello -H "Authorization: Bearer ANON_KEY" -d '{}'
```

Check the platform logs in the dashboard, or:

```bash
supabase functions logs hello
```

Verify the negative cases, which are the ones that matter: no token returns 401, a token for a different user cannot read that user's rows, a `GET` returns 405, and a preflight succeeds from the real origin. A function that only works for you has not been tested.

Report the function name, the runtime imports and their pinned versions, whether the token is verified by the platform or by the function, which client it uses and therefore whose permissions apply, the secrets required and whether they are set locally and remotely, the deployed URL, and the verification results including the 401 and cross-user checks. Never print a secret or a service role key.
