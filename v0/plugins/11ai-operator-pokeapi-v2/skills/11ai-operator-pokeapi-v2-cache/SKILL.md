---
name: 11ai-operator-pokeapi-v2-cache
description: "Design, inspect, revalidate, repair, and selectively evict a persistent PokéAPI v2 response cache, including canonical URL keys, query-aware list pages, atomic bodies and metadata, validators, last-known-good fallback, per-key single-flight, cross-process locks, negative entries, and request accounting. Use when adding cache behavior, investigating repeated requests or stale data, refreshing a resource, or cleaning specific cached entries."
---
# 11ai PokéAPI v2 cache

The cache is part of the API contract, not an optional optimization. Resolve its directory, storage backend, ownership, key format, and freshness policy before reading or changing any entry.

## Inspect first

```bash
find CACHE_DIR -type f -print 2>/dev/null | head -50
find CACHE_DIR -type f 2>/dev/null | wc -l
du -sh CACHE_DIR 2>/dev/null
```

Inspect one metadata record and its body digest. Confirm the key covers the canonical full URL, including `limit`, `offset`, and repeated query values; the metadata records the URL, status, fetch time, content type, validators, and digest; and writes use a temporary file plus atomic rename.

```bash
jq '{url,status,contentType,fetchedAt,etag,lastModified,sha256}' ENTRY.meta.json
jq '{id,name}' ENTRY.json
```

Do not print large bodies. Never infer which URL a hash represents without metadata.

## Read and revalidate

Read a validated local body before opening the network. A normal lookup should have no TTL-driven request unless the application has an explicit freshness requirement. For an explicit refresh, send `If-None-Match` or `If-Modified-Since` only when the matching entry supplied that validator.

On `304`, keep the body and update revalidation metadata. On a successful `200`, validate JSON and same-resource expectations before atomically replacing the entry. On timeout, `5xx`, invalid JSON, or digest mismatch, preserve the last-known-good body and report whether it was served stale.

Use one in-flight operation per key. A shared filesystem used by several processes needs a bounded cross-process lock as well as an in-process promise map. Avoid global locks that serialize unrelated keys.

## Bulk and negative entries

Each list page is a separate entry. Read the first page and `count`, calculate how many uncached pages and detail resources the operation would miss on, state that estimate, then obtain approval for an unrequested bulk fetch. Never recursively hydrate every linked URL.

Do not cache connection failures or `5xx` as successful data. A bounded negative cache for `404` may prevent repeated typos, but its duration must be explicit and shorter than stable successful entries because the dataset can grow.

## Evict safely

Eviction is the destructive operation. Preview the exact URL, derived key, files, byte count, and dependent aliases before removing anything:

```bash
find CACHE_DIR -type f -name 'KEY*' -print
find CACHE_DIR -type f -name 'KEY*' -exec du -ch {} +
```

Require approval for the exact target. Prefer moving entries to a quarantine directory over permanent deletion. A whole-cache purge, wildcard deletion, schema migration, or changing the key function can turn the next application start into a crawl; preview the entire miss estimate and obtain explicit approval first.

Read [references/cache-policy.md](references/cache-policy.md) for the entry state machine, revalidation algorithm, and cache-stampede controls.

## Report

State the cache directory and backend, canonical URL and key, previous state, action taken, resulting state, files and bytes changed, and counters for hits, misses, stale responses, revalidations, network requests, and retries. For eviction, include the approved target and recovery path. Hand missing cache setup to `11ai-operator-pokeapi-v2-setup` and request failures to `11ai-operator-pokeapi-v2-troubleshooting`.
