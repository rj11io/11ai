---
name: 11ai-operator-shadcn-v4-registries
description: "Discover, validate, inspect, authenticate, consume, and author shadcn v4 registries from namespaces, local sources, GitHub repositories, and private endpoints without leaking credentials or overwriting owned source blindly. Use when the user asks about registry items, registry.json, custom registries, GitHub items, private components, or publishing reusable shadcn code."
---
# 11ai shadcn v4 registries

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; registry behavior, schemas, authentication, and item provenance must come from the selected source and current official documentation.

Determine whether the task is registry discovery, item consumption, registry authoring, validation, or publication. Inspect `components.json`, configured namespaces, authentication environment, aliases, primitive base, and destination paths before any network or filesystem mutation.

## Inspect and resolve provenance

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 list REGISTRY
npx shadcn@4.14.1 search REGISTRY --query QUERY
npx shadcn@4.14.1 view ITEM
```

Record the registry URL or GitHub `owner/repo/item` address, resolved item name and type, revision, license, dependencies, files, CSS variables, environment variables, and destination paths. Never treat a similarly named community item as an official `@shadcn` item.

## Validate before consuming or publishing

```bash
npx shadcn@4.14.1 registry validate
npx shadcn@4.14.1 registry validate OWNER/REPO#REF
npx shadcn@4.14.1 add ITEM --dry-run
```

For authored registries, validate `registry.json`, every item schema, include expansion, relative paths, item dependencies, registry dependencies, and emitted build artifacts. For remote items, inspect the dry run and source before approving dependency installation or file writes.

## Protect private access

Use the documented environment-variable interpolation and authorization configuration for the exact registry. Confirm the variable exists without printing its value; redact tokens, signed URLs, authorization headers, private hostnames, and proprietary source from logs and reports.

Keep credentials outside committed files. If access fails, distinguish authentication, authorization, source resolution, schema, rate-limit, and connectivity errors with sanitized evidence.

## Verify and report

After approved changes, re-run validation, inspect generated files and imports, type-check the consumer, and test one representative render. Report provenance, revision, license, item types, files, dependencies, schema result, auth mechanism by name only, modifications preserved, and rollback path.
