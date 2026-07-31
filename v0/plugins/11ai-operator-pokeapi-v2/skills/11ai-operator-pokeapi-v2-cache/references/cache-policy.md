# PokéAPI v2 cache policy

## Entry states

| State | Meaning | Safe action |
| --- | --- | --- |
| Absent | No complete body and metadata pair | One single-flight network request |
| Fresh enough | Valid body satisfies the caller's stated policy | Return it with no network request |
| Revalidation requested | Caller needs a freshness check | Conditional `GET` when a validator exists |
| Stale allowed | Refresh failed and policy permits fallback | Return last-known-good with a visible stale marker |
| Corrupt | Digest, JSON parse, URL, or schema check fails | Quarantine exact entry, then fetch once |
| Negative | Bounded record of a `404` | Return until its explicit short expiry |

Do not label an entry stale merely because an arbitrary short TTL elapsed. PokéAPI resources are commonly stable, and the fair-use policy prioritizes local reuse. Freshness is a product requirement that the caller should state.

## Revalidation sequence

1. Canonicalize and same-origin-check the URL.
2. Read and validate body plus metadata.
3. Return immediately unless refresh is requested.
4. Acquire or join the per-key single-flight operation.
5. If metadata has an ETag, send `If-None-Match`; otherwise use `If-Modified-Since` when available.
6. On `304`, retain the body and atomically update metadata.
7. On `200`, validate content type, JSON, URL expectations, and resource identity, then atomically replace body and metadata.
8. On `404`, preserve the previous successful body and report the conflict before creating a negative entry.
9. On transient failure, apply a finite retry policy; after it ends, keep last-known-good data.
10. Release the key lock and publish counters.

Never send both a conditional request and an unconditional retry in parallel.

## Atomic entry layout

```text
CACHE_DIR/
  objects/
    HASH.json
    HASH.meta.json
  locks/
    HASH.lock
  quarantine/
    TIMESTAMP-HASH.json
    TIMESTAMP-HASH.meta.json
```

Write temporary files in the same filesystem as `objects/`, validate them, then rename. Replacing body and metadata is not one atomic operation, so metadata should carry the body digest and readers should reject mismatched pairs. A small SQLite store can provide transactional replacement instead.

## Stampede controls

- In one process, map a key to the promise already fetching it.
- Across processes, use a lock with owner identity, acquisition time, timeout, and stale-lock recovery.
- After acquiring the lock, read the cache again because another process may have filled it while this process waited.
- Bound wait time and report lock contention. Do not poll in a tight loop.
- Lock per key, not globally.
- Add jitter only to retry or refresh scheduling; do not create periodic background refresh unless the user asks.

## Bulk request budget

Before following pages, compute:

```text
page_count = ceil(min(server_count, requested_cap) / page_limit)
page_misses = pages whose canonical URLs are absent
detail_misses = requested detail URLs absent from cache
estimated_network_requests = page_misses + detail_misses
```

Report the estimate and concurrency. A large `limit` can create a heavy single response and does not remove the requirement to cache it. Prefer a modest explicit page size already used by the project.

## Eviction review

Preview exact keys and bytes. Broad patterns, storage schema changes, and key-function changes are equivalent to a purge because they make existing entries unreachable. Move recoverable entries to quarantine first, record the reason and original URL, and let the user decide when quarantine can be removed permanently.
