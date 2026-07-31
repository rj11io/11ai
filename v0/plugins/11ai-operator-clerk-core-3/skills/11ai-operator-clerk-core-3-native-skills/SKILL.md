---
name: 11ai-operator-clerk-core-3-native-skills
description: "Discover, compatibility-check, install, update, or explain Clerk's first-party agent skills for Clerk Core 3. Use when asked about Clerk native skills, clerk/skills, agent setup, or whether installed Clerk skills match this Core 3 operator and the project's SDK."
---

# Clerk Core 3 native skills

Version baseline: Clerk Core 3 and Clerk API `2026-05-12`. Clerk SDKs version independently, so compatibility must be checked against the actual framework SDK rather than inferred from the word “Core”.

## Inspect before installing

1. Identify the Clerk SDKs and exact versions from the lockfile.
2. Map each SDK to Core 3 and the configured Clerk API version using Clerk's current versioning documentation.
3. Inspect project and user skill locations for the active agent.
4. If Clerk skills already exist, read their `SKILL.md` files and source metadata before proposing an update.
5. Use only the first-party [Clerk Skills documentation](https://clerk.com/docs/guides/ai/skills) and [`clerk/skills`](https://github.com/clerk/skills) repository as the native source.

## Enforce Core 3 compatibility

- Require the installed Clerk SDK to be on its Core 3 release line; for Next.js, that is `@clerk/nextjs` v7.
- For API `2026-05-12`, check the documented minimum version for the installed SDK; do not assume one minimum applies to every framework.
- Read the selected native skill for removed Core 2 patterns. In particular, Core 3 replaces `SignedIn`, `SignedOut`, and `Protect` with `Show` for conditional rendering.
- Reject or warn on any native skill that targets old package names, old redirect props, or an incompatible API version.
- Do not upgrade the application SDK or API version unless the user requests it.

## Choose narrowly

Start with the `clerk` router skill, then select only the task-specific first-party skills needed, such as `clerk-setup`, `clerk-orgs`, `clerk-webhooks`, or the matching framework patterns. Loading every framework skill dilutes context and can introduce incompatible examples.

Install all only when explicitly requested:

```sh
npx skills add clerk/skills
```

Install a selected skill with:

```sh
npx skills add clerk/skills --skill clerk
```

Let the user choose agent and scope. Do not overwrite installed skills or run `clerk init` merely to install skills without approval.

## Verify

Report the first-party source, selected skills, destination and scope, recorded revision or release, project SDK versions, Clerk API version, Core 3 mapping, and any compatibility warning. If a selected skill does not match Core 3, leave it uninstalled and name the conflicting guidance.
