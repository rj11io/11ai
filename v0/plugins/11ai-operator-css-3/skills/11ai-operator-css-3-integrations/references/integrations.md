# CSS3 integrations reference

These patterns are standalone. They describe the seam around CSS without requiring any other 11ai plugin.

Use the current CSS3 family represented by W3C CSS Snapshot 2025 at <https://www.w3.org/TR/css-2025/> and independently leveled modules, verified 31 July 2026. Check module stability and browser support per feature instead of targeting a frozen monolithic CSS3 specification.

## Build and development

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Use one authoritative source configuration. Development, test, and production commands should consume the same public contract even when their optimizations differ.

## Tests

Test observable behavior in the intended supported browsers and user preference modes. Keep fixtures deterministic, bound generated output, and avoid snapshots so broad that a breaking change becomes unreadable.

## CI

Run the repository's existing format or lint check, focused tests, and production build. Cache only dependency or compiler artifacts whose keys include the lockfile and active configuration.

## Runtime and deployment

Inspect the final stylesheet and rendered layout for source maps, public environment values, compatibility, and size. Never copy server credentials into browser-delivered assets or logs.

## Contract changes

Treat exported APIs, selectors, element semantics, routes, serialized data, and generated filenames as contracts when consumers depend on them. Preview consumers before renaming or removal and obtain approval for breaking changes.

## Integration verification

Verify both producer and consumer, one failure path, one production-mode build, and the rollback. Report ownership of every generated artifact and environment value.
