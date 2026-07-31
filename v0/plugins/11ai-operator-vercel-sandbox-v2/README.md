# 11ai Vercel Sandbox v2 operator

Ten standalone skills for persistent-by-default isolated compute lifecycle, commands, files, runtimes, snapshots, networking, exposure, security, limits, and cleanup, with read-first checks around scope, credentials, isolation, usage, remote actions, and ownership.

Version baseline: @vercel/sandbox 2.9 within SDK major 2.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-vercel-sandbox-v2-cheatsheet`](./skills/11ai-operator-vercel-sandbox-v2-cheatsheet/SKILL.md) | Quick commands and lifecycle reminders |
| [`11ai-operator-vercel-sandbox-v2-environment`](./skills/11ai-operator-vercel-sandbox-v2-environment/SKILL.md) | Read-only scope, resource, and policy inspection |
| [`11ai-operator-vercel-sandbox-v2-setup`](./skills/11ai-operator-vercel-sandbox-v2-setup/SKILL.md) | Project-local setup with bounded remote effects |
| [`11ai-operator-vercel-sandbox-v2-integrations`](./skills/11ai-operator-vercel-sandbox-v2-integrations/SKILL.md) | Identity, storage, events, observability, and deployment seams |
| [`11ai-operator-vercel-sandbox-v2-troubleshooting`](./skills/11ai-operator-vercel-sandbox-v2-troubleshooting/SKILL.md) | Evidence-led lifecycle and platform diagnosis |
| [`11ai-operator-vercel-sandbox-v2-lifecycle`](./skills/11ai-operator-vercel-sandbox-v2-lifecycle/SKILL.md) | Create, inspect, connect, extend, stop, timeout, and cleanup sandboxes |
| [`11ai-operator-vercel-sandbox-v2-commands-files`](./skills/11ai-operator-vercel-sandbox-v2-commands-files/SKILL.md) | Run commands, stream output, upload, download, edit, and preserve paths |
| [`11ai-operator-vercel-sandbox-v2-runtimes-snapshots`](./skills/11ai-operator-vercel-sandbox-v2-runtimes-snapshots/SKILL.md) | Runtime choice, dependencies, images, snapshots, reproducibility, and reuse |
| [`11ai-operator-vercel-sandbox-v2-networking-exposure`](./skills/11ai-operator-vercel-sandbox-v2-networking-exposure/SKILL.md) | Outbound access, ports, dev servers, URLs, and request boundaries |
| [`11ai-operator-vercel-sandbox-v2-security-limits`](./skills/11ai-operator-vercel-sandbox-v2-security-limits/SKILL.md) | Threat model, isolation, sudo, resources, timeouts, abuse, and audit |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect versions, team and project, environment, resources or runs, state, permissions, limits, and observability before changing anything.

Never guess Vercel team and project, environment, runtime, sandbox ID, timeout, resource limits, network policy, exposed ports, file inputs, or cleanup policy. Read exact identifiers and policies from code, CLI, dashboard, or the user.

Ask before creating or stopping sandboxes, executing commands, uploading files, exposing ports, changing network or resource limits, creating snapshots, or deploying. Preview resources, commands or steps, permissions, counts, usage, cleanup, and rollback.

Never print or commit VERCEL_OIDC_TOKEN, access tokens, uploaded private files, command environment values, logs containing data, or preview URLs. Redact external data. Bound concurrency, retries, duration, storage, and bulk operations; verify in test scope before production.
