# Font rules

## Defaults (when the user specifies nothing)

- Sans and headings: **Inter**. Mono: **Geist Mono**. Headings reuse the sans
  face: `--font-heading: var(--font-sans)`.
- Loaded with `next/font/google`, latin subset, exposed as CSS variables:

```tsx
import { Geist_Mono, Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
```

Variables attach to `<html>` via `className`, and `@theme inline` maps them:

```css
@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

## Partial input derivation

| User supplies | You produce |
| --- | --- |
| Nothing | Defaults above |
| One sans/display font | It becomes `--font-sans` and `--font-heading`; default mono stays |
| A heading font only | `--font-heading` set to it; default sans and mono stay |
| A mono font only | It becomes `--font-mono`; default sans stays |
| Sans + mono | Both used; heading follows sans unless stated |

Pairing rule when generating an equivalent: match the given font's register.
A geometric sans pairs with a geometric mono; a humanist sans with a humanist
mono. When unsure, the default mono is the safe partner: it is neutral enough
for any sans.

## Mechanics

- Google-hosted fonts: `next/font/google`, latin subset unless the product
  needs more, `variable:` form so weights stay variable.
- Self-hosted or licensed fonts: `next/font/local` with woff2 files, same
  variable pattern. Never a `<link>` to a font CDN; next/font self-hosts and
  removes layout shift.
- `antialiased` on the root element; numeric-heavy UI gets
  `font-variant-numeric: tabular-nums` where digits align in columns.
- Weights in use by the design language: body 400, medium 500, headings and
  emphasized UI 700 to 750. Prefer the variable axis over loading fixed cuts.
