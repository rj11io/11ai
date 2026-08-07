# Next.js wiring

The delivery surface: Tailwind v4 CSS-first, shadcn components, next-themes.
No `tailwind.config` file; everything lives in the global stylesheet.

## Stylesheet skeleton

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* font variables, then every --color-* mapped to its token, then the
     radius steps derived from --radius; copy the block from
     default-tokens.css */
}

:root { /* light tokens */ }
.dark { /* dark tokens */ }

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
}
```

## Root layout

```tsx
<html
  lang="en"
  data-scroll-behavior="smooth"
  suppressHydrationWarning
  className={cn("scroll-smooth antialiased motion-reduce:scroll-auto",
    fontMono.variable, "font-sans", inter.variable)}
>
  <body>
    <ThemeProvider>
      <SiteHeader />
      {children}
      <SiteFooter />
    </ThemeProvider>
  </body>
</html>
```

`suppressHydrationWarning` is required: next-themes mutates the root class
before hydration.

## Theme provider

next-themes with class attribute, system default, no transition flash, plus a
`d` hotkey that toggles the resolved theme when the user is not typing:

```tsx
<NextThemesProvider attribute="class" defaultTheme="system" enableSystem
  disableTransitionOnChange>
```

Hotkey rules: ignore repeats, modifier chords, and events targeting inputs,
textareas, selects, or contenteditable nodes; toggle
`resolvedTheme === "dark" ? "light" : "dark"`.

## shadcn configuration

`components.json`: neutral base color, CSS variables on, lucide icons,
`@/components`, `@/lib/utils`, `@/components/ui` aliases. Components come in
through the shadcn CLI and inherit every token automatically because the
`@theme inline` block maps `--color-*` to the tokens.

## Code highlighting

Dual-theme shiki: emit both `--shiki-light` and `--shiki-dark` per token and
let the class flip pick the value:

```css
.shiki, .shiki span { background-color: transparent !important; color: var(--shiki-light) !important; }
.dark .shiki, .dark .shiki span { color: var(--shiki-dark) !important; }
```

## Verification before delivery

- Both modes rendered and screenshotted; the brand reads as the same brand.
- Contrast gates from token-derivation.md computed and reported.
- Theme toggle, system preference, and the `d` hotkey all work; no flash on
  load; no hydration warning in the console.
- Reduced-motion: scroll smoothing disabled via `motion-reduce:scroll-auto`.
- No hex literals in the stylesheet; no rounded corners introduced by
  components (audit `rounded-*` utilities in new code; the radius lever keeps
  shadcn primitives square, but hand-written classes can leak curves).
