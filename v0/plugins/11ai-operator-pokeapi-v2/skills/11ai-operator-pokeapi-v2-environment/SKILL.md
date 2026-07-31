---
name: 11ai-operator-pokeapi-v2-environment
description: "Inspect a PokéAPI v2 client's base URL, HTTP stack, persistent cache directory, cache metadata, retry and concurrency policy, pagination bounds, and ability to read one known resource without changing configuration. Use before a PokéAPI operation, when request volume is uncertain, when cached data looks wrong, or when someone asks whether the client is configured for fair use."
---
# 11ai PokéAPI v2 environment

Establish where requests go and whether successful responses survive across processes before making a network call. This skill is read-only: do not install packages, create cache files, purge entries, change the base URL, or repair the client.

## Inspect the client

```bash
rg -n "pokeapi\.co|POKEAPI_|api/v2" . --glob '!node_modules' --glob '!dist' --glob '!build'
rg -n "retry|backoff|concurr|semaphore|cache|etag|last-modified" . --glob '!node_modules' --glob '!dist'
```

Confirm the configured base URL is exactly `https://pokeapi.co/api/v2/`, all remote operations are `GET`, and no API key or authorization header was invented. Identify the call sites before sending any request.

Inspect dependency manifests for a cache-aware wrapper or HTTP cache rather than assuming one exists:

```bash
rg -n "pokedex-promise-v2|pokeapi-js-wrapper|pokebase|requests-cache|http-cache-semantics|keyv" package.json package-lock.json pnpm-lock.yaml yarn.lock pyproject.toml requirements.txt requirements-dev.txt 2>/dev/null
```

## Inspect the persistent cache

```bash
find CACHE_DIR -type f 2>/dev/null | wc -l
du -sh CACHE_DIR 2>/dev/null
find CACHE_DIR -type f -print 2>/dev/null | head -20
```

Resolve `CACHE_DIR` from code, configuration, or the user; never guess it. Verify it is persistent across process restarts, excluded from version control when it contains runtime metadata, and stores the full normalized URL plus status, fetch time, and validators separately from the body.

Check one cached body without changing its access time if the platform supports it. Do not dump an entire large body into the transcript; show only the resource `id`, `name`, and metadata.

## Interpret the policy

- **No cache directory or only an in-memory map** — the client does not meet the fair-use requirement across runs. Hand off to `11ai-operator-pokeapi-v2-setup`.
- **Keys omit query parameters** — paginated list pages can overwrite one another and return wrong results.
- **Retries are unbounded or concurrent requests have no cap** — one outage can become a request storm.
- **Every read has a short unconditional TTL** — stable resources are being refetched without a stated freshness need.
- **The browser calls PokéAPI directly for each user** — caches are fragmented across clients; consider a shared server cache through `11ai-operator-pokeapi-v2-integrations`.
- **A cached 404 never expires** — a resource added later remains hidden; negative-cache policy must be bounded and explicit.

## Report

State the base URL, runtime and HTTP client, cache directory and persistence, entry count and bytes, key components, whether validators are recorded, retry and concurrency bounds, pagination cap, and whether requests are centralized or browser-direct. Report the cache as healthy, incomplete, or absent. Do not fix anything; name the smallest next step and hand missing cache support to setup, cache defects to `11ai-operator-pokeapi-v2-cache`, and active errors to troubleshooting.
