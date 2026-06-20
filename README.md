# 11ai

Reusable AI-agent skills for building AI chat products, integrating application services, improving web interfaces, and maintaining JavaScript projects.

Each skill is a self-contained directory led by a `SKILL.md` file. Some skills also include references, scripts, or agent metadata. Use the whole directory so those supporting files remain available.

## Install

Install the collection with the [skills.sh CLI](https://skills.sh/docs/cli):

```bash
npx skills add @rj11io/11ai
```

The CLI runs through `npx`, so it does not require a separate global installation. It discovers the skills in this package and configures the ones you select for your AI agent.

After installation, ask your agent to use a skill by name when the task calls for it. For example:

```text
Use 11ai-ai-chat-stack to add a complete AI chat surface to this application.
```

See the [skills.sh documentation](https://skills.sh/docs) for more about the skills ecosystem and supported agents.

### Package-only installation

Install the npm package directly only when you need a versioned copy of the raw skill files rather than agent configuration:

```bash
npm install --save-dev @rj11io/11ai
```

The files will be available at `node_modules/@rj11io/11ai/11ai/v0/skills/`. You can also clone this repository and use [`11ai/v0/skills`](./11ai/v0/skills) directly.

## Use a skill

Choose the skill that matches the task and name it in your request to the agent. Each skill is a self-contained directory; keep the complete directory together if you copy or vendor it manually so its references, scripts, and agent metadata remain available.

Skills provide implementation guidance and examples. They do not install the application dependencies shown in their examples or modify a project by themselves.

## Skill catalog

### AI chat

| Skill | Use it for |
| --- | --- |
| [`11ai-ai-chat-stack`](./11ai/v0/skills/ai-chat/11ai-ai-chat-stack/SKILL.md) | Building an end-to-end, tool-using chat in a Next.js App Router application with the Vercel AI SDK |
| [`11ai-ai-chat-client-hooks`](./11ai/v0/skills/ai-chat/11ai-ai-chat-client-hooks/SKILL.md) | Wiring `useChat`, streaming state, restored history, session changes, and persistence |
| [`11ai-ai-chat-session-mgmt`](./11ai/v0/skills/ai-chat/11ai-ai-chat-session-mgmt/SKILL.md) | Adding chat history and session create, rename, pin, delete, and persistence behavior |
| [`11ai-ai-chat-autotitle`](./11ai/v0/skills/ai-chat/11ai-ai-chat-autotitle/SKILL.md) | Generating non-blocking titles for new chat sessions |
| [`11ai-ai-chat-tool-design`](./11ai/v0/skills/ai-chat/11ai-ai-chat-tool-design/SKILL.md) | Designing bounded, token-efficient AI SDK tools grounded in application data |
| [`11ai-ai-chat-ui-ux`](./11ai/v0/skills/ai-chat/11ai-ai-chat-ui-ux/SKILL.md) | Building a polished chat layout, empty states, feedback states, and responsive behavior |
| [`11ai-ai-chat-multiple-models`](./11ai/v0/skills/ai-chat/11ai-ai-chat-multiple-models/SKILL.md) | Supporting model selection, multiple providers, request routing, and per-session model persistence |
| [`11ai-ai-chat-github-provider`](./11ai/v0/skills/ai-chat/11ai-ai-chat-github-provider/SKILL.md) | Using GitHub Models through its OpenAI-compatible endpoint with the Vercel AI SDK |
| [`11ai-aichat-chatbot-extension`](./11ai/v0/skills/ai-chat/11ai-aichat-chatbot-extension/SKILL.md) | Extending a web assistant to Slack or another messaging platform with the Chat SDK |

Start with `11ai-ai-chat-stack` for a new chat surface; use the narrower companion skills when implementing or debugging one layer.

### Integrations

| Skill | Use it for |
| --- | --- |
| [`11ai-convex-integration`](./11ai/v0/skills/integrations/11ai-convex-integration/SKILL.md) | Adding Convex data, backend functions, providers, environments, and deployment configuration |
| [`11ai-workos-integration`](./11ai/v0/skills/integrations/11ai-workos-integration/SKILL.md) | Adding WorkOS AuthKit to a Next.js application |
| [`11ai-workos-convex-integration`](./11ai/v0/skills/integrations/11ai-workos-convex-integration/SKILL.md) | Combining WorkOS authentication and Convex in one application |

### Codebase maintenance

| Skill | Use it for |
| --- | --- |
| [`11ai-playwright-setup`](./11ai/v0/skills/codebase/11ai-playwright-setup/SKILL.md) | Adding Playwright unit-style and browser E2E tests, scripts, artifacts, and CI wiring |
| [`11ai-npm-publishing`](./11ai/v0/skills/codebase/11ai-npm-publishing/SKILL.md) | Preparing and publishing npm packages locally or through semantic-release |
| [`11ai-automated-releases`](./11ai/v0/skills/codebase/11ai-automated-releases/SKILL.md) | Automating changelogs, versioning, tags, and GitHub releases without registry publishing |

### Utilities

| Skill | Use it for |
| --- | --- |
| [`11ai-web-design`](./11ai/v0/skills/utils/11ai-web-design/SKILL.md) | Designing or restyling distinctive, production-quality web interfaces |
| [`11ai-compression`](./11ai/v0/skills/utils/11ai-compression/SKILL.md) | Compressing Markdown guidance while preserving its structure and technical artifacts |

## Package layout and versioning

```text
11ai/
  index.js                 Package entry point
  v0/
    skills/
      ai-chat/
      codebase/
      integrations/
      utils/
```

`v0` is the current skill-format namespace. Pin the npm package version or commit when reproducibility matters, because skill content can change between package releases. See [`CHANGELOG.md`](./CHANGELOG.md) for release history.

The CommonJS entry point currently exposes package metadata only:

```js
const elevenAI = require("@rj11io/11ai")

console.log(elevenAI.name) // "@rj11io/11ai"
```

The supported consumer surface is the skill content under `11ai/v0/skills`, not a JavaScript runtime API.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
