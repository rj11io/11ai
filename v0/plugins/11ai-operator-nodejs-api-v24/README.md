# 11ai Node.js API v24 operator

Twenty standalone skills for Node.js 24 LTS APIs across common frameworks such as Express, Fastify, Koa, Hono, and NestJS. The reviewed baseline is the latest v24 security patch (`24.18.0`); Node 26 Current is not the production-default baseline for this operator.

## Choose a skill

| Skill | Use it for |
| --- | --- |
| [`11ai-operator-nodejs-api-v24-cheatsheet`](./skills/11ai-operator-nodejs-api-v24-cheatsheet/SKILL.md) | Looking up common Node.js API commands, patterns, status codes, and diagnostics |
| [`11ai-operator-nodejs-api-v24-setup`](./skills/11ai-operator-nodejs-api-v24-setup/SKILL.md) | Scaffolding a new API: framework, TypeScript, validated configuration, health route, graceful shutdown, and scripts |
| [`11ai-operator-nodejs-api-v24-environment`](./skills/11ai-operator-nodejs-api-v24-environment/SKILL.md) | Inspecting the runtime, package manager, framework, scripts, configuration, and local prerequisites |
| [`11ai-operator-nodejs-api-v24-integrations`](./skills/11ai-operator-nodejs-api-v24-integrations/SKILL.md) | Wiring databases, queues, auth providers, webhook receivers, logging, tracing, containers, proxies, and pipelines |
| [`11ai-operator-nodejs-api-v24-server`](./skills/11ai-operator-nodejs-api-v24-server/SKILL.md) | Starting, checking, observing, and safely stopping a local API server |
| [`11ai-operator-nodejs-api-v24-routes`](./skills/11ai-operator-nodejs-api-v24-routes/SKILL.md) | Adding, changing, inspecting, and verifying HTTP routes while following project conventions |
| [`11ai-operator-nodejs-api-v24-validation`](./skills/11ai-operator-nodejs-api-v24-validation/SKILL.md) | Validating request bodies, query strings, path parameters, and headers |
| [`11ai-operator-nodejs-api-v24-errors`](./skills/11ai-operator-nodejs-api-v24-errors/SKILL.md) | Designing or repairing consistent API errors, status mapping, and safe logging |
| [`11ai-operator-nodejs-api-v24-auth`](./skills/11ai-operator-nodejs-api-v24-auth/SKILL.md) | Adding or debugging API-key, bearer-token, JWT, or existing middleware authentication |
| [`11ai-operator-nodejs-api-v24-http-client`](./skills/11ai-operator-nodejs-api-v24-http-client/SKILL.md) | Calling upstream APIs with fetch or the project's existing HTTP client safely |
| [`11ai-operator-nodejs-api-v24-testing`](./skills/11ai-operator-nodejs-api-v24-testing/SKILL.md) | Writing and running focused unit, route, integration, and contract tests |
| [`11ai-operator-nodejs-api-v24-database`](./skills/11ai-operator-nodejs-api-v24-database/SKILL.md) | Wiring one pool per process, parameterized queries, a repository layer, and CRUD endpoints |
| [`11ai-operator-nodejs-api-v24-pagination`](./skills/11ai-operator-nodejs-api-v24-pagination/SKILL.md) | Adding cursor or offset paging, allow-listed filtering and sorting, and the indexes they need |
| [`11ai-operator-nodejs-api-v24-rate-limiting`](./skills/11ai-operator-nodejs-api-v24-rate-limiting/SKILL.md) | Rate limiting on the right key behind a proxy, with a shared store and per-route limits |
| [`11ai-operator-nodejs-api-v24-jobs`](./skills/11ai-operator-nodejs-api-v24-jobs/SKILL.md) | Moving slow work into durable background jobs with idempotent handlers and retries |
| [`11ai-operator-nodejs-api-v24-uploads`](./skills/11ai-operator-nodejs-api-v24-uploads/SKILL.md) | Accepting files with server-enforced limits, content-verified types, and generated names |
| [`11ai-operator-nodejs-api-v24-graphql`](./skills/11ai-operator-nodejs-api-v24-graphql/SKILL.md) | Adding a GraphQL surface with batching, depth and cost limits, and per-field authorization |
| [`11ai-operator-nodejs-api-v24-openapi`](./skills/11ai-operator-nodejs-api-v24-openapi/SKILL.md) | Generating an OpenAPI document from the runtime schemas and failing the build on drift |
| [`11ai-operator-nodejs-api-v24-versioning`](./skills/11ai-operator-nodejs-api-v24-versioning/SKILL.md) | Introducing an API version and retiring an old one on measured client usage |
| [`11ai-operator-nodejs-api-v24-troubleshooting`](./skills/11ai-operator-nodejs-api-v24-troubleshooting/SKILL.md) | Diagnosing startup, routing, auth, validation, upstream, test, and runtime failures |

## How the skills compose

Start with `11ai-operator-nodejs-api-v24-environment` when the project is unfamiliar. Pair `11ai-operator-nodejs-api-v24-routes` with `11ai-operator-nodejs-api-v24-validation`, `11ai-operator-nodejs-api-v24-errors`, and `11ai-operator-nodejs-api-v24-testing` when changing an endpoint. Use `11ai-operator-nodejs-api-v24-server` for local runtime work and hand failures to `11ai-operator-nodejs-api-v24-troubleshooting` with the evidence already collected.

The skills discover and preserve the project's existing framework, package manager, response envelope, authentication, test runner, and configuration conventions. They do not silently install dependencies, expose secrets, call production services, kill unrelated processes, or change public contracts without making the impact clear.
