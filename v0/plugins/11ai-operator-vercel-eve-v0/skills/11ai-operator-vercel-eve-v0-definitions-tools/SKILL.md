---
name: 11ai-operator-vercel-eve-v0-definitions-tools
description: "Create and operate eve agent definitions, instructions, model configuration, skills, MCP connections, and typed tools with explicit authority and validation. Use when defining an agent, adding knowledge or tools, configuring a model, or connecting an MCP server."
---
# 11ai Vercel eve v0 definitions and tools

An eve agent directory declares identity and capability, while every tool creates a real authority boundary Resolve the exact project, environment, remote target, permission and cost boundary, and acceptance check before acting.

Version baseline: Target the eve 0.27 preview line. Because APIs may change within major zero, inspect bundled docs and types and pin the exact minor and patch used in production.

## Inspect first

```bash
find agent -maxdepth 3 -type f 2>/dev/null | sort
rg -n 'defineAgent|defineTool|inputSchema|defineMcpClientConnection|model:' agent 2>/dev/null
```

Read instructions, model, tool schemas, connections, secrets, and external side effects before expanding the directory.

Confirm before changing:

- Narrow instructions and model policy.
- Tool input validation and least privilege.
- Skill descriptions that trigger precisely.
- Connection origin and credential scope.

## Operate

```bash
npm run typecheck --if-present
npx eve dev --help
```

Add one focused file, keep tool results compact, separate reads from writes, and gate consequential execution behind durable approval.

Never add arbitrary shell, SQL, filesystem, or network tools, broaden connection scopes, or call a live tool without approval Require explicit approval and preview targets, permissions, counts, cost, remote effects, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npx eve eval --help 2>/dev/null || true
```

Typecheck, inspect discovery, invoke with mocked dependencies, and test invalid input, denial, timeout, duplicate execution, and redaction. Report scope, target IDs, files, remote actions, permissions, cost, checks, observability, and rollback. Hand configuration failures to `11ai-operator-vercel-eve-v0-troubleshooting` and seams to `11ai-operator-vercel-eve-v0-integrations`.
