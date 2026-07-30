# 11ai Supabase operations

Eleven standalone skills for common Supabase project work, with read-first checks around data changes, migration pushes, row level security, and anything that touches a linked remote project.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-supabase-cheatsheet`](./skills/11ai-supabase-cheatsheet/SKILL.md) | Looking up CLI commands, client query syntax, filters, and the key and URL differences |
| [`11ai-supabase-setup`](./skills/11ai-supabase-setup/SKILL.md) | Installing the CLI, initializing and linking a project, starting the local stack, and writing environment files |
| [`11ai-supabase-environment`](./skills/11ai-supabase-environment/SKILL.md) | Inspecting the CLI, the link, the local stack, which keys the application reads, and migration state |
| [`11ai-supabase-database`](./skills/11ai-supabase-database/SKILL.md) | Querying and correcting Postgres data, inspecting schema, and writing functions and triggers |
| [`11ai-supabase-migrations`](./skills/11ai-supabase-migrations/SKILL.md) | Creating, replaying, and pushing migrations, and resolving drift between local and remote |
| [`11ai-supabase-rls`](./skills/11ai-supabase-rls/SKILL.md) | Writing and verifying row level security policies from the perspective of every identity |
| [`11ai-supabase-auth`](./skills/11ai-supabase-auth/SKILL.md) | Configuring sign-in, redirect allow lists, session cookies, and server-side user validation |
| [`11ai-supabase-storage`](./skills/11ai-supabase-storage/SKILL.md) | Creating and securing buckets, uploading, signing URLs, and deleting objects |
| [`11ai-supabase-edge-functions`](./skills/11ai-supabase-edge-functions/SKILL.md) | Writing, serving, and deploying edge functions with their secrets and CORS handling |
| [`11ai-supabase-integrations`](./skills/11ai-supabase-integrations/SKILL.md) | Wiring client libraries, an ORM alongside the client, realtime, database webhooks, and pipelines |
| [`11ai-supabase-troubleshooting`](./skills/11ai-supabase-troubleshooting/SKILL.md) | Diagnosing empty results, wrong keys, migration drift, session loss, storage, and function failures |

The skills are intentionally narrow. Combine them when a task crosses boundaries, such as confirming the linked project before pushing a migration, or writing a policy and then capturing it as a migration file.

## Safety contract

Establish the target before anything else. `supabase db push`, `db diff --linked`, `db pull`, `functions deploy`, and `secrets set` act on the **linked remote project**, not the local stack — so a mistyped command reaches production. Confirm the linked project's name, not just its reference.

Know which key is in play. The anon key is published in the browser and row level security is what protects the data behind it. The service role key bypasses row level security completely: it belongs in a server-only module, never in client code, never behind a client-exposed environment prefix, and never in a committed file. A service role key reachable from the browser exposes every row in the database and must be rotated.

Enable row level security on every table in the migration that creates it. A table without it is readable and writable by anyone holding the published anon key. Verify each policy as an anonymous caller, as a user who should be denied, and as the intended user — a policy tested only with the correct user has not been tested.

Treat as requiring explicit approval for the exact target: `db push`, `db reset` against anything but the local stack, `stop --no-backup`, an `update` or `delete` without a previewed row count, dropping a column or table, `migration repair`, deleting storage objects, and deploying a function with token verification turned off.

Never fix a symptom by weakening protection. Disabling row level security, widening a policy to `using (true)`, substituting the service role key, or allowing every CORS origin each trade the safeguard for the error.

Do not print keys, database passwords, access tokens, connection strings, signed URLs, or personal data. Confirm a variable by name, and list names rather than dumping an environment file.
