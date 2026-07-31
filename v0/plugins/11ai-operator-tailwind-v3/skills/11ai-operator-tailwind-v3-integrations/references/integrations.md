# Tailwind CSS v3 integration recipes

Version baseline: Tailwind CSS 3.4.19, stable v3 family, researched 2026-07-31.

Primary sources: [v3 framework guides](https://v3.tailwindcss.com/docs/installation/framework-guides), [v3 PostCSS installation](https://v3.tailwindcss.com/docs/installation/using-postcss), and [v3 editor setup](https://v3.tailwindcss.com/docs/editor-setup).

## PostCSS

Use the existing module format and plugin representation. Tailwind CSS v3 itself is the PostCSS plugin; do not install or configure the v4-only `@tailwindcss/postcss` package.

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Preserve other PostCSS plugins and their ordering. Build to a disposable path before replacing owned output.

## Monorepos and component packages

Resolve package source paths from the config location. Include only directories that contain authored templates. Do not scan an entire workspace, dependency store, or generated distribution to make one missing class appear. Prefer shared presets for deliberate token and plugin reuse, while each consumer owns its content paths.

## Component libraries

Keep class candidates statically discoverable. Map prop values to complete class strings. If a library ships compiled CSS, decide whether the application consumes that artifact or scans the library's sources; do not accidentally do both.

## Editors

Configure Tailwind CSS IntelliSense against the actual config and CSS entry. Editor settings are convenience only; verify with the real build because completion does not prove a class was generated.

## CI

Run the repository's production build in a clean checkout. Cache package-manager data rather than committed generated CSS unless the project explicitly owns that artifact. Compare warnings, exit code, CSS size, and representative selectors. Do not expose environment values in logs.
