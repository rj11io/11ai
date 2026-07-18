# 11ai

Reusable AI-agent skills for building chat products, editorial blogs, and repo-driven project sites; automating agent work; benchmarking coding models; reverse engineering and maintaining codebases; integrating application services; running repository tasks through disciplined Git workflows; cleaning up local development environments; and running deep iterative project audits.

Project site: https://ai.rj11.io/

Each skill is a self-contained directory led by a `SKILL.md` file. Keep the whole directory together so its references, scripts, assets, and agent metadata remain available.

## Install

Install the collection from GitHub with the [skills CLI](https://skills.sh/docs/cli):

```bash
npx skills add rj11io/11ai --full-depth
```

The CLI runs through `npx`, discovers the repository's skills, and configures the skills you select for your agent. `--full-depth` is required because this collection organizes skills into nineteen workflow plugins instead of one top-level `skills/` directory.

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

The files are installed at `node_modules/@rj11io/11ai/11ai/v0/`. You can also clone this repository and use [`11ai/v0`](./11ai/v0) directly.

## Skill catalog

The repository currently contains 151 skills in 19 plugins.

| Plugin | Skills | Use them for |
| --- | ---: | --- |
| [Agent automation](./11ai/v0/11ai-agent-automation/README.md) | 8 | Scheduled autonomous work using the Ledger + Conductor + Routine pattern |
| [AI chat](./11ai/v0/11ai-ai-chat/README.md) | 9 | End-to-end chat, sessions, tools, models, providers, UI, and messaging-platform extensions |
| [Ant Design operations](./11ai/v0/11ai-antdesign-operations/README.md) | 10 | Common Ant Design React setup, layouts, forms, tables, navigation, overlays, display, theming, reference, and troubleshooting |
| [AWS operations](./11ai/v0/11ai-aws-operations/README.md) | 11 | Common AWS CLI operations for account context, S3, EC2, Lambda, ECS, ECR, CloudWatch, IAM, CloudFormation, reference, and troubleshooting |
| [Benchmarks](./11ai/v0/11ai-benchmarks/README.md) | 19 | Running resumable soft/final lifecycles; creating, auditing, AI/human judging, accounting, reviewing, synchronizing, and publishing benchmarks |
| [Blog builder](./11ai/v0/11ai-blog-builder/README.md) | 8 | Building file-backed editorial blogs with composable CMS, author, Markdown, content, navigation, and UI skills |
| [Cleanup](./11ai/v0/11ai-cleanup/README.md) | 5 | Safely finding and removing abandoned local resources |
| [Codebase](./11ai/v0/11ai-codebase/README.md) | 3 | Playwright setup, npm publishing, and automated releases |
| [Docker operations](./11ai/v0/11ai-docker-operations/README.md) | 10 | Common Docker CLI and Compose operations, safe cleanup, and troubleshooting |
| [Git operations](./11ai/v0/11ai-git-operations/README.md) | 11 | Modular, safety-first skills for common Git operations, repository workflows, learning, and troubleshooting |
| [Integrations](./11ai/v0/11ai-integrations/README.md) | 3 | Adding Convex, WorkOS AuthKit, or both to Next.js applications |
| [Jest operations](./11ai/v0/11ai-jest-operations/README.md) | 12 | Inspecting, running, configuring, and troubleshooting common Jest operations |
| [MongoDB operations](./11ai/v0/11ai-mongodb-operations/README.md) | 10 | Common MongoDB Shell and Database Tools work with read-first safety checks |
| [Node.js API operations](./11ai/v0/11ai-nodejs-api-operations/README.md) | 10 | Inspecting, changing, testing, and troubleshooting Node.js APIs across common frameworks |
| [Super](./11ai/v0/11ai-super/README.md) | 8 | Repeatedly completing general or specialist project tasks to a high evidence-based bar |
| [Security](./11ai/v0/11ai-security/README.md) | 1 | Read-only dependency vulnerability and supply-chain auditing with critical host-harm triage |
| [Utilities](./11ai/v0/11ai-utils/README.md) | 9 | Code-quality review and improvement, Markdown compression, reverse engineering, critique, LLM cost analysis, analytics, publication CMS, calls to action, and project sites |
| [Web design](./11ai/v0/11ai-web-design/README.md) | 2 | The 11ai visual language and deliberate content-led styling for accessible web interfaces |
| [Cross-harness](./11ai/v0/11ai-xharness/README.md) | 2 | Delegating work to agents running in other CLI harnesses |

Start with a plugin's README to choose a skill, then name that skill in your request. Skills provide instructions and examples; they do not install the application dependencies used in those examples by themselves.

## Repository layout

```text
11ai/
  index.js                    CommonJS package entry point
  v0/
    11ai-agent-automation/    8 automation skills
    11ai-ai-chat/             9 AI chat skills
    11ai-antdesign-operations/ 10 Ant Design React operation skills
    11ai-aws-operations/      11 AWS CLI operation skills
    11ai-benchmarks/          19 benchmark skills
    11ai-blog-builder/        8 editorial blog skills
    11ai-cleanup/             5 cleanup skills
    11ai-codebase/            3 codebase skills
    11ai-docker-operations/   10 Docker CLI operation skills
    11ai-git-operations/      11 Git operation and workflow skills
    11ai-integrations/        3 integration skills
    11ai-jest-operations/     12 Jest operation skills
    11ai-mongodb-operations/  10 MongoDB operation skills
    11ai-nodejs-api-operations/ 10 Node.js API operation skills
    11ai-super/               8 iterative task and improvement skills
    11ai-security/            1 dependency security audit skill
    11ai-utils/               9 utility skills
    11ai-web-design/          2 web design skills
    11ai-xharness/            2 cross-harness skills
scripts/                      Root package validation, release, and publishing helpers
www/                          Next.js project site
```

`v0` is the current skill-format namespace. Pin the npm package version or a commit when reproducibility matters, because skill content can change between releases. See [`CHANGELOG.md`](./CHANGELOG.md) for release history.

The CommonJS entry point exposes package metadata only:

```js
const elevenAI = require("@rj11io/11ai")

console.log(elevenAI.name) // "@rj11io/11ai"
```

The supported consumer surface is the skill content under `11ai/v0`, not a JavaScript runtime API.

## Repository commands

Install root package tooling before running these commands:

```bash
npm install
npm run validate-skills
npm run pack-dry
```

`validate-skills` checks frontmatter, Codex metadata, Claude plugin and marketplace configuration, links, scripts, and catalog coverage. `pack-dry` shows the npm tarball contents without publishing. The manual publishing command and its token requirements are documented in [`scripts/README.md`](./scripts/README.md). The project site has its own dependencies and commands in [`www/README.md`](./www/README.md).

Pushes to `main` run semantic-release, which updates the changelog and package version, publishes to npm, creates a GitHub release, and publishes the generated tarball to GitHub Packages.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
