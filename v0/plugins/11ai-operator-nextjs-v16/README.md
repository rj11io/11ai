# 11ai Next.js v16 operator

Ten standalone skills for App Router routes, server and client boundaries, rendering, data and cache policy, mutations, metadata, and deployment, with read-first checks around execution boundaries, public behavior, generated output, and state changes.

Version baseline: Current Next.js 16 release with App Router and React 19.2.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-nextjs-v16-cheatsheet`](./skills/11ai-operator-nextjs-v16-cheatsheet/SKILL.md) | Quick commands and patterns |
| [`11ai-operator-nextjs-v16-environment`](./skills/11ai-operator-nextjs-v16-environment/SKILL.md) | Read-only versions and project inspection |
| [`11ai-operator-nextjs-v16-setup`](./skills/11ai-operator-nextjs-v16-setup/SKILL.md) | Project-local installation and configuration |
| [`11ai-operator-nextjs-v16-integrations`](./skills/11ai-operator-nextjs-v16-integrations/SKILL.md) | Build, runtime, test, CI, and deployment seams |
| [`11ai-operator-nextjs-v16-troubleshooting`](./skills/11ai-operator-nextjs-v16-troubleshooting/SKILL.md) | Evidence-led failure diagnosis |
| [`11ai-operator-nextjs-v16-app-router`](./skills/11ai-operator-nextjs-v16-app-router/SKILL.md) | Layouts, pages, segments, loading, errors, not-found, and navigation |
| [`11ai-operator-nextjs-v16-server-client`](./skills/11ai-operator-nextjs-v16-server-client/SKILL.md) | Execution boundaries, serialization, interactivity, and composition |
| [`11ai-operator-nextjs-v16-data-cache`](./skills/11ai-operator-nextjs-v16-data-cache/SKILL.md) | Server data fetching, use cache, revalidation, streaming, and invalidation |
| [`11ai-operator-nextjs-v16-mutations-handlers`](./skills/11ai-operator-nextjs-v16-mutations-handlers/SKILL.md) | Server Functions, forms, Route Handlers, validation, auth, and revalidation |
| [`11ai-operator-nextjs-v16-metadata-deployment`](./skills/11ai-operator-nextjs-v16-metadata-deployment/SKILL.md) | Metadata, images, assets, runtime configuration, builds, previews, and production |

Combine sibling skills when a task crosses boundaries. This plugin is standalone and does not require or reference another 11ai plugin.

## Safety contract

Inspect installed versions, configuration, rendering mode, source ownership, and target configured Node.js, Edge, build-time, and browser runtimes before editing.

Never guess Next.js version, App or Pages Router, runtime, cache policy, rendering mode, deployment target, or environment ownership. Preserve package manager, lockfile, public routes or component APIs, and runtime boundaries.

Ask before changing routes, cache invalidation, runtime placement, server-client boundaries, production environment values, domains, or deployments. Preview affected consumers, generated output, cache behavior, and deployments.

Never print or commit server environment values, cookies, tokens, request bodies, signed URLs, or serialized private data. Count files and inspect diffs before codemods, bulk moves, dependency upgrades, cache invalidation, or generated-output replacement.
