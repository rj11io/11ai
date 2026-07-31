# Next.js integrations reference

These patterns are standalone and describe Next.js seams without requiring another 11ai plugin.

## Component and runtime boundaries

Name client, server, build, test, and worker ownership. Pass serializable data across boundaries and keep secrets server-side.

## Styling and assets

Preserve the project's stylesheet and asset pipeline. Avoid duplicate providers, loaders, or global resets.

## Data and errors

Define loading, empty, error, retry, and cancellation behavior at the seam. Do not hide errors behind an indefinite fallback.

## Tests and CI

Run existing lint, type, focused tests, and production build. Exercise accessibility, hydration, navigation, and failure behavior where applicable.

## Deployment

Inspect emitted client assets, server bundles, environment variable exposure, cache policy, and route behavior. A preview is not approval to promote production.

## Verify

Test producer, consumer, failure path, production build, and rollback. Report boundary ownership and serialized contracts.
