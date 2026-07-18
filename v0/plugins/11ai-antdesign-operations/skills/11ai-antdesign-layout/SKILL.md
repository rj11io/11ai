---
name: 11ai-antdesign-layout
description: "Build and review responsive Ant Design page shells and layouts with Layout, Flex, Space, Grid, Row, and Col. Use when creating dashboards, sidebars, headers, content regions, responsive columns, or fixing overflow, height, spacing, and breakpoint behavior."
---

# Ant Design layout

Choose the smallest layout primitive that matches the relationship being expressed, then make the responsive behavior explicit. Keep layout concerns separate from data loading and component styling.

## Choose a primitive

- Use `Layout`, `Header`, `Sider`, `Content`, and `Footer` for application chrome.
- Use `Flex` for one-dimensional alignment and wrapping when the installed version supports it.
- Use `Space` for predictable small gaps between controls.
- Use `Grid` or `Row` and `Col` for responsive columns. Prefer the project's existing grid style; do not mix two systems in the same region without a reason.
- Use CSS grid or flexbox directly when the layout is simpler than an Ant Design abstraction.

## Build the layout

1. Sketch the regions and identify which element owns scrolling. A dashboard normally has one page shell and one intentional content scroller, not nested `100vh` regions.
2. Put fixed chrome outside the scrolling region. Use `min-height: 100vh` or the framework's safe viewport unit, `min-width: 0` on flex children, and `overflow: hidden` only when the child has a deliberate scroll container.
3. Encode responsive spans or flex wrapping at the breakpoint where the content stops fitting. Test a narrow viewport, not only desktop.
4. Keep spacing on the parent (`gap`, `Space`, or column gutter) instead of scattering arbitrary margins across children.
5. Verify long labels, loading states, empty states, keyboard focus, and a page with the largest expected table or form.

```tsx
import { Col, Layout, Row } from "antd"

const { Content, Header } = Layout

export function PageShell() {
  return (
    <Layout className="min-h-screen">
      <Header>Product</Header>
      <Content className="px-4 py-6 md:px-8">
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>Main content</Col>
          <Col xs={24} xl={8}>Context panel</Col>
        </Row>
      </Content>
    </Layout>
  )
}
```

## Review checklist

- Confirm the header, sider, and content do not compete for scroll ownership.
- Check that flex or grid children can shrink (`min-width: 0`) and that tables have a horizontal overflow plan.
- Prefer semantic regions and headings; do not use empty `div` spacers as the primary layout mechanism.
- Keep responsive state derived from the framework or CSS where possible; avoid duplicating breakpoint logic in every component.
- If visual rules are inconsistent across pages, use `11ai-antdesign-theming` rather than adding local overrides.
