---
name: 11ai-web-design
description: Design and build distinctive websites, landing pages, product surfaces, prototypes, demos, and web UI with strong art direction, hierarchy, typography, imagery, and motion. Use when you must create or restyle a frontend so it feels intentional and premium rather than generic, especially for React apps, HTML/CSS pages, marketing sites, dashboards, or component-level UI polish.
---

# 11ai Web Design

## Overview

Build frontend work with clear point of view. Start with composition and hierarchy, not component count. Prefer memorable visual direction, restrained systems, strong typography, real imagery when useful, and small set of motions that change feel.

Default goal: ship production-grade UI that looks designed for this brief, not template output.

## Workflow

Before coding, write 3 short notes:

- visual thesis: mood, material, energy
- content plan: hero, support, detail, final CTA or main working surface
- interaction thesis: 2-3 motion ideas

Then choose one dominant direction and commit:

- brutally minimal
- editorial
- luxury
- retro-futurist
- industrial
- playful
- brutalist
- organic
- maximalist

Make each section do one job, carry one dominant visual idea, and deliver one takeaway or action.

## Core Rules

- Start with composition, not cards.
- Make brand or product name loud and immediate.
- Keep copy short enough to scan fast.
- Use whitespace, scale, alignment, cropping, and contrast before adding chrome.
- Use at most 2 typefaces unless brief demands more.
- Use one accent color by default.
- Use CSS variables for palette, spacing, radius, shadow, and motion timing.
- Match code complexity to aesthetic ambition. Maximalist work can be elaborate. Refined work needs restraint.

## Visual Direction

- Pick characterful fonts. Avoid default stacks and overused safe choices like Inter, Roboto, Arial, or generic system-only styling unless product already uses them.
- Build atmosphere. Prefer gradients, textures, grain, patterns, layered transparencies, dramatic shadows, or controlled emptiness over flat filler backgrounds.
- Use asymmetry, overlap, diagonal flow, full-bleed planes, or strong cropping when they sharpen concept.
- Avoid drifting into purple-gradient-on-white SaaS default style.
- Avoid reusing the same aesthetic between builds. Re-decide direction from the brief each time.

## Landing Pages

Default sequence:

1. Hero
2. Support
3. Detail
4. Final CTA

Hero rules:

- Use one composition only.
- Prefer one strong full-bleed image or one dominant visual plane.
- Keep outer hero edge-to-edge when page is brand-led. Constrain inner text/action column, not whole hero.
- Put brand first, headline second, body third, CTA fourth.
- Keep headline to roughly 2-3 desktop lines.
- Keep text column narrow and placed on calm visual area.
- Ensure text over imagery keeps strong contrast and tap targets.
- Count sticky header height against first-screen budget.

Checks:

- If first viewport still works after removing image, image too weak.
- If brand disappears after hiding nav, hierarchy too weak.
- If hero needs cards, stat strips, logo clouds, pill soup, or floating dashboards to explain itself, simplify.

## Product UI

Default to calm, dense, readable layout:

- primary workspace
- navigation
- secondary context
- one accent for action or state

Use utility copy, not marketing copy:

- prefer headings like `Plan status`, `Selected KPIs`, `Last sync`, `Top segments`
- explain scope, freshness, or decision value in one short sentence
- remove aspirational hero language unless user asks for it

Avoid:

- dashboard card mosaics
- thick borders around every region
- decorative gradients behind routine product UI
- many competing accent colors
- ornamental icons with no scan value

If panel can become plain layout without losing meaning, remove card treatment.

## Imagery

- Use at least one strong image for brands, venues, editorial pages, and lifestyle products when the brief benefits from it.
- Prefer real-looking, in-situ imagery over abstract filler.
- Choose crops with stable tonal zone for text.
- Avoid embedded signage, logos, or noisy text inside images.
- Avoid images that already contain fake UI frames, split panels, or dashboard cards.
- If story needs many moments, use many images, not one collage.

Decorative texture is not enough. First viewport needs real visual anchor.

## Motion

Ship 2-3 intentional motions for visually led work:

- one entrance sequence
- one scroll, sticky, or depth effect
- one hover, reveal, or layout transition

Use motion to strengthen hierarchy and atmosphere, not to decorate noise.

Motion rules:

- make it noticeable in quick recording
- keep it smooth on mobile
- keep it fast and restrained
- keep it consistent across page
- remove it if ornamental only

Prefer CSS-first motion for simple sites. Use Framer Motion or repo-standard motion tooling when app already supports it.

## Copy

- Write product language, not design commentary.
- Let headline carry meaning.
- Keep support copy to one short sentence when possible.
- Cut repetition between sections.
- Remove filler.
- If deleting 30% improves page, keep deleting.

## Hard Fails

- generic SaaS card grid as first impression
- weak brand presence in first screen
- strong headline with no clear action
- busy imagery behind text
- sections repeating same mood statement
- carousel with no narrative job
- split-screen hero without one calm text side
- more than one dominant idea in section
- more than one accent color without real system

## Litmus Checks

- Is brand or product unmistakable in first screen?
- Is there one strong visual anchor?
- Can page be understood by scanning headlines only?
- Does each section have one job?
- Are cards necessary?
- Does motion improve hierarchy or atmosphere?
- Would design still feel premium after removing decorative shadows?
