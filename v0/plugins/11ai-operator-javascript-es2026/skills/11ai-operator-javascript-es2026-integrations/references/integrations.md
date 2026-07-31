# JavaScript integrations reference

These patterns are standalone and describe JavaScript seams without requiring another 11ai plugin.

## Build and package

Keep one authoritative configuration. Development, tests, packages, and production builds must agree on module resolution, public exports, and runtime targets.

## Tests

Test observable behavior and failure paths in browser, server, worker, or embedded JavaScript runtimes. Keep fixtures deterministic and snapshots reviewable.

## CI

Run existing lint or format checks, focused tests, type or syntax checks, and the production build. Key compiler caches with lockfile and configuration inputs.

## Runtime boundaries

Separate browser, server, worker, and build-time globals. Never leak tokens, cookies, personal data, full request bodies, or server-only environment values into client bundles, source maps, logs, or serialized props.

## Contract changes

Treat exports, event shapes, serialized data, DOM behavior, and generated declarations as public when consumers depend on them. Preview callers before rename or removal.

## Verify

Run producer and consumer checks, inspect the artifact, exercise one failure, and state rollback and ownership.
