# Ant Design setup reference

Check the installed version before using anything here. Ant Design changed its styling pipeline between major versions, and a recipe from the wrong version produces missing styles rather than an error.

```bash
npm ls antd react react-dom
node -p "require('antd/package.json').version"
```

## Install

```bash
npm install antd @ant-design/icons
```

```bash
pnpm add antd @ant-design/icons
```

```bash
yarn add antd @ant-design/icons
```

Match the project's existing package manager; do not introduce a second lockfile. Install `@ant-design/icons` only when the app actually renders icons.

## What changed between versions

- **v6** uses CSS variables and its current styling runtime; there is no full distribution stylesheet to import. Adding `antd/dist/reset.css` is optional and only resets browser defaults; adding a legacy v4 stylesheet produces conflicting rules.
- **v4** requires a stylesheet import, usually `antd/dist/antd.css` or a Less build with theme variables.

If an Ant Design 6 project imports a legacy full Ant Design stylesheet, that import is the bug. Confirm the installed v6 patch before removing it.

## Provider placement by framework

### Vite or Create React App

One provider pair at the application root, above the router:

```tsx
import { App, ConfigProvider } from "antd"

createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <App>
      <RouterProvider router={router} />
    </App>
  </ConfigProvider>
)
```

### Next.js App Router

Providers are browser-side, so they live in a client component that the server layout renders:

```tsx
"use client"

import { App, ConfigProvider } from "antd"

export function AntdProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <App>{children}</App>
    </ConfigProvider>
  )
}
```

```tsx
import { AntdProviders } from "./antd-providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdProviders>{children}</AntdProviders>
      </body>
    </html>
  )
}
```

Without a style registry, the first server-rendered paint ships no Ant Design CSS and the page flashes unstyled before hydration. The registry collects the generated styles during the server render and injects them into the document head. Use the pattern documented for the installed version; the shape is a client component that creates a cache, registers a flush callback, and wraps its children. Verify it by loading a page with JavaScript disabled and confirming the markup already carries Ant Design styles.

### Next.js Pages Router

Wrap `_app.tsx` with the same provider pair and follow the installed version's `_document.tsx` extraction guidance for server-rendered styles.

## Verify

```bash
npm run build
```

Then load the app and confirm, in order:

1. A single visible Ant Design component renders with its own styling.
2. No hydration mismatch warnings in the browser console.
3. No duplicate-provider symptoms: `message` or `notification` calls firing twice, or a theme applying to only part of the tree.
4. Keyboard focus rings appear on interactive components.
5. With JavaScript disabled, server-rendered pages are already styled.

## Guardrails

- Do not upgrade `antd` as part of setting it up. An upgrade is a separate, reviewed change with its own migration notes.
- Do not add a CSS-in-JS or styling library to make Ant Design work. It brings its own.
- Keep exactly one `ConfigProvider`. Nested providers silently override theme tokens and locale.
- Do not paste a registry or SSR recipe found online without checking it against the installed version.
