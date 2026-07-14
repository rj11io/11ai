# 11ai

Reusable AI-agent skills for building chat products and repo-driven project sites, automating agent work, benchmarking coding models, reverse engineering and maintaining codebases, integrating application services, cleaning up local development environments, and running deep iterative project audits.

Project site: https://ai.rj11.io/

Each skill is a self-contained directory led by a `SKILL.md` file. Keep the whole directory together so its references, scripts, assets, and agent metadata remain available.

## Install

Install the collection from GitHub with the [skills CLI](https://skills.sh/docs/cli):

```bash
npx skills add rj11io/11ai
```

The CLI runs through `npx`, discovers the repository's skills, and configures the skills you select for your agent.

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

The repository currently contains 54 skills in nine groups.

| Group | Skills | Use them for |
| --- | ---: | --- |
| [Agent automation](./11ai/v0/11ai-agent-automation/README.md) | 8 | Scheduled autonomous work using the Ledger + Conductor + Routine pattern |
| [AI chat](./11ai/v0/11ai-ai-chat/README.md) | 9 | End-to-end chat, sessions, tools, models, providers, UI, and messaging-platform extensions |
| [Benchmarks](./11ai/v0/11ai-benchmarks/README.md) | 11 | Creating, running, auditing, judging, costing, reviewing, and reporting AI-coding benchmarks |
| [Cleanup](./11ai/v0/11ai-cleanup/README.md) | 5 | Safely finding and removing abandoned local resources |
| [Codebase](./11ai/v0/11ai-codebase/README.md) | 3 | Playwright setup, npm publishing, and automated releases |
| [Integrations](./11ai/v0/11ai-integrations/README.md) | 3 | Adding Convex, WorkOS AuthKit, or both to Next.js applications |
| [Super](./11ai/v0/11ai-super/README.md) | 7 | Repeatedly completing general or specialist project tasks to a high evidence-based bar |
| [Utilities](./11ai/v0/11ai-utils/README.md) | 6 | Markdown compression, reverse engineering, read-only critique, Vercel analytics, web design, and repo-driven project sites |
| [Cross-harness](./11ai/v0/11ai-xharness/README.md) | 2 | Delegating work to agents running in other CLI harnesses |

Start with a group's README to choose a skill, then name that skill in your request. Skills provide instructions and examples; they do not install the application dependencies used in those examples by themselves.

## Repository layout

```text
11ai/
  index.js                    CommonJS package entry point
  v0/
    11ai-agent-automation/    8 automation skills
    11ai-ai-chat/             9 AI chat skills
    11ai-benchmarks/          11 benchmark skills
    11ai-cleanup/             5 cleanup skills
    11ai-codebase/            3 codebase skills
    11ai-integrations/        3 integration skills
    11ai-super/               7 iterative task and improvement skills
    11ai-utils/               6 utility skills
    11ai-xharness/            2 cross-harness skills
scripts/                      Root package publishing helper
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
npm run pack-dry
```

`pack-dry` shows the npm tarball contents without publishing. The manual publishing command and its token requirements are documented in [`scripts/README.md`](./scripts/README.md). The project site has its own dependencies and commands in [`www/README.md`](./www/README.md).

Pushes to `main` run semantic-release, which updates the changelog and package version, publishes to npm, creates a GitHub release, and publishes the generated tarball to GitHub Packages.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
