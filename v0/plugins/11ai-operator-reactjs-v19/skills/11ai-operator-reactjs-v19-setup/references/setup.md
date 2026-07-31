# React v19 setup reference

Use the React 19.2 documentation at <https://react.dev/versions> as the current source of truth and inspect local `react` and `react-dom` versions before applying examples.

## Decisions

Confirm root, package manager, target supported browser and server rendering environments, renderer or router mode, source tree, styling, testing, public contracts, and deployment expectations.

## Inspect

```bash
node -p "require('react/package.json').version" 2>/dev/null
node -p "require('react-dom/package.json').version" 2>/dev/null
rg --files -g '*.{jsx,tsx,js,ts}' | head -100
```

Preserve active configuration and do not invent React version, renderer, server-component support, state ownership, styling, or test environment.

## Install

```bash
npm install react@^19.2.0 react-dom@^19.2.0
npm install --save-dev @types/react@^19 @types/react-dom@^19 2>/dev/null || true
```

Run scaffolders in a new or explicitly approved directory, preview all generated files, and stop their dev server before editing.

## Verify

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Exercise one representative React component tree and client bundle in development and production mode, including a failure or loading state.

## Secrets and generated output

Never print or commit tokens, session data, private server values, serialized personal data, or full production props. Do not patch generated output or expose server-only values across a client boundary.

## Report

List versions, files, boundaries, routes or components, checks, output, and rollback.
