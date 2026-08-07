# 11ai

Reusable AI-agent skills for building chat products, editorial blogs, and repo-driven project sites; automating agent work; reporting LLM usage, cost, and timing; reverse engineering and maintaining codebases; integrating application services; running repository tasks through disciplined Git workflows; cleaning up local development environments; setting how an agent speaks; and running deep iterative project audits.

Project site: https://ai.rj11.io/

Each skill is a self-contained directory led by a `SKILL.md` file. Keep the whole directory together so its references, scripts, assets, and agent metadata remain available.

## Install

Install the collection from GitHub with the [skills CLI](https://skills.sh/docs/cli):

```bash
npx skills add rj11io/11ai --full-depth
```

The CLI runs through `npx`, discovers the repository's skills, and configures the skills you select for your agent. `--full-depth` is required because this collection organizes skills into per-workflow plugins under `v0/plugins/` instead of one top-level `skills/` directory.

The repository follows the open Agent Skills format. Every skill also includes Codex UI metadata in `agents/openai.yaml`, and every plugin is packaged for both Claude Code and Codex.

### Claude Code marketplace

Add the marketplace once, either inside a Claude Code session:

```text
/plugin marketplace add rj11io/11ai
```

or from your shell:

```bash
claude plugin marketplace add rj11io/11ai
```

Then install the plugin you need from the marketplace UI or with `/plugin install <plugin>@11ai`, for example `/plugin install 11ai-benchmarks@11ai`.

### Codex marketplace

Add the marketplace once:

```bash
codex plugin marketplace add rj11io/11ai
```

Then install the plugin you need with `codex plugin add <plugin>@11ai`, for example `codex plugin add 11ai-benchmarks@11ai`, or pick it from the plugins UI.

After installation, ask your agent to use a skill by name. For example:

```text
Use 11ai-ai-chat-stack to add a complete AI chat surface to this application.
```

### Package-only installation

Install the npm package directly when you need a versioned copy of the raw files rather than agent configuration:

```bash
npm install --save-dev @rj11io/11ai
```

The files are installed at `node_modules/@rj11io/11ai/v0/plugins/`. You can also clone this repository and use [`v0/plugins`](./v0/plugins) directly.

## Skill catalog

The repository currently contains 462 skills in 48 plugins.

| Plugin | Skills | Use them for |
| --- | ---: | --- |
| [Agent automation](./v0/plugins/11ai-agent-automation/README.md) | 8 | Scheduled autonomous work using the Ledger + Conductor + Routine pattern |
| [AI chat](./v0/plugins/11ai-ai-chat/README.md) | 9 | End-to-end chat, sessions, tools, models, providers, UI, and messaging-platform extensions |
| [Audit](./v0/plugins/11ai-audit/README.md) | 1 | Read-only dependency vulnerability, malware, supply-chain, and host-computer risk auditing |
| [Ant Design v6 operator](./v0/plugins/11ai-operator-antdesign-v6/README.md) | 12 | Ant Design 6 React setup, components, theming, integrations, first-party native skills, reference, and troubleshooting |
| [AWS CLI v2 operator](./v0/plugins/11ai-operator-aws-cli-v2/README.md) | 22 | AWS CLI v2 operations for common services, deployments, first-party Agent Toolkit skills, integrations, and troubleshooting |
| [Bash operator](./v0/plugins/11ai-operator-bash/README.md) | 10 | Shell inspection, strict-mode scripting, text processing, files, processes, linting, and troubleshooting |
| [Benchmarks](./v0/plugins/11ai-benchmarks/README.md) | 5 | Single-thread, project-scoped, and machine-wide LLM cost, effort, and timing reports, provider-verified pricing maintenance, and a FAQ over all of them |
| [Blog builder](./v0/plugins/11ai-blog-builder/README.md) | 10 | Building file-backed editorial blogs with composable CMS, author, Markdown, content, navigation, and UI skills, plus a standalone platform-services page and a publications-and-chapters CMS |
| [Cleanup](./v0/plugins/11ai-cleanup/README.md) | 5 | Safely finding and removing abandoned local resources |
| [Clerk Core 3 operator](./v0/plugins/11ai-operator-clerk-core-3/README.md) | 11 | Clerk Core 3 setup, authentication, sessions, users, organizations, webhooks, native skills, and troubleshooting |
| [Codebase](./v0/plugins/11ai-codebase/README.md) | 4 | Playwright setup, npm publishing, automated releases, and web analytics |
| [Comms](./v0/plugins/11ai-comms/README.md) | 2 | Communication registers that set the shape of an agent's replies, plus a blunt read-only critique |
| [Convex operator](./v0/plugins/11ai-operator-convex/README.md) | 12 | Current Convex setup, schema, functions, auth, storage, deployments, first-party native skills, and troubleshooting |
| [CSS3 operator](./v0/plugins/11ai-operator-css-3/README.md) | 10 | Current CSS3-family cascade, selectors, layout, responsive design, theming, motion, integrations, reference, and troubleshooting |
| [Directors](./v0/plugins/11ai-directors/README.md) | 2 | Wrapping a repository task in a disciplined Git workflow, on main or through a reviewed pull request |
| [Docker operator](./v0/plugins/11ai-operator-docker/README.md) | 12 | Common Docker CLI and Compose operations, setup, integrations, safe cleanup, and troubleshooting |
| [Git operator](./v0/plugins/11ai-operator-git/README.md) | 19 | Focused, safety-first Git operations: setup, state, staging, commits, sync, branches, worktrees, tags, submodules, hooks, pull requests, bisect, stashes, recovery, integrations, troubleshooting, and a FAQ |
| [HTML5 operator](./v0/plugins/11ai-operator-html-5/README.md) | 10 | Current HTML5 documents, semantics, accessibility, forms, media, metadata, integrations, reference, and troubleshooting |
| [JavaScript ES2026 operator](./v0/plugins/11ai-operator-javascript-es2026/README.md) | 10 | ECMAScript 2026 modules, async control flow, DOM events, data modeling, standard-library additions, performance, security, integrations, reference, and troubleshooting |
| [Jest v30 operator](./v0/plugins/11ai-operator-jest-v30/README.md) | 17 | Setting up, inspecting, running, authoring, integrating, configuring, de-flaking, speeding up, and troubleshooting Jest 30 suites |
| [Material UI v9 operator](./v0/plugins/11ai-operator-mui-v9/README.md) | 13 | Material UI 9.2 setup, components, forms, navigation, theming, styling, migration, first-party Agent Skills, integrations, reference, and troubleshooting |
| [Core skills](./v0/plugins/11ai-core-skills/README.md) | 4 | Building, auditing, and maintaining other skills and the plugins that package them, plus markdown compression and repository reverse engineering |
| [MongoDB v8 operator](./v0/plugins/11ai-operator-mongodb-v8/README.md) | 17 | MongoDB 8 Shell and Database Tools work with transactions, profiling, roles, Atlas, backups, integrations, and safety checks |
| [Next.js v16 operator](./v0/plugins/11ai-operator-nextjs-v16/README.md) | 10 | Next.js 16 App Router, Server and Client Components, Cache Components, mutations, handlers, metadata, deployment, integrations, reference, and troubleshooting |
| [Node.js API v24 operator](./v0/plugins/11ai-operator-nodejs-api-v24/README.md) | 20 | Scaffolding, routing, validation, auth, data, jobs, GraphQL, OpenAPI, testing, and troubleshooting Node.js 24 LTS APIs |
| [Plugins marketplace](./v0/plugins/11ai-plugins-marketplace/README.md) | 2 | Auditing and researching marketplace, plugin, and skill configuration files across the Claude Code, Claude Cowork, OpenAI Codex, ChatGPT, and Agent Skills ecosystems |
| [PokéAPI v2 operator](./v0/plugins/11ai-operator-pokeapi-v2/README.md) | 12 | Cache-first PokéAPI v2 setup, Pokémon, moves, items, locations, encounters, evolution, games, integrations, fair-use reference, and troubleshooting |
| [React v19 operator](./v0/plugins/11ai-operator-reactjs-v19/README.md) | 10 | React 19.2 components, state, effects, Actions, Activity, forms, performance, testing, integrations, reference, and troubleshooting |
| [Security](./v0/plugins/11ai-security/README.md) | 1 | A reserved plugin for future security skills beyond dependency scanning: threat modeling, secure-coding review, and secrets handling |
| [Super](./v0/plugins/11ai-super/README.md) | 9 | Repeatedly completing general or specialist project tasks to a high evidence-based bar |
| [shadcn v4 operator](./v0/plugins/11ai-operator-shadcn-v4/README.md) | 13 | shadcn CLI 4.14 components, charts, registries, presets, forms, blocks, updates, native skills, integrations, reference, and troubleshooting |
| [SSH operator](./v0/plugins/11ai-operator-ssh/README.md) | 10 | OpenSSH client setup, keys, host configuration, sessions, tunnels, file transfer, and troubleshooting |
| [Stripe operator](./v0/plugins/11ai-operator-stripe/README.md) | 11 | Stripe setup, customers, prices, Checkout, subscriptions, payments, webhooks, entitlements, and troubleshooting |
| [Supabase operator](./v0/plugins/11ai-operator-supabase/README.md) | 12 | Current Supabase setup, Postgres, RLS, auth, storage, edge functions, first-party native skills, and troubleshooting |
| [Tailwind CSS v3 operator](./v0/plugins/11ai-operator-tailwind-v3/README.md) | 10 | Tailwind CSS 3.4 content scanning, builds, JavaScript configuration, themes, utilities, variants, plugins, integrations, reference, and troubleshooting |
| [Tailwind CSS v4 operator](./v0/plugins/11ai-operator-tailwind-v4/README.md) | 10 | Tailwind CSS 4.3 sources, build adapters, CSS-first themes, utilities, variants, compatibility, migration, integrations, reference, and troubleshooting |
| [TypeScript v7 operator](./v0/plugins/11ai-operator-typescript-v7/README.md) | 10 | TypeScript 7 native compiler configuration, type modeling, narrowing, generics, modules, packages, migrations, declarations, integrations, reference, and troubleshooting |
| [Vercel AI Gateway operator](./v0/plugins/11ai-operator-vercel-ai-gateway/README.md) | 10 | Models, routing, fallbacks, authentication, BYOK, budgets, usage, observability, security, integrations, reference, and troubleshooting |
| [Vercel AI SDK v7 operator](./v0/plugins/11ai-operator-vercel-ai-sdk-v7/README.md) | 10 | AI SDK 7 multimodal generation, streaming UI, structured output, tools, durable agents, providers, telemetry, integrations, reference, and troubleshooting |
| [Vercel Chat SDK v4 operator](./v0/plugins/11ai-operator-vercel-chat-sdk-v4/README.md) | 10 | Chat SDK 4 adapters, handlers, messages, UI, AI tools, state, concurrency, webhooks, deployment, integrations, reference, and troubleshooting |
| [Vercel Core Platform operator](./v0/plugins/11ai-operator-vercel-core/README.md) | 10 | Security, content delivery, Fluid Compute, observability, CI/CD, integrations, reference, and troubleshooting |
| [Vercel eve v0 operator](./v0/plugins/11ai-operator-vercel-eve-v0/README.md) | 10 | eve 0.27 definitions, tools, durable sessions, subagents, approvals, channels, schedules, evaluations, observability, integrations, reference, and troubleshooting |
| [Vercel Passport operator](./v0/plugins/11ai-operator-vercel-passport/README.md) | 10 | Identity providers, project protection, team policies, visitor identity, sessions, audit, integrations, reference, and troubleshooting |
| [Vercel Sandbox v2 operator](./v0/plugins/11ai-operator-vercel-sandbox-v2/README.md) | 10 | Sandbox SDK 2 lifecycle, persistent compute, commands, files, runtimes, images, multi-user isolation, networking, integrations, reference, and troubleshooting |
| [Vercel Workflows v4 operator](./v0/plugins/11ai-operator-vercel-workflows-v4/README.md) | 10 | Workflow SDK 4 definitions, steps, durability, event-sourced runs, retries, events, approvals, encryption, observability, integrations, reference, and troubleshooting |
| [Web design](./v0/plugins/11ai-web-design/README.md) | 4 | The 11ai visual language, deliberate content-led styling, and repository-driven project sites for accessible web interfaces |
| [WorkOS operator](./v0/plugins/11ai-operator-workos/README.md) | 11 | Current WorkOS setup, AuthKit, SSO, directory sync, organizations, webhooks, first-party native skills, and troubleshooting |
| [Cross-harness](./v0/plugins/11ai-xharness/README.md) | 2 | Delegating work to agents running in other CLI harnesses |

Start with a plugin's README to choose a skill, then name that skill in your request. Skills provide instructions and examples; they do not install the application dependencies used in those examples by themselves.

## Repository layout

```text
.claude-plugin/               Claude marketplace discovery entry point
v0/
  index.js                    CommonJS package entry point
  plugins/
    11ai-agent-automation/     8 automation skills under skills/
    11ai-ai-chat/              9 AI chat skills under skills/
    11ai-audit/                1 evidence-backed dependency-audit skill under skills/
    11ai-benchmarks/           5 LLM cost, effort, timing, and FAQ skills under skills/
    11ai-blog-builder/         10 editorial blog, platform-CTA, and publications-CMS skills under skills/
    11ai-cleanup/              5 cleanup skills under skills/
    11ai-codebase/             4 codebase skills under skills/
    11ai-comms/                2 communication skills under skills/
    11ai-directors/            2 Git task-director skills under skills/
    11ai-core-skills/          4 skill-authoring, packaging, compression, and reverse-engineering skills under skills/
    11ai-operator-antdesign-v6/  12 Ant Design v6 operation skills under skills/
    11ai-operator-aws-cli-v2/    22 AWS CLI v2 operation skills under skills/
    11ai-operator-bash/       10 Bash shell and scripting skills under skills/
    11ai-operator-clerk-core-3/ 11 Clerk Core 3 operation skills under skills/
    11ai-operator-convex/     12 Convex backend operation skills under skills/
    11ai-operator-css-3/     10 CSS3 operation skills under skills/
    11ai-operator-docker/     12 Docker CLI operation skills under skills/
    11ai-operator-git/        19 focused Git operation skills under skills/
    11ai-operator-html-5/    10 HTML5 operation skills under skills/
    11ai-operator-javascript-es2026/ 10 JavaScript ES2026 operation skills under skills/
    11ai-operator-jest-v30/       17 Jest operation skills under skills/
    11ai-operator-mongodb-v8/    17 MongoDB operation skills under skills/
    11ai-operator-mui-v9/        13 Material UI v9 operation skills under skills/
    11ai-operator-nextjs-v16/     10 Next.js v16 operation skills under skills/
    11ai-operator-nodejs-api-v24/ 20 Node.js API operation skills under skills/
    11ai-operator-pokeapi-v2/ 12 cache-first PokéAPI v2 operation skills under skills/
    11ai-operator-reactjs-v19/    10 React v19 operation skills under skills/
    11ai-plugins-marketplace/  2 marketplace-config audit and research skills under skills/
    11ai-operator-shadcn-v4/      13 shadcn v4 operation skills under skills/
    11ai-operator-ssh/        10 OpenSSH client operation skills under skills/
    11ai-operator-stripe/     11 Stripe billing operation skills under skills/
    11ai-operator-supabase/   12 Supabase project operation skills under skills/
    11ai-operator-tailwind-v3/ 10 Tailwind CSS v3 operation skills under skills/
    11ai-operator-tailwind-v4/ 10 Tailwind CSS v4 operation skills under skills/
    11ai-operator-typescript-v7/ 10 TypeScript v7 operation skills under skills/
    11ai-operator-vercel-ai-gateway/ 10 Vercel AI Gateway operation skills under skills/
    11ai-operator-vercel-ai-sdk-v7/ 10 Vercel AI SDK v7 operation skills under skills/
    11ai-operator-vercel-chat-sdk-v4/ 10 Vercel Chat SDK v4 operation skills under skills/
    11ai-operator-vercel-core/ 10 Vercel Core Platform operation skills under skills/
    11ai-operator-vercel-eve-v0/ 10 Vercel eve v0 operation skills under skills/
    11ai-operator-vercel-passport/ 10 Vercel Passport operation skills under skills/
    11ai-operator-vercel-sandbox-v2/ 10 Vercel Sandbox v2 operation skills under skills/
    11ai-operator-vercel-workflows-v4/ 10 Vercel Workflows v4 operation skills under skills/
    11ai-operator-workos/     11 WorkOS authentication operation skills under skills/
    11ai-security/             1 reserved security skill under skills/
    11ai-super/                9 iterative task and improvement skills under skills/
    11ai-web-design/           4 web design and project-site skills under skills/
    11ai-xharness/             2 cross-harness skills under skills/
  scripts/                    Package validation, release, and publishing helpers
  www/                        Next.js project site
```

`v0` is the current versioned distribution namespace for the plugins, package tooling, and project site. The root marketplace manifest is their stable Claude discovery entry point. Pin the npm package version or a commit when reproducibility matters, because its content can change between releases. See [`CHANGELOG.md`](./CHANGELOG.md) for release history.

The CommonJS entry point exposes package metadata only:

```js
const elevenAI = require("@rj11io/11ai")

console.log(elevenAI.name) // "@rj11io/11ai"
```

The supported consumer surface is the skill content under `v0/plugins/{plugin-name}/skills/{skill-name}`, not a JavaScript runtime API.

## Repository commands

Install root package tooling before running these commands:

```bash
npm install
npm run validate-skills
npm run pack-dry
```

`validate-skills` checks frontmatter, Codex metadata, Claude plugin and marketplace configuration, links, scripts, and catalog coverage. `pack-dry` shows the npm tarball contents without publishing. The manual publishing command and its token requirements are documented in [`v0/scripts/README.md`](./v0/scripts/README.md). The project site has its own dependencies and commands in [`v0/www/README.md`](./v0/www/README.md).

Pushes to `main` run semantic-release, which updates the changelog and package version, publishes to npm, creates a GitHub release, and publishes the generated tarball to GitHub Packages.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
