# Vercel AI Gateway integrations reference

These patterns are standalone and describe Vercel AI Gateway seams without requiring another 11ai plugin.

## Identity and credentials

Use short-lived, least-privilege credentials when available. Bind identity to exact project and environment and never forward raw tokens to clients.

## Actions and persistence

Validate tool or event inputs, use idempotency for retries, store only required state, and define retention and deletion ownership.

## Observability

Record operation IDs, status, duration, provider or adapter, usage, cost, approvals, and redacted errors. Keep content out of logs by default.

## Tests and CI

Mock external services routinely. Keep live smoke tests opt-in, bounded, non-destructive, and isolated from production.

## Deployment

Compare preview and production variables, permissions, callback URLs, budgets, policies, and resource IDs before promotion.

## Report

State trust boundary, scope, credentials by name, retained data, idempotency, approvals, observability, checks, and rollback.
