---
name: 11ai-operator-workos-native-skills
description: "Discover, compatibility-check, install, update, list, or remove WorkOS's first-party coding-agent skills. Use when asked about WorkOS native skills, workos skills commands, AuthKit agent setup, or whether the installed WorkOS skill matches the project's current SDK."
---

# WorkOS native skills

Version baseline: Current WorkOS platform APIs and current GA SDKs; Node.js examples in this operator target `@workos-inc/node` v8 on Node.js 22.11 or newer.

## Inspect before installing

1. Identify the framework, WorkOS/AuthKit SDK, exact SDK version, and Node.js version where relevant.
2. Check whether the `workos` CLI exists and record its version without authenticating or changing environments.
3. Run `workos skills list` only when the CLI is available; it is read-only and shows available and installed skills.
4. Inspect any installed `workos-*` skill, its source metadata, and its destination.
5. Verify commands against the first-party [WorkOS AI Installer and CLI documentation](https://workos.com/docs/authkit/cli-installer).

## Enforce SDK compatibility

- Match AuthKit skills to the detected framework SDK rather than substituting a Next.js pattern for another framework.
- For Node.js code, require v8-compatible guidance and Node.js 22.11 or newer; flag older constructor, module, or runtime assumptions when the current native skill supersedes them.
- For other languages, compare the native skill guidance with that SDK's current GA documentation and installed major.
- Never use beta skill or SDK guidance as the default stable baseline.
- Do not update the WorkOS CLI, SDK, agent configuration, or application dependencies solely to satisfy compatibility unless requested.

## Install only on request

The first-party installer is:

```sh
workos skills install
```

The CLI may install into multiple detected agents, including `~/.codex/skills`. Show the detected destinations before proceeding when possible. Do not authenticate, switch WorkOS environments, or run the broader AuthKit installer as a side effect of this task.

Manage existing skills with:

```sh
workos skills list
workos skills uninstall
```

Uninstalling is destructive and requires the user's explicit target and approval.

## Verify

After installation, locate each installed skill and report its name, source, destination, agent, CLI version, project SDK version, and compatibility result. Read the installed `SKILL.md` and confirm its framework and SDK assumptions. If the CLI does not expose enough version metadata, say so and compare the installed content with current official docs instead of claiming compatibility.
