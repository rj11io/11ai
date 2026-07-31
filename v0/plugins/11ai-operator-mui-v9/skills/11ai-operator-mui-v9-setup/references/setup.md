# Material UI v9 setup reference

Version baseline: Material UI 9.2.0, stable, researched 2026-07-31.

Primary sources:

- [Material UI versions](https://mui.com/material-ui/getting-started/versions/)
- [Material UI changelog](https://mui.com/material-ui/discover-more/changelog/)
- [Material UI installation](https://mui.com/material-ui/getting-started/installation/)
- [Material UI supported platforms](https://mui.com/material-ui/getting-started/supported-platforms/)
- [Upgrade to Material UI v9](https://mui.com/material-ui/migration/upgrade-to-v9/)

## Confirm compatibility

Material UI v9 supports React and React DOM 17, 18, and 19. React 18 and earlier projects need `react-is` resolved to the same React version because Material UI otherwise consumes React 19's `react-is`. Inspect existing overrides before adding another.

The v9 default bundle targets include Chrome 117, Edge 121, Firefox 121, and Safari 17 on macOS and iOS. Compare the product's browser contract before installation or migration.

## Choose the styling engine

Emotion is the supported default:

```bash
npm install @mui/material@^9.2.0 @emotion/react @emotion/styled
```

The styled-components alternative requires `@mui/styled-engine-sc` and bundler aliasing. Do not switch engines casually, and do not use it for a server-rendered application without verifying the current documented limitation.

## Place providers deliberately

Create a single theme in an owned module and place `ThemeProvider` high enough for consumers but inside required client boundaries. In Next.js, use the matching `@mui/material-nextjs` v9 integration rather than inventing an Emotion cache. Keep request-specific values out of a shared server singleton.

`CssBaseline` changes global element defaults. Inspect existing resets and obtain approval before enabling or removing it. Fonts must follow the application's loading and privacy policy; Roboto is recommended by Material Design but is not an automatic requirement.

## Keep optional packages optional

Install `@mui/icons-material@^9.2.0` only for Material Icons. Do not add `@mui/lab` unless a beta component is explicitly required, and label that stability. Do not infer that MUI X packages should share the Core version; inspect their independent release line and license separately.

## Verify

Run type checking, lint, tests, and the production build. Inspect hydration, provider duplication, generated styles, accessible name, focus visibility, responsive behavior, and bundle impact for the smoke component.
