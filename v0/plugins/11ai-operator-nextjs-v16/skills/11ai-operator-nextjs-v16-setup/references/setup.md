# Next.js v16 setup reference

Use the Next.js 16 upgrade guide at <https://nextjs.org/docs/app/guides/upgrading/version-16> and current documentation at <https://nextjs.org/docs>. Confirm Node.js 20.9 or newer and React 19.2 before applying examples.

## Decisions

Confirm root, package manager, target configured Node.js, Edge, build-time, and browser runtimes, renderer or router mode, source tree, styling, testing, public contracts, and deployment expectations.

## Inspect

```bash
npx next info
rg --files app pages src/app src/pages 2>/dev/null | head -120
rg -n 'use client|use server|use cache|generateStaticParams|revalidate|runtime' app src/app 2>/dev/null | head -120
```

Preserve active configuration and do not invent Next.js version, App or Pages Router, runtime, cache policy, rendering mode, deployment target, or environment ownership.

## Install

```bash
npm install next@^16 react@^19.2 react-dom@^19.2
npx next info
```

Run scaffolders in a new or explicitly approved directory, preview all generated files, and stop their dev server before editing.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise one representative Next.js route, server output, and client bundle in development and production mode, including a failure or loading state.

## Secrets and generated output

Never print or commit server environment values, cookies, tokens, request bodies, signed URLs, or serialized private data. Do not patch generated output or expose server-only values across a client boundary.

## Report

List versions, files, boundaries, routes or components, checks, output, and rollback.
