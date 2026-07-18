---
name: 11ai-antdesign-navigation
description: "Build and review Ant Design navigation with Menu, Dropdown, Breadcrumb, Tabs, Steps, and route-aware active state. Use when adding app navigation, settings sections, tabbed views, breadcrumbs, action menus, or fixing selected keys, deep links, keyboard behavior, and mobile navigation."
---

# Ant Design navigation

Keep navigation state derived from the application's route or task state. Ant Design renders the navigation; the router remains the source of truth for URLs and deep links.

## Choose a pattern

- Use `Menu` for primary or section navigation with nested groups.
- Use `Breadcrumb` for hierarchical location context, not as the only way to navigate.
- Use `Tabs` for peer views within one resource or route segment; use the URL when a tab should be linkable or restorable.
- Use `Steps` for a sequential workflow where the current step is meaningful.
- Use `Dropdown` for a compact action menu, not for a long list of destinations.

## Workflow

1. List destinations, labels, icons, permission rules, and mobile behavior before writing items.
2. Use the `items` API when supported by the installed version. Give every item a stable key and keep labels concise.
3. Derive `selectedKeys` and `openKeys` from the current route. Normalize trailing slashes and nested routes so a child page highlights the intended parent.
4. Make navigation elements real links when they change the URL. Avoid putting a button inside a link or hiding route changes in arbitrary click handlers.
5. Preserve the active tab or step on refresh and deep link. On mobile, provide a reachable alternative to a collapsed desktop sider.
6. Verify keyboard navigation, focus visibility, current-page semantics, disabled items, permission-filtered items, and browser back/forward behavior.

```tsx
const items: MenuProps["items"] = [
  { key: "/overview", label: <Link href="/overview">Overview</Link> },
  { key: "/settings", label: <Link href="/settings">Settings</Link> },
]

<Menu mode="inline" items={items} selectedKeys={[pathname]} />
```

If the router is not available in the component, pass the route-derived key down rather than recreating route logic from click events.

## Review traps

- Do not use display text as the key; labels change and may not be unique.
- Do not let `defaultSelectedKeys` drift after navigation becomes controlled.
- Keep action items such as Delete separate from destination items.
- Ensure a tab panel has a meaningful heading and that a menu does not become the only keyboard path to content.
