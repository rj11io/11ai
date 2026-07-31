---
name: 11ai-operator-pokeapi-v2-troubleshooting
description: "Diagnose PokéAPI v2 failures by separating cache, URL, identifier, pagination, version filtering, response-shape, connectivity, retry, concurrency, and upstream behavior, while preserving exact errors and avoiding request amplification. Use when requests return 404 or 5xx, data appears stale or incomplete, the wrong form or version is shown, cache hits do not occur, or a client sends more network traffic than expected."
---
# 11ai PokéAPI v2 troubleshooting

Separate observed facts from theories and protect the service while reproducing. One cached response, one canonical URL, and one bounded request tell more than a retry storm or endpoint crawl.

## Evidence collection

Capture the exact canonical URL, HTTP method, status, response content type, error text, exit code, timestamps, redirect chain, cache state, cache key, and counters without dumping large bodies. Redact any application data around the call; PokéAPI itself requires no secret.

```bash
jq '{url,status,contentType,fetchedAt,etag,lastModified,sha256}' ENTRY.meta.json 2>/dev/null
jq '{id,name}' ENTRY.json 2>/dev/null
find CACHE_DIR -type f 2>/dev/null | wc -l
du -sh CACHE_DIR 2>/dev/null
```

Inspect code for the smallest failing call, retry count, concurrency bound, page cap, and cache read-before-network ordering. Do not bypass the cache or send a live probe until local evidence cannot answer the question. If a probe is necessary, make one `GET` for the exact resource and store it through the normal cache.

## Classify the failure

- **Persistent cache miss** — URL canonicalization differs between reads, query ordering changes, writes are not atomic, the cache is ephemeral, or body and metadata digests disagree.
- **Unexpected stale result** — caller freshness policy is unclear, refresh did not run, a `304` was mishandled, or a stale fallback was served without being surfaced.
- **`404`** — wrong endpoint family, misspelled canonical name, unnamed endpoint given a name, or a species/form/machine/chain ID was reused across families.
- **Incomplete list** — only the default 20-result page was read, the cache key omitted `offset`, or traversal stopped without reporting the remaining `count`.
- **Wrong game or language** — code selected the first localized or versioned entry instead of filtering by exact language, version, or version group.
- **Wrong evolution or encounter answer** — nested alternatives or branches were flattened, nullable fields were misread, or encounter details were combined across versions.
- **`429` or `5xx`** — upstream protection or transient failure; inspect `Retry-After`, stop concurrency, and preserve last-known-good data.
- **Request spike** — recursive hydration, browser-direct calls per user, cache purge, ephemeral scale-out, missing single-flight, or synchronized retries.
- **Invalid JSON or unexpected HTML** — redirect, intermediary, upstream error page, or partial cache write; do not store it as a successful entry.

## Remediation discipline

1. Reproduce from the cache metadata and one exact resource before touching code.
2. State confidence as high, medium, or low and name missing evidence.
3. Calculate how many network requests the proposed check or fix can cause.
4. Make one bounded change with user approval when it alters cache state, retry behavior, concurrency, or pagination.
5. Quarantine one corrupt entry instead of purging the cache; preview keys, files, and bytes first.
6. Rerun the original failing lookup, then rerun it in a new process and confirm the second pass is a cache hit.
7. Stop on sustained upstream failures. Never disable caching, retry without a bound, raise concurrency speculatively, or enumerate resources to find a valid ID.

If the client, base URL, or cache is not healthy, hand off to `11ai-operator-pokeapi-v2-environment` before diagnosing domain behavior. Use setup for absent persistence and cache for key, revalidation, locking, or eviction work.

## Report

Conclude with the exact failing boundary, evidence, canonical URL and cache state, root cause or remaining uncertainty, fix applied or proposed, network-request impact, cache files changed, rollback or quarantine path, and verification results including cache hit, miss, retry, and request counts. Call out fair-use risk explicitly when the defect can amplify traffic.
