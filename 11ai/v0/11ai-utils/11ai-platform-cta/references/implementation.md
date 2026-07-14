# Platform services CTA implementation contract

## Contents

1. Page objective
2. Content model
3. Section architecture
4. Visual and interaction behavior
5. Conversion and safety
6. Acceptance checklist

## 1. Page objective

Sell tailored website/platform-building services to creators, authors, experts, or other configured audiences. Preserve the source implementation’s directness—a short editorial hero, a concise “what can be built” statement, and an external contact CTA—but expand it into a credible decision page.

The page must answer:

- Who is this for?
- What business/content problem does it solve?
- What can be built?
- How does the engagement work?
- Why trust the provider?
- What should the visitor do next?

## 2. Content model

Prefer a typed config so copy is not scattered through JSX:

```ts
export type PlatformOffer = {
  kicker: string
  headline: string
  summary: string
  audience: string[]
  problems: Array<{ title: string; description: string }>
  deliverables: Array<{ title: string; description: string; icon?: string }>
  process: Array<{ title: string; description: string }>
  outcomes: string[]
  proof?: Array<{
    quote?: string
    attribution?: string
    metric?: string
    context?: string
  }>
  faq: Array<{ question: string; answer: string }>
  primaryCta: { label: string; href: string; external: boolean }
  secondaryCta?: { label: string; href: string }
  qualificationNote?: string
}
```

Validate URLs and non-empty labels. Require proof context when a metric is present. Never ship fabricated values.

## 3. Section architecture

1. **Hero:** kicker, outcome-led H1, one short explanatory paragraph, primary CTA, optional low-emphasis qualification note. Keep the CTA visible without scrolling on common desktop sizes and early on mobile.
2. **Audience/problem:** identify the intended buyer and 3–5 recognizable constraints (fragmented tools, weak content discovery, generic templates, difficult publishing, poor conversion). Tailor these; do not assume them.
3. **Deliverables:** show concrete builds such as author sites, creator hubs, publishing libraries, membership/content platforms, service pages, integrations, or bespoke workflows. Use only deliverables actually offered.
4. **Process:** 3–5 numbered steps, typically discovery, structure/design direction, build/content integration, review, launch/support.
5. **Outcomes/proof:** pair defensible outcomes with testimonials, case summaries, screenshots, or metrics. If no proof exists, render a transparent “what you receive” outcome list and omit testimonial styling.
6. **FAQ:** answer scope, timeline, content responsibilities, hosting/ownership, integrations, maintenance, and how to start—only with known policy.
7. **Final CTA:** restate the desired outcome, repeat the primary action, and include response expectations only if known.

## 4. Visual and interaction behavior

In an editorial host site, reuse its serif display typography, sans-serif body, small uppercase kickers, warm semantic tokens, hairline borders/grid, translucent panels, dark mode, and restrained reveal motion. Do not clone source branding or exact proprietary copy.

Use deliberate hierarchy rather than a uniform grid of cards. Alternate compact copy sections with one or two structured panels. Limit line length, keep headings specific, and use whitespace as the primary separator. Ensure reduced-motion users do not receive entrance transforms.

For external CTAs use `target="_blank"` only when opening a new context is intentional, with `rel="noreferrer"`. Give icons `aria-hidden` when labels already name the action. Do not encode the CTA solely in an entire clickable section.

## 5. Conversion and safety

Default to an existing contact route or configured external channel. If a form is requested, validate server-side, rate-limit, add spam controls, minimize fields, disclose data use, and connect to an approved lead destination. Never log message bodies to general analytics.

When analytics exists, emit low-cardinality events such as `platform_cta_clicked` with placement (`hero` or `footer`) and destination type. Do not send names, emails, free-text, or full URLs containing personal data.

Generate route metadata from white-label service copy. Add JSON-LD only when the business identity and service facts are confirmed.

## 6. Acceptance checklist

- [ ] Hero states audience, outcome, and service clearly.
- [ ] Primary CTA appears in hero and final section.
- [ ] Deliverables and process are concrete and scannable.
- [ ] Proof is real or omitted; no invented claims remain.
- [ ] FAQ contains only known commitments.
- [ ] CTA URL, labeling, external behavior, and event tracking are correct.
- [ ] Page matches the existing site system in light/dark modes.
- [ ] Mobile hierarchy, keyboard focus, contrast, and reduced motion pass.
- [ ] Metadata, typecheck, lint, tests where present, and build pass.
