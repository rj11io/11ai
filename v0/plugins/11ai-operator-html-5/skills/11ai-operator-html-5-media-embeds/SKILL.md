---
name: 11ai-operator-html-5-media-embeds
description: "Operate HTML5 images, pictures, audio, video, tracks, iframes, and embedded content with responsive sources, alternatives, loading policy, permissions, and privacy controls. Use when adding media, fixing responsive images, embedding third-party content, or addressing playback and loading problems."
---
# 11ai HTML5 media and embeds

Media affects accessibility, bandwidth, permissions, and third-party privacy at once. Resolve the exact file, public contract, target browsers and assistive technologies, and acceptance check before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect first

```bash
rg -n '<img|<picture|<source|<video|<audio|<track|<iframe' TARGET
rg -n 'loading=|fetchpriority=|allow=|sandbox=|autoplay' TARGET
```

Resolve the media source, intrinsic dimensions, alternative, expected interaction, third-party origin, and permission needs before editing.

Confirm before changing:

- Useful alt text or intentional empty alt.
- Width and height to reserve layout space.
- Captions, transcripts, and controls.
- Iframe sandbox and permission policy.

## Operate

```bash
npm run build --if-present
npm test --if-present
```

Use picture and srcset only when source selection is understood, lazy-load below-the-fold media, and grant embeds only the permissions they require.

Never enable autoplay with sound, remove iframe sandboxing, or download and replace licensed media without explicit approval. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Inspect network requests, layout shift, fallback content, keyboard controls, captions, and blocked-permission behavior. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-html-5-troubleshooting` and cross-system seams to `11ai-operator-html-5-integrations`.
