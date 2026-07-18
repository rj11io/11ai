---
name: 11ai-antdesign-setup
description: "Configure and verify Ant Design in React applications, including package detection, provider placement, Next.js boundaries, styling, icons, and SSR-safe setup. Use when adding Ant Design to an app, fixing a broken installation, wiring ConfigProvider or App, or checking whether an existing setup matches the installed Ant Design version."
---

# Ant Design setup

Establish the smallest correct Ant Design setup for the framework and version already used by the project. Inspect before editing: do not upgrade Ant Design, install a date adapter, or replace the styling pipeline unless the user asks.

## Workflow

1. Read `package.json`, the lockfile, and the app entry points. Record the installed `antd` version, React version, framework, package manager, and whether the app uses a server/client component boundary.
2. Check existing providers, CSS entry points, aliases, and icon imports. Preserve the project's conventions and avoid duplicate `ConfigProvider` wrappers.
3. Add only the missing integration. For a client-side provider, use the shape appropriate to the framework:

```tsx
"use client"

import { App, ConfigProvider } from "antd"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <App>{children}</App>
    </ConfigProvider>
  )
}
```

Use `App` when descendants need the `message`, `notification`, or `modal` hooks. Keep the provider high enough to cover those calls, but not duplicated inside individual pages.

4. For server-rendered apps, follow the installed Ant Design version's official SSR or registry integration. In Next.js, keep browser-only provider code behind the correct client boundary and verify style extraction or injection during both server render and client hydration. Do not paste a version-specific registry recipe without checking the dependency version.
5. Import icons by name from `@ant-design/icons`; avoid string-based icon names and broad custom CSS that hides the real setup issue.
6. Verify with one visible component, a production build when practical, and a browser check for styles, hydration warnings, focus behavior, and console errors.

## Guardrails

- Do not add a v4 global stylesheet to a v5-style setup, or remove an existing stylesheet without checking the installed version.
- Keep `ConfigProvider` theme configuration centralized; component-level overrides belong in the theming workflow.
- Prefer the project's existing bundler and CSS strategy over a new integration library.
- If the problem is a runtime symptom after setup, use `11ai-antdesign-troubleshooting` while preserving the evidence collected here.
