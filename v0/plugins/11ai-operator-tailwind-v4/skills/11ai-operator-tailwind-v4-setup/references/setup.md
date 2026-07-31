# Tailwind CSS v4 setup reference

Version baseline: Tailwind CSS 4.3.1, stable, researched 2026-07-31.

Primary sources:

- [Tailwind CSS v4.3.1 release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.1)
- [Tailwind CSS v4.3 announcement](https://tailwindcss.com/blog/tailwindcss-v4-3)
- [Installation with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Installation with PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [Tailwind CLI installation](https://tailwindcss.com/docs/installation/tailwind-cli)
- [Compatibility](https://tailwindcss.com/docs/compatibility)

## Check the browser contract

Tailwind CSS v4 core targets Chrome 111 or newer, Safari 16.4 or newer, and Firefox 128 or newer. If the product must support older browsers, do not proceed with v4 setup without an explicit compatibility decision; v3.4 remains the documented fallback.

## Choose one adapter

- Vite projects generally use `@tailwindcss/vite`.
- Existing PostCSS pipelines use `@tailwindcss/postcss`.
- Direct input-to-output builds use `@tailwindcss/cli`.
- Webpack projects can use the first-party `@tailwindcss/webpack` package in the v4.3 family.

Keep the adapter and `tailwindcss` package on the same `^4.3.1` constraint. Preserve the package manager and lockfile. Do not add multiple adapters unless separate documented build paths require them.

## Add the CSS entry

```css
@import "tailwindcss";
```

Tailwind v4 handles imports and vendor prefixing. Do not mechanically add `postcss-import` or `autoprefixer`. Do not initialize a v3-style JavaScript config as the default v4 setup.

## Bound source discovery

Automatic detection follows project sources and ignore rules. Add `source()` or `@source` only for a known missing base or external authored source. Avoid broad paths, generated output, binary trees, and dependency stores.

## Verify

Use a real owned template with complete class strings. Run development and production builds, check representative selectors and browser rendering, and compare CSS size. Use a temporary output for CLI validation before replacing an owned asset.
