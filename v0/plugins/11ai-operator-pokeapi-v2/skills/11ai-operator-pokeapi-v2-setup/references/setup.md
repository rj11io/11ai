# PokéAPI v2 cache-first setup reference

PokéAPI v2 is a public, consumption-only API. It requires no authentication. Its official fair-use policy requires clients to cache requested resources locally and asks developers to limit request frequency even though the service no longer publishes a rate limit. See <https://pokeapi.co/docs/v2#fairuse>.

## Common configuration

```text
# .env.example — names and non-secret defaults only
POKEAPI_BASE_URL=https://pokeapi.co/api/v2/
POKEAPI_CACHE_DIR=.cache/pokeapi-v2
POKEAPI_USER_AGENT=
```

```gitignore
.cache/pokeapi-v2/
```

The API has no token. A `POKEAPI_API_KEY` or `Authorization` header is a setup error.

## Cache record

Store one body and one metadata record per canonical URL. A useful metadata shape is:

```json
{
  "url": "https://pokeapi.co/api/v2/pokemon/ditto/",
  "status": 200,
  "contentType": "application/json",
  "fetchedAt": "2026-01-01T00:00:00.000Z",
  "etag": null,
  "lastModified": null,
  "sha256": "BODY_DIGEST"
}
```

Do not assume the service always supplies an ETag, `Last-Modified`, or a particular `Cache-Control` value. Record validators when present and use them for explicit revalidation; otherwise refresh only when the caller has a stated freshness requirement.

## Canonical URL and key

Resolve relative paths against the official base, reject a different origin or a path outside `/api/v2/`, remove fragments, and sort query entries. Preserve every query value, including repeated keys.

```js
import crypto from "node:crypto"

const BASE = new URL("https://pokeapi.co/api/v2/")

export function canonicalUrl(input) {
  const url = new URL(input, BASE)
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) {
    throw new Error("PokéAPI URL must stay under https://pokeapi.co/api/v2/")
  }
  url.hash = ""
  const entries = [...url.searchParams.entries()].sort(([ak, av], [bk, bv]) =>
    ak.localeCompare(bk) || av.localeCompare(bv),
  )
  url.search = ""
  for (const [key, value] of entries) url.searchParams.append(key, value)
  return url.toString()
}

export function cacheKey(url) {
  return crypto.createHash("sha256").update(canonicalUrl(url)).digest("hex")
}
```

## Node request sequence

Keep the policy in one server-side client rather than duplicating it at each call site:

```js
const inFlight = new Map()

export async function getPokeApi(path, { refresh = false } = {}) {
  const url = canonicalUrl(path)
  const key = cacheKey(url)

  if (!refresh) {
    const cached = await readAndValidateEntry(key, url)
    if (cached) return { data: cached.body, cache: "hit", networkRequests: 0 }
  }

  if (inFlight.has(key)) return inFlight.get(key)

  const operation = fetchAndStore(url, key, { refresh }).finally(() => inFlight.delete(key))
  inFlight.set(key, operation)
  return operation
}
```

`fetchAndStore` should send conditional headers only from the matching metadata record, accept only a successful JSON response or `304`, write a temporary file in the same directory, `fsync` when durability matters, then rename it over the final entry. Validate the body digest on reads. If refresh fails, return the last-known-good entry with a visible `stale` status only when the caller's policy permits it.

The in-memory map coalesces requests only inside one process. Several processes sharing a directory need a lock file, database transaction, Redis lock, or equivalent per key. Locks need an owner, timeout, and stale-lock recovery; never spin without a bound.

## Python option

Use a persistent cache library or implement the same sequence around `requests`. The storage must outlive the interpreter process.

```python
import requests_cache

session = requests_cache.CachedSession(
    cache_name=".cache/pokeapi-v2/http-cache",
    backend="sqlite",
)
response = session.get("https://pokeapi.co/api/v2/pokemon/ditto/", timeout=15)
response.raise_for_status()
print({"from_cache": response.from_cache, "id": response.json()["id"]})
```

Choose expiration and stale behavior from the application's freshness needs. Do not copy a short example TTL that causes routine refetches of stable resources.

## Shell option

For a one-off request, derive the filename from the full URL and write through a temporary file. Do not use `curl URL > CACHE_FILE`; a failure can replace a valid entry with an error body or an empty file.

```bash
URL="https://pokeapi.co/api/v2/pokemon/ditto/"
KEY="$(printf '%s' "$URL" | shasum -a 256 | awk '{print $1}')"
BODY="CACHE_DIR/$KEY.json"

if test -s "$BODY"; then
  jq . "$BODY"
else
  TMP="$(mktemp "CACHE_DIR/$KEY.XXXXXX")"
  curl --fail --silent --show-error "$URL" -o "$TMP" && jq -e . "$TMP" >/dev/null && mv "$TMP" "$BODY"
fi
```

Resolve `CACHE_DIR` before running this snippet. Clean up only the exact temporary file on failure; do not purge the directory.

## Verification counters

Expose per-operation or per-test counters for `cacheHit`, `cacheMiss`, `staleServed`, `revalidated`, `networkRequest`, and `retry`. The acceptance test is simple: after a successful first read, a second read in a new process increments `cacheHit` and does not increment `networkRequest`.
