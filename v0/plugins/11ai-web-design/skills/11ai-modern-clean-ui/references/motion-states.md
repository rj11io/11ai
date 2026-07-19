# Motion and states

The details in this file are what separate a UI that merely follows the
foundations from one that feels finished. Most of the gap between "generic
Tailwind template" and "looks like a real product" lives here.

## Motion

Motion should always answer a question: what changed, what opened, or what
loaded. If you can't name the reason for an animation, cut it.

- **Duration:** 150–250ms for most UI transitions (hover, focus, small state
  changes). Slightly longer, 250–350ms, for larger movements like a modal or
  drawer entering. Anything longer starts to feel sluggish rather than
  polished.
- **Easing:** ease-out for things entering or growing (they should feel like
  they arrive with a bit of speed and settle), ease-in for things leaving.
  Avoid linear easing — it reads as mechanical.
- **What to animate:** opacity, transform (translate/scale), and color are
  cheap and smooth. Avoid animating layout properties (width, height, top/
  left) where possible — prefer `transform` for movement.
- **Hover states:** a small, consistent treatment — background tint shift,
  border color change, or a 1–2px translate. Pick one approach per component
  type and repeat it; inconsistent hover treatment across similar elements
  reads as unfinished.
- **Focus states:** always visible, always distinct from hover — a focus
  ring in the accent color is the standard, reliable choice. Never remove
  the focus outline without replacing it with something equally visible;
  doing so breaks keyboard navigation.
- **Respect `prefers-reduced-motion`:** disable or shorten non-essential
  animation (entrance effects, decorative movement) for users who've asked
  for reduced motion. Functional feedback (a button depressing, a checkbox
  ticking) can stay since it's near-instant and communicates state.
- **Avoid animation ceremony:** staggered entrance animations on every list,
  parallax on scroll, and looping decorative motion date a UI fast and add
  little. Reach for them only when the product's specific character calls
  for it, not as a default.

## Loading states

- Prefer skeleton placeholders (shapes matching the eventual content's
  layout) over a generic spinner for anything that takes more than a
  fraction of a second and has a predictable shape (a list, a card, a
  profile).
- Use a spinner for actions with no predictable shape (a button submitting,
  a page-level transition) — keep it small and paired with the element it
  affects, not a full-page blocking overlay unless the action truly blocks
  everything.
- Never leave a loading state with no visual change at all — even a subtle
  pulse or dimmed content tells the user something is happening.

## Empty states

- Every list, table, or search result needs a designed empty state: a short
  explanation of why it's empty and, where relevant, a primary action to fix
  that (e.g., "No projects yet — Create your first project"). A blank white
  box with no message reads as broken, not clean.
- Keep empty-state illustrations or icons simple and on-brand with the rest
  of the UI — don't introduce a different visual style just for this one
  state.

## Error states

- Inline errors (form fields, individual actions) use the destructive
  semantic color, a clear short message, and stay next to what caused them.
- Page- or section-level errors (failed to load data) get their own state:
  what went wrong in plain terms, and a retry action if one is possible.
- Never rely on color alone to signal an error — pair the destructive color
  with an icon and text so the meaning survives grayscale and colorblind
  vision.

## Stale and partial data

If content can go stale (cached data, a paused sync, a disconnected
integration) or load partially (some fields present, others missing), design
that as its own state rather than letting it look identical to fully-loaded,
fresh data. A quiet "last updated" timestamp or a small indicator is usually
enough — the goal is that the user is never misled about what they're
looking at.

## Verification checklist

Before calling a screen done, check it actually looks and behaves right:

- Hover and focus on every interactive element.
- Loading, empty, and error states — trigger them, don't just imagine them.
- Long content (a long name, a long list) and missing content (no avatar,
  no description) don't break the layout.
- Both themes, if the product has both.
- Keyboard-only navigation reaches every interactive element in a sensible
  order.
- A mobile viewport, not just a resized desktop browser window.
