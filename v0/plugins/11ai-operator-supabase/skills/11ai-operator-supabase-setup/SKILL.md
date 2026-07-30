---
name: 11ai-operator-supabase-setup
description: "Set up a Supabase project from zero, covering CLI installation, project initialization, linking to a remote project reference, starting the local Docker stack, creating the environment files for local and hosted use, generating database types, and separating the anon key from the service role key. Use when a repository has no Supabase directory, when the local stack must be started for the first time, when a project must be linked, or when the user asks how to get Supabase running."
---
# 11ai supabase setup

Two things here change shared state: linking a directory to a remote project, and writing environment files that hold keys. Confirm which remote project is intended before linking, because once a link exists several commands act on that project rather than on the local stack.

## Check what exists

```bash
supabase --version
docker info --format '{{.ServerVersion}}' 2>/dev/null || echo "docker unavailable"
ls -la supabase/ 2>/dev/null
```

Use `11ai-operator-supabase-environment` for the full inspection. If a `supabase/` directory already exists, this is not a fresh setup — change only what is missing rather than re-initializing over someone's migrations.

Docker is a prerequisite for the local stack, not for the CLI. Install and start it first if the local stack is wanted.

## Install and initialize

```bash
brew install supabase/tap/supabase
supabase login
supabase init
```

Install the CLI through a package manager or as a project dev dependency; do not install it globally with npm, which the project's own tooling then cannot pin. `supabase login` opens a browser and stores a personal access token — never take a token through the terminal.

`supabase init` creates `supabase/config.toml` and the migrations directory. It is safe and local.

Read [references/setup.md](references/setup.md) for the per-platform installs, the config file settings worth knowing, the environment file shapes for each framework, the client factory patterns, and the type generation step.

## Link deliberately

```bash
supabase projects list
supabase link --project-ref PROJECT_REF
```

Read the project list and confirm the name and reference with the user before linking. After linking, `supabase db push`, `supabase db diff --linked`, `supabase functions deploy`, and `supabase secrets set` all act on that remote project — so linking a production project makes a mistyped command a production change.

Prefer linking a development or staging project. When production must be linked, say so plainly and treat every subsequent command as production-facing.

## Start the local stack and write the environment

```bash
supabase start
supabase status
```

`supabase start` pulls several container images on first run and prints the local API URL, database URL, and keys. Those local keys are fixed development values shared by every Supabase project, so they are not secrets — but the file they go into should still be ignored, so the same file can hold real values later.

Write two things, and keep them apart:

- An **ignored** environment file with the URL, the anon key, and — only if a server needs it — the service role key.
- A committed `.env.example` with the variable names and no values.

```bash
grep -q '^\.env' .gitignore || echo "env files are NOT ignored"
```

The anon key belongs in the browser and is protected by row level security. The service role key bypasses row level security completely and must never reach client code, a `NEXT_PUBLIC_` variable, or a committed file. Create the server client in a server-only module and never import it from a component.

Enable row level security on every table as part of setup, not later. A table without it is readable and writable by anyone holding the anon key, which is published in the browser. Hand the policies to `11ai-operator-supabase-rls`.

## Verify

```bash
supabase status
supabase migration list
supabase gen types typescript --local > src/database.types.ts
npx tsc --noEmit
```

Then prove the application connects: start it, perform one read through the anon client, and confirm it returns data or a policy denial rather than a connection error. Confirm the reverse too — that a table with row level security on and no policy returns no rows to the anon key. That negative check is what tells you the protection is actually on.

## Guardrails

- Never print a service role key, a database password, a personal access token, or the contents of an environment file. Confirm a variable by name.
- Never commit an environment file, and never prefix a service role key with `NEXT_PUBLIC_` or any client-exposed prefix.
- Do not run `supabase db push` during setup. Pushing migrations to a linked project is a separate, reviewed step in `11ai-operator-supabase-migrations`.
- Do not run `supabase db reset` against anything but the local stack; it drops the database and replays migrations.
- Do not use `supabase stop --no-backup` unless the local data is genuinely disposable.
- Do not create a table without enabling row level security on it.
- Report the CLI version, whether Docker is available, the linked project reference and name, the local stack URLs, the variable names written to which files, whether those files are ignored, the generated types path, and the verification result including the negative row level security check.
