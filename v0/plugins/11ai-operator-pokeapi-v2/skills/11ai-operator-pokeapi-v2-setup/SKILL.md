---
name: 11ai-operator-pokeapi-v2-setup
description: "Set up a PokéAPI v2 client from zero with the official HTTPS base URL, GET-only transport, a persistent local response cache, normalized URL keys, atomic writes, per-key single-flight, bounded retries, pagination caps, request accounting, and a two-read cache verification. Use when an application has no PokéAPI v2 wiring, when its cache is only in memory, or when the user asks to configure a fair-use client."
---
# 11ai PokéAPI v2 setup

PokéAPI v2 needs no account or API key; the essential setup is a persistent cache that is consulted before every `GET`. Use `11ai-operator-pokeapi-v2-environment` first so existing client and cache choices are preserved.

## Gather decisions

Confirm these values from the repository or user before editing:

- The runtime and HTTP client already used by the application.
- A project-local or user-local `CACHE_DIR` that persists across runs.
- Whether the cache is shared by several processes and therefore needs a cross-process lock.
- The maximum result count for any planned list traversal and the allowed request concurrency.
- How callers explicitly request freshness; do not invent a short TTL for stable resources.

The base URL is `https://pokeapi.co/api/v2/`. Reject non-HTTPS origins, paths outside `/api/v2/`, methods other than `GET`, and caller-controlled absolute URLs unless they pass the same-origin check.

## Configure the cache-first client

Use environment names without secrets:

```text
POKEAPI_BASE_URL=https://pokeapi.co/api/v2/
POKEAPI_CACHE_DIR=.cache/pokeapi-v2
POKEAPI_USER_AGENT=APP_NAME/APP_VERSION CONTACT_URL
```

Do not invent the user-agent identity or contact URL. Add the runtime cache directory to `.gitignore`; commit only an empty example configuration. Read [references/setup.md](references/setup.md) for Node, Python, and shell implementations.

The request path must run in this order: normalize the same-origin URL, derive the key from the full URL including sorted query parameters, read a validated cached body, join an existing in-flight request for that key, perform one network `GET`, validate the status and JSON shape, atomically store body and metadata, then return it.

Retries must be finite, delayed with backoff and jitter, and limited to transient failures. Honor `Retry-After` when present. Do not retry `404`, and do not fan retries out across multiple workers.

## Verify with one resource

Use a single known resource such as `pokemon/ditto/` only after confirming it is absent from the chosen cache:

1. First read: at most one network request, then an atomic cache entry.
2. Second read in a new process: zero network requests and the same `id` and `name`.
3. Concurrent duplicate reads: one upstream request through single-flight.
4. A malformed cached body: quarantined or ignored, not returned as valid data.
5. A list request: reads the first page and `count` without automatically following `next`.
6. An explicit refresh: revalidates one key and keeps the last-known-good body if the network fails.

Do not enumerate all endpoints as a setup test. Two reads of one small resource prove persistence without imposing a crawl.

## Guardrails

Never add an API key, authorization header, background polling loop, eager recursive hydration, unbounded page traversal, or unbounded retry. Do not purge an existing cache to prove the setup; use a distinct test key or inspect metadata. Report files and configuration names added, the exact cache directory, key and lock strategy, retry and pagination bounds, and the network-request counts for both verification reads.
