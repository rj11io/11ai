# Tailwind CSS v3 setup reference

Version baseline: Tailwind CSS 3.4.19, stable v3 family, researched 2026-07-31.

Primary sources:

- [Tailwind CSS v3.4.19 release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.19)
- [Tailwind CSS v3 installation](https://v3.tailwindcss.com/docs/installation)
- [Tailwind CSS v3 configuration](https://v3.tailwindcss.com/docs/configuration)
- [Tailwind CSS v3 content configuration](https://v3.tailwindcss.com/docs/content-configuration)

## Decide the build surface

Prefer the framework's documented PostCSS integration when the project already uses PostCSS. Use the Tailwind CLI for a direct input-to-output build. Do not add both paths unless the repository deliberately maintains both.

## Pin the family

Use the existing package manager and constrain `tailwindcss` to `^3.4.19`. Do not use `latest`, because the latest Tailwind major is v4 and has a different package and configuration model. Preserve the existing lockfile.

## Configure owned sources

Map each content glob to files that actually contain complete class strings. Include relevant template extensions and exclude dependency trees and generated output. Dynamic string fragments such as `text-${color}-600` are not detectable; map inputs to complete static class names instead of widening the scan.

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue,svelte}"],
  theme: { extend: {} },
  plugins: [],
}
```

Match CommonJS or ESM to the repository. Do not replace an existing configuration merely to match this example.

## Add the layer entry

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Keep custom styles in deliberate layers. Confirm whether Preflight changes existing element defaults before enabling it in an established product.

## Verify without clobbering output

Compile to a new temporary path, confirm representative utilities exist, measure file size, then run the application build. Delete or ignore the temporary file only after confirming it is not user-owned. Replace a production output only with explicit approval and a reviewed diff or artifact comparison.
