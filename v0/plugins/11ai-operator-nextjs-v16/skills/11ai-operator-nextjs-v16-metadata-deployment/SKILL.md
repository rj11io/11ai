---
name: 11ai-operator-nextjs-v16-metadata-deployment
description: "Operate Next.js metadata, icons, Open Graph images, robots and sitemaps, image and font assets, environment variables, production builds, previews, and deployment configuration. Use when adding SEO metadata, fixing assets, preparing production, or changing runtime and deployment behavior."
---
# 11ai Next.js v16 metadata and deployment

Built metadata and deployment settings are public contracts with crawlers, users, and the hosting runtime Resolve the exact route or component, execution boundary, public contract, target configured Node.js, Edge, build-time, and browser runtimes, and acceptance check first.

Version baseline: Target the current Next.js 16 release with App Router, React 19.2, Turbopack by default, Cache Components and use cache, proxy.ts, async request APIs, and Node.js 20.9 or newer.

## Inspect first

```bash
rg -n 'generateMetadata|metadata|robots|sitemap|next/image|next/font|runtime|output|turbopack|proxy\.ts' app src/app next.config.* proxy.ts src/proxy.ts 2>/dev/null
npx next info
```

Resolve deployed origins, indexing intent, asset ownership, Turbopack configuration, the `proxy.ts` network boundary, runtime target, environment scopes, and current deployment process.

Confirm before changing:

- Absolute canonical and social URLs.
- Server-only versus public environment values.
- Image and font optimization boundaries.
- Preview versus production promotion.

## Operate

```bash
npm run build
npx next start --help
```

Generate metadata from trusted route data, keep public variables explicit, and inspect production output before any deployment.

Never change robots or canonical hosts, expose secrets with public prefixes, delete deployments, or promote production without explicit approval Require explicit approval for broader or destructive changes and preview every affected route, component, caller, or deployment.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Inspect built metadata and assets, direct-load routes in production mode, compare preview settings, and state that deployment was or was not performed. Report target, files, boundaries, public behavior, accessibility and performance impact, checks, and rollback. Hand config failures to `11ai-operator-nextjs-v16-troubleshooting` and seams to `11ai-operator-nextjs-v16-integrations`.
