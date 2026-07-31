# Material UI v9 integration recipes

Version baseline: Material UI 9.2.0, stable, researched 2026-07-31.

Primary sources: [Next.js integration](https://mui.com/material-ui/integrations/nextjs/), [routing integration](https://mui.com/material-ui/integrations/routing/), [Tailwind CSS interoperability](https://mui.com/material-ui/integrations/interoperability/#tailwind-css), and [testing guidance](https://mui.com/material-ui/guides/testing/).

## Next.js

Install an `@mui/material-nextjs` v9 package aligned with Material UI Core and import the adapter entry that matches the installed Next.js router family. In App Router projects, place `AppRouterCacheProvider` around the owned application subtree and keep theme setup behind the correct client boundary. Use `enableCssLayer: true` only when another styling system needs explicit cascade layers.

Do not hand-roll an Emotion cache until the official adapter has been ruled out for the exact versions. Verify server output, streamed styles, hydration, route transitions, and absence of flash.

## Routing

Use the router's link component so `href`, modified clicks, new tabs, focus, and browser history keep working. Centralize a `LinkComponent` theme default only when every relevant MUI link-like component follows the same router contract. Never replace link semantics with a click handler that calls navigation.

## Tailwind CSS and other styles

For Tailwind v4, use CSS layers and MUI's `enableCssLayer` integration so precedence is explicit. For Tailwind v3, inspect Preflight, injection order, and the `important` strategy. Do not solve conflicts with fragile generated selectors or broad `!important` rules.

The first-party `material-ui-tailwind` Agent Skill contains versioned guidance; the native-skills bridge must confirm its `muiVersion` range and the host Tailwind major before recommending it.

## Forms and server state

Let one library own each value. Map React Hook Form or another controller to `value`, `onChange`, `onBlur`, `inputRef`, error state, and helper text once. Keep Autocomplete's `value` and `inputValue` distinct. Let the data library own loading, error, pagination, and retries; MUI components render that state.

## Testing

Query by accessible role, name, label, and visible status. Menus, dialogs, popovers, tooltips, and autocomplete lists use portals, so query the screen rather than the render container. Await transitions and restore focus. Stub only missing browser features such as `matchMedia` or `ResizeObserver` in the shared test setup, and do not assert generated Emotion class names.
