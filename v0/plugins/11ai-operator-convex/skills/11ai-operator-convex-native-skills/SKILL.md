---
name: 11ai-operator-convex-native-skills
description: "Discover, compatibility-check, install, update, or explain Convex's first-party agent skills. Use when asked about Convex native skills, get-convex/agent-skills, agent setup, or whether installed Convex skills match the project's current Convex package and runtime."
---

# Convex native skills

Version baseline: Current stable Convex platform and npm package, with configurable Node.js runtimes 20, 22, and 24 supported by current Convex documentation.

## Inspect before installing

1. Read the lockfile, `convex.json`, generated API, and the installed `convex` package version.
2. Identify the development or production deployment without printing deploy keys or environment values.
3. Inspect project and user skill directories and any existing Convex skills.
4. Read the current [Convex Agent Skills documentation](https://docs.convex.dev/ai/agent-skills) and first-party [`get-convex/agent-skills`](https://github.com/get-convex/agent-skills) repository.

## Enforce compatibility

- Compare each selected native skill with the installed Convex package and current generated API conventions.
- Check Node-runtime guidance against `convex.json`; accept only currently supported 20, 22, or 24 targets.
- Reject legacy function registration, missing argument validators, table scans presented as scalable queries, or deployment commands that omit the target.
- Treat migration and deployment skills as potentially state-changing; installing instructions does not authorize executing their procedures.
- Do not upgrade Convex, regenerate APIs, modify runtime configuration, or deploy merely to match the native skill.

## Install only on request

Use the documented selector:

```sh
npx skills add get-convex/agent-skills
```

Install every first-party skill only when explicitly requested:

```sh
npx skills add get-convex/agent-skills --all
```

Prefer the `convex` router and only the task-specific skills needed, such as quickstart, auth, migration, component creation, or performance audit. Let the user choose agent and scope; do not overwrite an existing skill without approval.

## Verify

Locate each installed skill and report its name, first-party source, destination, scope, revision or release, project package/runtime versions, and compatibility result. If the upstream skill is newer than the installed package, distinguish instructions that remain compatible from those that require an application upgrade.
