# HTML5 integrations reference

These patterns are standalone. They describe the seam around HTML without requiring any other 11ai plugin.

Use the current HTML5 family defined by the WHATWG Living Standard at <https://html.spec.whatwg.org/>, verified 31 July 2026. Check conformance and browser support per feature instead of targeting a frozen HTML5 snapshot.

## Build and development

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Use one authoritative source configuration. Development, test, and production commands should consume the same public contract even when their optimizations differ.

## Tests

Test observable behavior in the intended browsers and assistive technologies. Keep fixtures deterministic, bound generated output, and avoid snapshots so broad that a breaking change becomes unreadable.

## CI

Run the repository's existing format or lint check, focused tests, and production build. Cache only dependency or compiler artifacts whose keys include the lockfile and active configuration.

## Runtime and deployment

Inspect the final HTML document for source maps, public environment values, compatibility, and size. Never copy server credentials into browser-delivered assets or logs.

## Contract changes

Treat exported APIs, selectors, element semantics, routes, serialized data, and generated filenames as contracts when consumers depend on them. Preview consumers before renaming or removal and obtain approval for breaking changes.

## Integration verification

Verify both producer and consumer, one failure path, one production-mode build, and the rollback. Report ownership of every generated artifact and environment value.
