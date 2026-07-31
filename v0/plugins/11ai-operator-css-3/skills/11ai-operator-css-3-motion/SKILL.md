---
name: 11ai-operator-css-3-motion
description: "Create and repair CSS3 transitions, keyframe animations, transforms, view transitions, and reduced-motion alternatives with performance and accessibility checks. Use when adding animation, fixing jank or unexpected precedence, or honoring motion preferences."
---
# 11ai CSS3 motion

Motion must communicate state without blocking interaction or making content inaccessible. Resolve the exact file, public contract, target supported browsers and user preference modes, and acceptance check before editing.

Version baseline: CSS3, represented by W3C CSS Snapshot 2025 plus current independently leveled modules, verified 31 July 2026. Use stable current module features within the CSS3 family and verify specification status and browser support per feature.

## Inspect first

```bash
rg -n 'transition:|animation:|@keyframes|view-transition|prefers-reduced-motion|will-change' TARGET
npm run build --if-present
```

Resolve the property, trigger, duration, easing, interruption behavior, and reduced-motion outcome before adding or changing animation.

Confirm before changing:

- Why the motion exists.
- Whether it can be interrupted.
- Compositor-friendly properties.
- Equivalent reduced-motion feedback.

## Operate

```bash
npm run lint --if-present
npm run build --if-present
```

Animate transforms and opacity when they express the intent, keep durations bounded, and provide a reduced or absent motion path without removing state feedback.

Never add flashing, infinite decorative motion, blanket will-change, or forced smooth scrolling without explicit review. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Test start, interruption, reversal, rapid input, low-performance conditions, and prefers-reduced-motion with the final computed cascade. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-css-3-troubleshooting` and cross-system seams to `11ai-operator-css-3-integrations`.
