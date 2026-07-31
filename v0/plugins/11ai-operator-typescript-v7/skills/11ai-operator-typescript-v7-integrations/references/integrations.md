# TypeScript integrations reference

These patterns are standalone and describe TypeScript seams without requiring another 11ai plugin.

## Build and package

Keep one authoritative configuration. Development, tests, packages, and production builds must agree on module resolution, public exports, and runtime targets.

## Tests

Test observable behavior and failure paths in configured JavaScript runtimes and package consumers. Keep fixtures deterministic and snapshots reviewable.

## CI

Run existing lint or format checks, focused tests, type or syntax checks, and the production build. Key compiler caches with lockfile and configuration inputs.

## Runtime boundaries

Separate browser, server, worker, and build-time globals. Never leak environment values, source-map source content, generated credentials, or user data embedded in fixtures into client bundles, source maps, logs, or serialized props.

## Contract changes

Treat exports, event shapes, serialized data, DOM behavior, and generated declarations as public when consumers depend on them. Preview callers before rename or removal.

## Verify

Run producer and consumer checks, inspect the artifact, exercise one failure, and state rollback and ownership.
