---
name: 11ai-platform-cta
description: "Design and build a white-label marketing page that sells custom website and platform-building services, using an editorial hero, service positioning, deliverables, process, proof, outcomes, FAQ, and repeated conversion CTAs. Use when creating or improving a platform services page, web-development offer page, author/creator platform pitch, agency landing page, or contact-focused service CTA inside a Next.js or React site."
---

# 11ai Platform CTA

Build the service-marketing page described in [references/implementation.md](references/implementation.md). Read it before editing.

## Workflow

1. Inspect the site shell, brand tokens, navigation, typography, existing service copy, contact destinations, and available proof.
2. Reuse the site’s visual system so the page belongs to the product. Preserve the editorial starting point: restrained kicker, strong display headline, concise body copy, and direct primary CTA.
3. Convert the offer into configurable data: audience, problems, deliverables, process, outcomes, proof, FAQ, CTA label/destination, and optional qualification note.
4. Build a responsive page with hero, offer framing, deliverables, process, proof/outcomes, FAQ, and final CTA. Omit sections lacking real inputs rather than inventing claims.
5. Make the CTA usable above the fold and near the end. Support an external contact URL by default; add a form only when requested or already supported.
6. Add conversion event hooks when analytics exists, without recording message content or sensitive lead data.
7. Verify responsive hierarchy, keyboard operation, contrast, reduced motion, external-link safety, route metadata, typecheck, lint, and build.

## Non-negotiable behavior

- Keep all identity, domains, testimonials, metrics, client names, pricing, and guarantees white-label and user-supplied.
- Do not fabricate proof or outcomes. Use clearly labeled placeholders only during implementation and remove them before delivery unless the user wants a template.
- Lead with the buyer outcome, then explain deliverables and process.
- Use a specific action label such as “Discuss your platform,” not a generic “Learn more.”
- Preserve the host site’s typography, colors, radius, and component primitives.
- Keep a single dominant CTA; secondary actions must not compete visually.

## Delivery

Report page route, configurable fields, CTA destination/behavior, analytics events, omitted proof-dependent sections, and verification performed.
