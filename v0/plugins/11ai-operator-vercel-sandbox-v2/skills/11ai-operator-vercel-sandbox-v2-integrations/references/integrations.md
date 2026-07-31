# Vercel Sandbox integrations reference

These patterns are standalone and describe Vercel Sandbox seams without requiring another 11ai plugin.

## Identity and input

Use least-privilege short-lived credentials and validate every event, file, command, or payload before execution.

## State and idempotency

Persist stable IDs and checkpoints, make retryable steps idempotent, define lock and timeout ownership, and retain only needed data.

## Limits and observability

Record IDs, states, attempts, duration, usage, approvals, and redacted errors. Enforce explicit compute, network, storage, retry, and concurrency bounds.

## Tests and CI

Mock routine external operations. Keep live tests opt-in, bounded, isolated, and self-cleaning.

## Deployment

Compare preview and production scopes, credentials, permissions, resources, policies, and cleanup before promotion.

## Report

State trust boundary, IDs, credentials by name, persisted data, limits, idempotency, observability, cleanup, and rollback.
