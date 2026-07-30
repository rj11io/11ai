# 11ai Node.js API operator

Twelve standalone skills for scaffolding, inspecting, changing, testing, integrating, and troubleshooting Node.js APIs across common frameworks such as Express, Fastify, Koa, Hono, and NestJS.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-nodejs-api-cheatsheet`](./skills/11ai-operator-nodejs-api-cheatsheet/SKILL.md) | Looking up common Node.js API commands, patterns, status codes, and diagnostics |
| [`11ai-operator-nodejs-api-setup`](./skills/11ai-operator-nodejs-api-setup/SKILL.md) | Scaffolding a new API: framework, TypeScript, validated configuration, health route, graceful shutdown, and scripts |
| [`11ai-operator-nodejs-api-environment`](./skills/11ai-operator-nodejs-api-environment/SKILL.md) | Inspecting the runtime, package manager, framework, scripts, configuration, and local prerequisites |
| [`11ai-operator-nodejs-api-integrations`](./skills/11ai-operator-nodejs-api-integrations/SKILL.md) | Wiring databases, queues, auth providers, webhook receivers, logging, tracing, containers, proxies, and pipelines |
| [`11ai-operator-nodejs-api-server`](./skills/11ai-operator-nodejs-api-server/SKILL.md) | Starting, checking, observing, and safely stopping a local API server |
| [`11ai-operator-nodejs-api-routes`](./skills/11ai-operator-nodejs-api-routes/SKILL.md) | Adding, changing, inspecting, and verifying HTTP routes while following project conventions |
| [`11ai-operator-nodejs-api-validation`](./skills/11ai-operator-nodejs-api-validation/SKILL.md) | Validating request bodies, query strings, path parameters, and headers |
| [`11ai-operator-nodejs-api-errors`](./skills/11ai-operator-nodejs-api-errors/SKILL.md) | Designing or repairing consistent API errors, status mapping, and safe logging |
| [`11ai-operator-nodejs-api-auth`](./skills/11ai-operator-nodejs-api-auth/SKILL.md) | Adding or debugging API-key, bearer-token, JWT, or existing middleware authentication |
| [`11ai-operator-nodejs-api-http-client`](./skills/11ai-operator-nodejs-api-http-client/SKILL.md) | Calling upstream APIs with fetch or the project's existing HTTP client safely |
| [`11ai-operator-nodejs-api-testing`](./skills/11ai-operator-nodejs-api-testing/SKILL.md) | Writing and running focused unit, route, integration, and contract tests |
| [`11ai-operator-nodejs-api-troubleshooting`](./skills/11ai-operator-nodejs-api-troubleshooting/SKILL.md) | Diagnosing startup, routing, auth, validation, upstream, test, and runtime failures |

## How the skills compose

Start with `11ai-operator-nodejs-api-environment` when the project is unfamiliar. Pair `11ai-operator-nodejs-api-routes` with `11ai-operator-nodejs-api-validation`, `11ai-operator-nodejs-api-errors`, and `11ai-operator-nodejs-api-testing` when changing an endpoint. Use `11ai-operator-nodejs-api-server` for local runtime work and hand failures to `11ai-operator-nodejs-api-troubleshooting` with the evidence already collected.

The skills discover and preserve the project's existing framework, package manager, response envelope, authentication, test runner, and configuration conventions. They do not silently install dependencies, expose secrets, call production services, kill unrelated processes, or change public contracts without making the impact clear.

## Likely follow-on skills

Good candidates for a later release are database and CRUD operations, pagination and filtering, rate limiting, OpenAPI generation, background jobs, GraphQL, file uploads, and API versioning. Webhook signature verification, observability and request correlation, and deployment or runtime configuration now live in `11ai-operator-nodejs-api-integrations`.
