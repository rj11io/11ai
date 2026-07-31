---
name: 11ai-operator-vercel-sandbox-v2-commands-files
description: "Execute Vercel Sandbox commands and operate files with explicit argv, working directories, environment allowlists, streaming output, upload, download, atomic writes, and path validation. Use when running code in a sandbox, transferring files, streaming logs, or modifying a sandbox filesystem."
---
# 11ai Vercel Sandbox v2 commands and files

Sandbox isolation reduces host risk but does not make arbitrary commands or data handling safe Resolve the exact project, environment, resource or run, state boundary, permissions, limits, and acceptance check before acting.

Version baseline: Target @vercel/sandbox 2.9 within major 2 and the current Sandbox CLI. Use persistent-by-default sandboxes, current Node.js and Python images, custom VCR images, multi-user isolation, and v2 lifecycle semantics.

## Inspect first

```bash
rg -n 'runCommand|command|stdout|stderr|writeFile|readFile|upload|download|cwd' TARGET
npm test --if-present -- TARGET
```

Resolve exact sandbox, command argv, working directory, environment names, input files, output paths, timeout, and expected exit code.

Confirm before changing:

- Argument arrays rather than shell concatenation.
- Path containment and size limits.
- Environment allowlist without secret logs.
- Exit, signal, stdout, and stderr handling.

## Operate

```bash
npm test --if-present -- TARGET
npm run typecheck --if-present
```

Validate paths, upload only required files, use bounded output, and write through temporary paths when replacing files.

Never execute model or user text as a shell command, upload secrets, use sudo, or overwrite and download data without approval Require explicit approval and preview exact resources, commands or steps, counts, limits, cost, cleanup, and rollback.

## Verify and report

```bash
npm run typecheck --if-present
npm test --if-present
npm run build --if-present
```

Test invalid paths, oversized files, timeout, nonzero exit, output truncation, concurrent writes, and cleanup. Report scope, IDs, state transitions, files, remote actions, usage, checks, cleanup, and rollback. Hand configuration failures to `11ai-operator-vercel-sandbox-v2-troubleshooting` and seams to `11ai-operator-vercel-sandbox-v2-integrations`.
