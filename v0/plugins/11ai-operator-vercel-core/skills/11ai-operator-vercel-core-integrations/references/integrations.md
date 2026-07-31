# Vercel Core Platform integrations reference

These patterns are standalone and do not require another 11ai plugin.

## Git and CI

Bind one repository to the intended project and define preview and production branch policy. Require checks before promotion and correlate each deployment to an immutable commit.

## DNS and traffic

Confirm authoritative DNS, domain ownership, TLS, redirects, CDN cache policy, and rollback before changing records or aliases.

## Data and identity

Use environment-scoped, least-privilege credentials and private networking where required. Keep server credentials out of client bundles and logs.

## Observability

Correlate deployment, request, function, region, and source commit. Export structured redacted signals only to approved destinations with known retention.

## Incident process

Define who can roll back, change firewall rules, disable integrations, rotate credentials, and communicate impact. Preserve logs and deployment IDs before mutation.

## Verification

Test build, preview, denied access, dependency failure, traffic path, telemetry, and rollback. Production promotion always remains an explicit action.
