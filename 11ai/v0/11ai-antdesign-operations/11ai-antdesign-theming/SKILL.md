---
name: 11ai-antdesign-theming
description: "Configure and review Ant Design visual tokens, ConfigProvider themes, component overrides, dark or compact modes, typography, spacing, radius, and status colors. Use when establishing a design system, adding theme switching, fixing inconsistent component styling, or replacing brittle CSS overrides."
---

# Ant Design theming

Use Ant Design's theme token system as the main source of truth. Centralize shared decisions, keep component overrides narrow, and reserve local CSS for layout or a genuinely app-specific visual treatment.

## Workflow

1. Inspect the existing `ConfigProvider`, CSS variables, design tokens, and component-level overrides. Identify whether the project already supports light, dark, compact, or brand themes.
2. Define semantic decisions first: primary action, success, warning, error, surface, text, border, spacing, typography, and radius. Avoid starting with one-off component selectors.
3. Put global tokens in the highest shared `ConfigProvider`. Put component tokens under `theme.components` only when the change is intentionally limited to that component.
4. If themes switch at runtime, keep the theme object stable and switch the selected algorithm or token set from one state. Verify persistence and the initial server/client value.
5. Preserve contrast, focus indicators, disabled states, and status meaning. Test dark mode with images, charts, inputs, overlays, and third-party content.
6. Verify a representative set of `Button`, `Input`, `Select`, `Card`, `Table`, `Modal`, `Alert`, and `Tag` states in every supported theme.

```tsx
import { ConfigProvider, theme } from "antd"

export function DesignSystem({ dark, children }: Props) {
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
        components: {
          Button: { controlHeight: 36 },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
```

Confirm the exact token and algorithm names against the installed Ant Design version before editing. Keep the example's values illustrative, not a mandate for the product palette.

## Review traps

- Do not mix a dark algorithm with hard-coded light backgrounds that sit inside the same surface.
- Do not use `!important` to mask a token or specificity problem before inspecting the rendered styles.
- Avoid changing global tokens to fix one exceptional component; use a scoped component token or class.
- Test SSR and hydration when the initial theme depends on local storage, media queries, or cookies.
- Treat theme changes as UI changes: verify screenshots, keyboard focus, contrast, and visual regression coverage where available.
