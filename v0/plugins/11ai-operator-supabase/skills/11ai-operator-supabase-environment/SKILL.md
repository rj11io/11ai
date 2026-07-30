---
name: 11ai-operator-supabase-environment
description: "Inspect the Supabase CLI version, whether a project directory is initialized and linked, which remote project reference is targeted, the local stack status and its URLs, which keys and URLs the application reads, migration state on both sides, and the Docker prerequisite, without changing anything. Use before a Supabase operation, when it is unclear whether a command hits local or remote, or when the user asks whether Supabase is set up."
---
# 11ai supabase environment

The most consequential thing to establish is which database a command will reach: the local Docker stack or the linked remote project. Several CLI commands quietly target the remote one, so confirm the link before anything that writes. Keep this pass read-only.

## Inspect the CLI and project

```bash
supabase --version
docker info --format '{{.ServerVersion}}' 2>/dev/null || echo "docker unavailable"
ls -la supabase/
cat supabase/config.toml 2>/dev/null | head -30
```

The local stack runs in Docker, so an unavailable daemon makes every local command fail with an error that does not mention Docker. Check it first.

A `supabase/` directory with a `config.toml` means the project is initialized. Its `project_id` is the local identifier, not the remote reference.

## Establish the link and the target

```bash
supabase projects list
cat supabase/.temp/project-ref 2>/dev/null || echo "not linked"
supabase migration list
supabase migration list --linked
```

This is the important step. `supabase link` stores a project reference, and once it exists, `db push`, `db diff --linked`, `functions deploy`, and `secrets set` act on that **remote** project. A developer expecting local behaviour can migrate production with one command.

`supabase migration list` shows local versus remote applied state side by side, which is how a drift between the two is spotted before a push.

Never assume the linked project is a development one. Read its name and reference from `supabase projects list` and confirm it against what the user expects.

## Check the local stack

```bash
supabase status
docker ps --filter 'name=supabase' --format '{{.Names}}\t{{.Status}}'
```

`supabase status` prints the local API URL, database URL, Studio URL, and the local anon and service role keys. Those local keys are fixed development values, not secrets — but treat the output as sensitive by habit, because the same command shape prints real values in other contexts.

If the stack is not running, say so rather than starting it. Starting Docker containers is a state change belonging to `11ai-operator-supabase-setup`.

## Check what the application reads

```bash
ls -la .env .env.local .env.example 2>/dev/null
grep -o '^[A-Z_]*' .env.local 2>/dev/null | sort
grep -c 'SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_SECRET_KEY' .env.local 2>/dev/null
grep -rn 'SERVICE_ROLE\|SUPABASE_SECRET' --include='*.ts' --include='*.tsx' src/ app/ 2>/dev/null | head
```

List variable **names**, never values. A single `cat .env.local` prints a service role key into this transcript, and that key bypasses every row level security policy in the project.

The last command is a real check worth running every time: a service role key referenced anywhere reachable by the browser — a client component, a public config, a `NEXT_PUBLIC_` variable — exposes the entire database. Report it as a finding immediately.

## Interpretation

- **`Cannot connect to the Docker daemon`** — the local stack cannot run. This is a Docker problem, not a Supabase one.
- **`Cannot find project ref` or a command asking for `--project-ref`** — the directory is not linked. Local commands still work; remote ones do not.
- **Local and remote migration lists differing** — drift. Someone applied a change through Studio or by hand. Resolve it before pushing, or `db push` will fail or overwrite.
- **`supabase start` succeeding but the application failing to connect** — the application is reading remote keys while the stack is local, or the reverse. Compare the URL in the environment file against `supabase status`.
- **An anon key rejected with a permission error** — that is usually row level security working as intended, not a key problem. Hand off to `11ai-operator-supabase-rls`.
- **A `NEXT_PUBLIC_` prefix on a service role key** — the key is in the browser bundle. Treat it as compromised and rotate it.

## Report

State the CLI version, whether Docker is available, whether the directory is initialized and linked, the linked project reference and name, the local stack status with its URLs, the variable names the application reads on each side, and the local versus remote migration state. Report values only as set or unset. Flag any service role key reachable from client code as an exposure. End with the smallest next safe step, and hand off to `11ai-operator-supabase-setup` if the project is not initialized or to `11ai-operator-supabase-troubleshooting` if something is already failing.
