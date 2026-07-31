---
name: 11ai-operator-mui-v9-integrations
description: "Connect Material UI v9 to Next.js, routing, Tailwind CSS, CSS modules, form and data libraries, fonts, testing tools, continuous integration, and server rendering with end-to-end verification. Use when the task concerns the seam between MUI Core and another system."
---
# 11ai Material UI v9 integrations

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; align official Core integration packages to v9 and inspect separately versioned frameworks and MUI X products independently.

Name both systems, exact versions, provider and cache ownership, server and client boundary, styling order, route contract, data owner, browser target, and test environment before wiring them.

## Inspect the seam

```bash
npm ls @mui/material @mui/material-nextjs @emotion/react @emotion/cache next react-router-dom tailwindcss --depth=0
rg -n 'AppRouterCacheProvider|DocumentHeadTags|createEmotionCache|enableCssLayer|StyledEngineProvider|injectFirst|ThemeProvider|LinkComponent' src app pages
```

Confirm which system owns navigation, server state, form state, CSS layers, fonts, portals, and hydration. Do not quote environment values or form payloads.

## Wire one path deliberately

Use the official `@mui/material-nextjs` adapter matching MUI v9 for Next.js. Preserve real link semantics when adapting router links. Let the form or data library own its state and map it once at the MUI component boundary.

For Tailwind, CSS modules, or other styling systems, choose an explicit layer and injection order rather than adding `!important`. Read [references/integrations.md](references/integrations.md) for bounded Next.js, router, Tailwind, form, data, and testing recipes.

## Verify end to end

```bash
npm run lint --if-present
npm test --if-present
npm run build
```

Exercise server render and hydration, a client navigation, one portal, keyboard focus, theme variables, style precedence, and a production build. Test query results by accessible role rather than generated class names.

## Report

State systems and versions, provider and cache placement, server and client ownership, CSS order, route and data contracts, files, checks, bundle or visual impact, and rollback. Ask before changing framework configuration, global layers, providers, or deployment settings. Hand failures to `11ai-operator-mui-v9-troubleshooting`.
