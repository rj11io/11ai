---
name: 11ai-vercel-analytics
description: "Add, configure, or verify Vercel Web Analytics in web applications using the official `@vercel/analytics` package. Use when Codex needs to enable page-view analytics, integrate the Analytics component into Next.js App Router or Pages Router projects, diagnose missing Vercel analytics traffic, or confirm an existing installation without adding a separate analytics provider."
---

# 11ai Vercel Analytics

Set up Vercel Web Analytics with the project’s existing framework and package manager. Follow the official quickstart and keep the default integration minimal.

Read [references/implementation.md](references/implementation.md) before changing application code.

## Workflow

1. Inspect the framework, router, package manager, root application shell, existing analytics packages, and deployment configuration.
2. Confirm whether `@vercel/analytics` and an Analytics component already exist. Keep exactly one root integration unless the application intentionally has isolated roots.
3. Add `@vercel/analytics` with the repository’s package manager.
4. Mount the framework-specific component at the root. For Next.js, import `Analytics` from `@vercel/analytics/next` and use the App Router or Pages Router pattern from the reference.
5. Preserve providers, metadata, styling, and unrelated layout behavior.
6. Run the project’s lint, typecheck, build, and relevant tests.
7. Report the code change separately from Vercel project state. Do not claim analytics is active until Web Analytics is enabled in the Vercel dashboard and a deployment is receiving traffic.

## Rules

- Prefer automatic environment detection and the default `<Analytics />` configuration.
- Do not add `mode`, `debug`, `beforeSend`, custom endpoints, or custom events unless the user requests them or the project requires them.
- Do not add Speed Insights when the request is only for Web Analytics.
- Do not duplicate the component in nested layouts or individual pages.
- Treat dashboard enablement and deployment as external actions. Perform them only when authorized and available.
- Verify deployed collection through the analytics network request and dashboard data; local rendering alone does not prove production collection.

## Delivery

Report the installed package, integration file, verification commands, and any remaining dashboard or deployment step.
