---
name: 11ai-operator-supabase-troubleshooting
description: "Diagnose Supabase failures from reproducible evidence, covering local stack and Docker problems, wrong key or wrong environment, empty results caused by row level security, migration drift and failed pushes, session loss and redirect rejections, storage upload and URL failures, edge function and CORS errors, connection exhaustion, and stale generated types. Use when a Supabase call errors or returns nothing, when a migration push fails, when sign-in or a redirect breaks, or when something works locally but not when deployed."
---
# 11ai supabase troubleshooting

Version baseline: Supabase CLI v2, supabase-js v2, and the current CLI local Postgres 17 line. Inspect the linked project, installed client patch, CLI patch, and remote Postgres version before changing configuration or migrations.

Separate observed facts from theories. The first question is always which target and which key were in play, because most Supabase symptoms come from a mismatch there rather than from the code. Do not disable row level security, swap in a service role key, or repair migration history to test an idea.

## Evidence collection

```bash
supabase --version
docker info --format '{{.ServerVersion}}' 2>/dev/null || echo "docker unavailable"
supabase status
supabase migration list
cat supabase/.temp/project-ref 2>/dev/null || echo "not linked"
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
```

```ts
const { data, error } = await supabase.from("posts").select("id").limit(1)
console.error({ code: error?.code, message: error?.message, details: error?.details, hint: error?.hint })
```

The client never throws, so an unchecked `error` is invisible. Log all four fields — `code` and `hint` usually name the cause directly.

```sql
select current_database(), current_user;
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r';
select policyname, cmd, qual, with_check from pg_policies where schemaname = 'public';
```

Preserve exact error codes and messages. Redact keys, connection strings, signed URLs, tokens, and personal data before quoting anything — list variable names rather than values, and never `cat` an environment file.

## Classify the failure

- **Every local command fails, no mention of Supabase** — Docker is not running. Check it first; the local stack is containers.
- **A query returns an empty array with no error** — this is row level security working, not a bug. Security is enabled and no policy grants the caller access, or the policy predicate does not match. Confirm with the service role key **as a diagnosis only**, then fix the policy. Hand off to `11ai-operator-supabase-rls`.
- **A permission denied error naming a table or schema** — a missing grant rather than a policy, often after creating an object by hand outside a migration.
- **Works locally, fails deployed** — almost always the environment: the deployed application holds different keys or URL, a secret was set locally and never remotely, or the redirect allow list on the hosted project is missing the production origin.
- **`Invalid API key` or an unexpected 401 on every call** — a key from a different project, a truncated paste, or the local anon key against a hosted project. Compare the project reference embedded in the URL against the linked one.
- **Writes succeed that should not** — the code path is using the service role key. Search for it, including any client-exposed prefix; a service role key reachable from the browser makes every policy irrelevant and the key must be rotated.
- **`supabase db push` fails or reports drift** — local and remote migration history disagree, usually because something was changed through Studio. Inspect with `migration list` and `db diff --linked` before touching anything.
- **A migration applies locally and fails remotely** — a Postgres version difference, a missing extension, or a statement that cannot run in a transaction, such as `create index concurrently`.
- **Session lost on reload or after an hour** — no middleware refreshing cookies, or middleware that does not rebuild the response after setting them. The one-hour boundary is the token expiry and points straight at the refresh path.
- **A redirect is rejected after OAuth or a magic link** — the URL is not in the allow list. `127.0.0.1` and `localhost` are different origins, and the local `config.toml` list and the hosted dashboard list are separate.
- **Server-side authorization behaving oddly** — code using `getSession()`, which does not verify the token. Use `getUser()` on the server.
- **A storage upload rejected** — the bucket's size limit or MIME type list, or an insert policy whose folder check does not match the path. The bucket limits apply regardless of client validation.
- **A public file URL returns nothing** — `getPublicUrl` does not check existence, so the upload probably failed with an ignored error. Or the bucket is private and needs a signed URL.
- **An edge function failing only from the browser** — CORS. The `OPTIONS` preflight is unhandled, or the origin does not match. From `curl` it works, which is the tell.
- **An edge function returning 401 before its code runs** — the platform is verifying the token. A webhook receiver needs `--no-verify-jwt` and must then verify the signature itself.
- **Types disagreeing with the database** — generated types are stale. Regenerate after every schema change.
- **Intermittent connection errors under load** — connection exhaustion. Use the pooled connection string, and keep one client per process rather than one per request.

## Remediation discipline

1. Reproduce with the smallest read: one `select` with `limit 1`, with the error object logged.
2. Establish the target and the key before reading the code. `supabase status`, the linked reference, and the variable names in play answer most questions.
3. Use the service role key to **confirm** a row level security diagnosis, never as the fix. Swapping it in makes the symptom vanish and exposes the data.
4. State confidence as high, medium, or low and name the evidence you are missing.
5. Make one bounded change, then rerun the original failing call.
6. Never disable row level security, never widen a policy to `using (true)`, and never add a permissive CORS origin to get past an error. Each trades the protection for the symptom.
7. Before rerunning a failed migration or a partially applied write, check what the failed attempt already did.

Hand off when the cause is elsewhere: `11ai-operator-supabase-environment` for target and key questions, `11ai-operator-supabase-rls` for policies, `11ai-operator-supabase-migrations` for drift and pushes, `11ai-operator-supabase-auth` for sessions and redirects, and `11ai-operator-supabase-setup` if the project is not properly initialized.

## Report

Conclude with: which target and key were in play, the exact error code and message, the failing layer — Docker, network, key, policy, migration, session, or function — the root cause or remaining uncertainty, the fix applied or proposed and why it addresses the cause rather than the symptom, its impact, how to undo it, and the verification result. Flag any service role key found in client-reachable code as an exposure requiring rotation.
