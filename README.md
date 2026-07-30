# 11ai

Reusable AI-agent skills for building chat products, editorial blogs, and repo-driven project sites; automating agent work; benchmarking coding models; reverse engineering and maintaining codebases; integrating application services; running repository tasks through disciplined Git workflows; cleaning up local development environments; and running deep iterative project audits.

Project site: https://ai.rj11.io/

Each skill is a self-contained directory led by a `SKILL.md` file. Keep the whole directory together so its references, scripts, assets, and agent metadata remain available.

## Install

Install the collection from GitHub with the [skills CLI](https://skills.sh/docs/cli):

```bash
npx skills add rj11io/11ai --full-depth
```

The CLI runs through `npx`, discovers the repository's skills, and configures the skills you select for your agent. `--full-depth` is required because this collection organizes skills into twenty workflow plugins instead of one top-level `skills/` directory.

The repository follows the open Agent Skills format. Every skill also includes Codex UI metadata in `agents/openai.yaml`, and every plugin is packaged for Claude Code. To add the Claude marketplace, run:

```text
/plugin marketplace add rj11io/11ai
```

Then install the plugin you need from the marketplace UI or with `/plugin install <plugin>@11ai`.

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

The repository currently contains 243 skills in 27 plugins.

| Plugin | Skills | Use them for |
| --- | ---: | --- |
| [Agent automation](./v0/plugins/11ai-agent-automation/README.md) | 8 | Scheduled autonomous work using the Ledger + Conductor + Routine pattern |
| [AI chat](./v0/plugins/11ai-ai-chat/README.md) | 9 | End-to-end chat, sessions, tools, models, providers, UI, and messaging-platform extensions |
| [Ant Design operations](./v0/plugins/11ai-antdesign-operations/README.md) | 11 | Common Ant Design React setup, layouts, forms, tables, navigation, overlays, display, theming, stack integrations, reference, and troubleshooting |
| [AWS operations](./v0/plugins/11ai-aws-operations/README.md) | 13 | Common AWS CLI operations for setup, account context, S3, EC2, Lambda, ECS, ECR, CloudWatch, IAM, CloudFormation, integrations, reference, and troubleshooting |
| [Bash operations](./v0/plugins/11ai-bash-operations/README.md) | 10 | Shell inspection, strict-mode scripting, text processing, files, processes, linting, and troubleshooting |
| [Benchmarks](./v0/plugins/11ai-benchmarks/README.md) | 19 | Running resumable soft/final lifecycles; creating, auditing, AI/human judging, accounting, reviewing, synchronizing, and publishing benchmarks |
| [Blog builder](./v0/plugins/11ai-blog-builder/README.md) | 8 | Building file-backed editorial blogs with composable CMS, author, Markdown, content, navigation, and UI skills |
| [Cleanup](./v0/plugins/11ai-cleanup/README.md) | 5 | Safely finding and removing abandoned local resources |
| [Clerk operations](./v0/plugins/11ai-clerk-operations/README.md) | 10 | Clerk setup, sign-in flows, server-side session protection, users, organizations, webhooks, and troubleshooting |
| [Codebase](./v0/plugins/11ai-codebase/README.md) | 3 | Playwright setup, npm publishing, and automated releases |
| [Convex operations](./v0/plugins/11ai-convex-operations/README.md) | 11 | Convex setup, schema and indexes, functions, actions and crons, auth, file storage, deployments, and troubleshooting |
| [Docker operations](./v0/plugins/11ai-docker-operations/README.md) | 12 | Common Docker CLI and Compose operations, setup, integrations, safe cleanup, and troubleshooting |
| [Git operations](./v0/plugins/11ai-git-operations/README.md) | 14 | Modular, safety-first skills for common Git operations, setup, integrations, repository workflows, learning, and troubleshooting |
| [Integrations](./v0/plugins/11ai-integrations/README.md) | 3 | Adding Convex, WorkOS AuthKit, or both to Next.js applications |
| [Jest operations](./v0/plugins/11ai-jest-operations/README.md) | 14 | Setting up, inspecting, running, integrating, configuring, and troubleshooting common Jest operations |
| [LLM costs](./v0/plugins/11ai-llm-costs/README.md) | 4 | Single-thread, project-scoped, and machine-wide LLM cost, effort, and timing reports |
| [MongoDB operations](./v0/plugins/11ai-mongodb-operations/README.md) | 12 | Common MongoDB Shell and Database Tools work with setup, driver integrations, and read-first safety checks |
| [Node.js API operations](./v0/plugins/11ai-nodejs-api-operations/README.md) | 12 | Scaffolding, inspecting, changing, testing, integrating, and troubleshooting Node.js APIs across common frameworks |
| [Super](./v0/plugins/11ai-super/README.md) | 9 | Repeatedly completing general or specialist project tasks to a high evidence-based bar |
| [Security](./v0/plugins/11ai-security/README.md) | 1 | Read-only dependency vulnerability and supply-chain auditing with critical host-harm triage |
| [SSH operations](./v0/plugins/11ai-ssh-operations/README.md) | 10 | OpenSSH client setup, keys, host configuration, sessions, tunnels, file transfer, and troubleshooting |
| [Stripe operations](./v0/plugins/11ai-stripe-operations/README.md) | 11 | Stripe setup, customers, prices, Checkout, subscriptions, payments, webhooks, entitlements, and troubleshooting |
| [Supabase operations](./v0/plugins/11ai-supabase-operations/README.md) | 11 | Supabase setup, Postgres data and migrations, row level security, auth, storage, edge functions, and troubleshooting |
| [Utilities](./v0/plugins/11ai-utils/README.md) | 8 | Markdown compression, reverse engineering, critique, analytics, publication CMS, calls to action, project sites, and operations-plugin scaffolding |
| [Web design](./v0/plugins/11ai-web-design/README.md) | 3 | The 11ai visual language and deliberate content-led styling for accessible web interfaces |
| [WorkOS operations](./v0/plugins/11ai-workos-operations/README.md) | 10 | WorkOS setup, AuthKit sessions, enterprise single sign-on, directory sync, organizations, webhooks, and troubleshooting |
| [Cross-harness](./v0/plugins/11ai-xharness/README.md) | 2 | Delegating work to agents running in other CLI harnesses |

Start with a plugin's README to choose a skill, then name that skill in your request. Skills provide instructions and examples; they do not install the application dependencies used in those examples by themselves.

## Repository layout

```text
.claude-plugin/               Claude marketplace discovery entry point
v0/
  index.js                    CommonJS package entry point
  plugins/
    11ai-agent-automation/    8 automation skills under skills/
    11ai-ai-chat/             9 AI chat skills under skills/
    11ai-antdesign-operations/ 11 Ant Design React operation skills under skills/
    11ai-aws-operations/      13 AWS CLI operation skills under skills/
    11ai-bash-operations/     10 Bash shell and scripting skills under skills/
    11ai-benchmarks/          19 benchmark skills under skills/
    11ai-blog-builder/        8 editorial blog skills under skills/
    11ai-cleanup/             5 cleanup skills under skills/
    11ai-clerk-operations/    10 Clerk authentication operation skills under skills/
    11ai-codebase/            3 codebase skills under skills/
    11ai-convex-operations/   11 Convex backend operation skills under skills/
    11ai-docker-operations/   12 Docker CLI operation skills under skills/
    11ai-git-operations/      14 Git operation and workflow skills under skills/
    11ai-integrations/        3 integration skills under skills/
    11ai-jest-operations/     14 Jest operation skills under skills/
    11ai-llm-costs/           4 LLM cost, effort, and timing skills under skills/
    11ai-mongodb-operations/  12 MongoDB operation skills under skills/
    11ai-nodejs-api-operations/ 12 Node.js API operation skills under skills/
    11ai-super/               9 iterative task and improvement skills under skills/
    11ai-security/            1 dependency security audit skill under skills/
    11ai-ssh-operations/      10 OpenSSH client operation skills under skills/
    11ai-stripe-operations/   11 Stripe billing operation skills under skills/
    11ai-supabase-operations/ 11 Supabase project operation skills under skills/
    11ai-utils/               8 utility skills under skills/
    11ai-web-design/          3 web design skills under skills/
    11ai-workos-operations/   10 WorkOS authentication operation skills under skills/
    11ai-xharness/            2 cross-harness skills under skills/
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
