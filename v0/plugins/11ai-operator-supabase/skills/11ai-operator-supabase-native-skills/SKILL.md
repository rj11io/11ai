---
name: 11ai-operator-supabase-native-skills
description: "Discover, compatibility-check, install, update, or explain Supabase's first-party agent skills. Use when asked about Supabase native skills, supabase/agent-skills, Postgres best-practice skills, agent setup, or compatibility with the project's Supabase CLI, client, and Postgres versions."
---

# Supabase native skills

Version baseline: Supabase CLI v2, `supabase-js` v2, and the current CLI local Postgres 17 line. Hosted project Postgres versions and client libraries remain independently versioned.

## Inspect before installing

1. Read the lockfile, `supabase/config.toml`, migration history, and installed CLI version.
2. Determine the linked project's Postgres major with a read-only query when access is already available; do not reveal credentials.
3. Inspect existing agent skill locations and any installed Supabase skill source metadata.
4. Read the current [Supabase AI Skills documentation](https://supabase.com/docs/guides/getting-started/ai-skills) and first-party [`supabase/agent-skills`](https://github.com/supabase/agent-skills) repository.

## Enforce baseline compatibility

- Require the main `supabase` skill to support CLI v2 and `supabase-js` v2 patterns.
- Check SQL and migration advice against the actual hosted Postgres major; do not assume the local CLI image and remote project match.
- Treat `supabase-postgres-best-practices` as database guidance, not as permission to bypass RLS or mutate a remote project.
- Reject guidance that invents CLI commands, disables RLS, uses legacy auth helpers, or assumes a service-role key belongs in the browser.
- Do not upgrade the CLI, clients, Postgres major, or installed skills without an explicit request.

## Install only on request

Choose only the skills relevant to the project:

```sh
npx skills add supabase/agent-skills --skill supabase
npx skills add supabase/agent-skills --skill supabase-postgres-best-practices
```

Install the complete first-party collection only if the user asks:

```sh
npx skills add supabase/agent-skills
```

Let the user choose agent and project/user scope. Review the selected `SKILL.md` and any bundled scripts before allowing execution or overwriting an existing installation.

## Verify

Report the source, selected skills, destination and scope, release or revision, CLI/client/Postgres versions, and compatibility result. If local and hosted Postgres majors differ, state which guidance applies to each. Leave incompatible skills unchanged and explain the mismatch.
