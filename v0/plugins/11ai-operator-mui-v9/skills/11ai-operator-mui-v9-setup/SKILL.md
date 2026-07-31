---
name: 11ai-operator-mui-v9-setup
description: "Install and configure Material UI v9 with aligned core packages, a deliberate styling engine, React peer checks, providers, baseline styles, fonts, optional icons, framework boundaries, and one verified component. Use when a project has no MUI setup or the user explicitly asks to initialize v9."
---
# 11ai Material UI v9 setup

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; constrain Material UI Core packages to v9 and do not silently add beta `@mui/lab` or MUI X packages.

Resolve project root, package manager, React and React DOM versions, framework, renderer, server and client boundaries, styling engine, font policy, browser targets, and design-system ownership before writing.

## Gather first

```bash
npm ls react react-dom react-is @mui/material @emotion/react @emotion/styled --depth=0
rg -n 'packageManager|@mui/|@emotion/|styled-components|react-is|build|dev|test' package.json
rg -n 'ThemeProvider|CssBaseline|CacheProvider|AppRouterCacheProvider' src app pages
```

Never invent a theme, font, styling engine, provider scope, baseline policy, or portal root. Preserve package manager, lockfile, and framework conventions.

## Install and configure

```bash
npm install @mui/material@^9.2.0 @emotion/react @emotion/styled
```

Install `@mui/icons-material@^9.2.0` only when icons are required. If React is 18 or earlier, follow the official matching `react-is` resolution. Use the styled-components engine only when the repository already chose it and the rendering constraints are understood.

Create one owned theme and provider boundary. Add `CssBaseline` only with approval after inspecting existing global styles. Read [references/setup.md](references/setup.md) for package, provider, font, browser, and framework decisions.

## Verify

Render one semantic component with a focus state and one responsive style, then run lint, types, tests, and a production build. Check console, hydration, computed styles, keyboard operation, and the declared browser floor.

## Guardrails

Never print or commit secrets or server-rendered user state. Ask before replacing providers, changing the styling engine, enabling global baseline styles, upgrading React, or adding preview packages. Report versions, dependencies, files, provider location, styling ownership, checks, and rollback.
