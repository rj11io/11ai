# Measurement Protocol

How to produce numbers that survive review. Read this before measuring anything.

The governing rule: **measure the rendered result, not the authored value.** A token can be correct in source and wrong on screen, and a hand-computed ratio can be confidently wrong. Rasterise what the browser actually painted.

## 1. Prove which theme mechanism is live

Before any measurement, establish how the project switches themes, and confirm it by flipping and watching a token change.

```js
const root = document.documentElement;
const probe = () => getComputedStyle(root).getPropertyValue("--some-known-token").trim();

({
  rootClass: root.className,
  dataAttrs: Object.fromEntries(
    [...root.attributes].filter((a) => a.name.startsWith("data-")).map((a) => [a.name, a.value])
  ),
  prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
  tokenNow: probe(),
});
```

A class-based or attribute-based theme will **not** respond to an emulated `prefers-color-scheme`, and a media-query theme will not respond to adding a class. Guessing wrong means every subsequent number describes the wrong theme.

Force the theme the way the project does, then **let styles flush before reading**. A toggle followed by an immediate read in the same tick returns the old values — read in a later call, or force a reflow first.

## 2. Resolve any colour to sRGB bytes

Modern browsers return computed colours as `oklab(...)`, `lab(...)`, or `color(...)`. Parsing numbers out of those strings and treating them as RGB **silently produces wrong ratios** rather than an error. Let the browser rasterise instead:

```js
const _cv = document.createElement("canvas");
_cv.width = _cv.height = 1;
const _ctx = _cv.getContext("2d", { willReadFrequently: true });

/** Any CSS colour the browser can parse -> [r, g, b, a] with a in 0..1. */
function toRGBA(css) {
  _ctx.clearRect(0, 0, 1, 1);
  _ctx.fillStyle = "#000";     // sentinel: an unparseable value leaves this in place
  _ctx.fillStyle = css;
  _ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = _ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}
```

This handles hex, `rgb`, `hsl`, `oklch`, `lab`, and `color-mix` without special cases. If a value comes back as the sentinel black unexpectedly, the browser could not parse it — convert manually with the maths in section 6 rather than trusting the result.

## 3. Composite alpha the way browsers do

Translucent colours have no contrast of their own; they take it from whatever sits behind. Composite in **gamma-encoded sRGB**, which is what browsers do for `background-color`. Compositing in linear light gives visibly different — and wrong — answers.

```js
/** fg over bg. Both [r,g,b,a]. Returns an opaque colour. */
function over(fg, bg) {
  const a = fg[3];
  return [
    fg[0] * a + bg[0] * (1 - a),
    fg[1] * a + bg[1] * (1 - a),
    fg[2] * a + bg[2] * (1 - a),
    1,
  ];
}

/** Walk ancestors until an opaque background is found, then composite back down. */
function effectiveBackground(el) {
  const layers = [];
  for (let n = el; n; n = n.parentElement) {
    const c = toRGBA(getComputedStyle(n).backgroundColor);
    if (c[3] > 0) {
      layers.push(c);
      if (c[3] === 1) break;
    }
  }
  let base = layers.pop() ?? [255, 255, 255, 1];
  while (layers.length) base = over(layers.pop(), base);
  return base;
}
```

The difference is not subtle. Compositing 10% white over a near-black background gives **34** in gamma space, matching the browser, and **90** in linear light. A linear-space blend will report a translucent element as far lighter than it renders.

Because of this, anything carrying text should use an **opaque** fill — a mix against a known base rather than an alpha over an unknown surface. A translucent chip that measures fine on one surface will fail on another, and nothing in the source hints at it.

**Precision limit.** The canvas round-trip quantises alpha to 8 bits, so a requested `0.1` comes back as `0.102`. Composited results can land a byte off, moving a computed ratio by roughly ±0.1. Never let a value within 0.1 of a threshold decide a pass: widen the margin, or confirm by a second route.

## 4. Contrast, and the size-appropriate threshold

```js
function luminance([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Measure one text element against what it actually sits on. */
function measureText(el) {
  const cs = getComputedStyle(el);
  const bg = effectiveBackground(el);
  const fg = over(toRGBA(cs.color), bg);
  const px = parseFloat(cs.fontSize);
  const bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
  const large = px >= 24 || (bold && px >= 18.66);
  const threshold = large ? 3 : 4.5;
  const ratio = contrast(fg, bg);
  return {
    ratio: +ratio.toFixed(2),
    threshold,
    headroom: +(ratio / threshold - 1).toFixed(2),
    px,
    large,
    pass: ratio >= threshold,
  };
}
```

The WCAG published text uses `0.03928` as the transfer-function breakpoint where the sRGB specification uses `0.04045`. The difference is immaterial; either is defensible.

Apply the large-text allowance only where the **rendered** size qualifies. Small uppercase labels with wide tracking are normal text no matter how they read.

## 5. Targets, scaling, and motion

```js
function measureTarget(el) {
  const r = el.getBoundingClientRect();
  const min = Math.min(r.width, r.height);
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    meetsMinimum: min >= 24,
    meetsEnhanced: min >= 44,
  };
}
```

Measure the rendered box including padding, not the glyph or icon.

For scaling, reflow, and spacing, apply the condition and then check for loss rather than eyeballing the layout:

```js
// Horizontal overflow anywhere on the page.
({
  overflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  clipped: [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.overflow !== "visible" && el.scrollHeight > el.clientHeight + 1;
  }).length,
});
```

For motion, confirm gating exists **and** is complete. Enumerate elements with a non-zero `transition-duration` or an `animation-name`, then re-check them under an emulated reduced-motion preference. Partial coverage is the usual defect: a project gates one component and leaves the rest.

## 6. Exploring candidate values offline

When choosing a replacement shade, you need ratios for colours not yet in the DOM. Convert directly, then confirm the chosen one against the rendered page afterwards.

```js
/** OKLCh -> linear sRGB (Ottosson), clamped. */
function oklchToLinear(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((v) => Math.min(1, Math.max(0, v)));
}

function linearToBytes(lin) {
  return lin.map((v) => {
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255);
  });
}
```

Sweep a ladder of candidates against **every** surface the token lands on and against every foreground that sits on it, in both themes, before choosing. A shade that improves text often degrades the same token used as a fill — that trade-off only becomes visible when both columns are in the table.

Then verify the chosen value by rasterising the rendered page. If your maths and the browser disagree, the browser is right.

## 7. Known false alarms

Each of these looks like a defect and is not. Rule them out before diagnosing.

- **Suspiciously uniform results.** Different shades returning near-identical ratios means the instrument is broken, not the palette. Almost always a colour string parsed as numbers.
- **Stale stylesheets after hot reload.** A dev server can serve a stale CSS chunk, so a token renders its old value while the source is correct. Hard-reload before concluding anything.
- **`cssRules` is not always readable.** `document.styleSheets[].cssRules` can throw or come back empty, and a `try/catch` will hide it — leading to "the rule is missing" when it is present. Get ground truth by fetching the stylesheet URL as text and searching it.
- **Reads before style flush.** Toggling a theme or a state and reading in the same tick returns stale values. Read in a later call.
- **Screenshots that do not repaint.** Automated capture can return a blank or stale frame after programmatic scrolling. Verify with computed styles; treat images as illustration, not evidence.
- **Automation coordinate space.** Pointer coordinates may be in screenshot space, not viewport space. If a hover appears to do nothing, confirm which element is actually under the cursor before believing the measurement.
- **Alpha estimated by hand.** See section 3. Let the browser resolve the composite.

## 8. Optional automated guardrail

Do not build this unless the user asks for it. Suggest it once, in the final summary.

The shape: enumerate the token pairs the audit already identified, compute contrast for each in both themes, and fail when any drops below its threshold. The measurement functions above are the implementation — the check is small, and it is what stops a regression from shipping unnoticed.

Useful properties if it is built:

- assert on **pairs**, in both themes, from the same inventory the audit produced
- include target sizes where they are expressible without a browser
- fail with the measured value, the threshold, and the pair name, so the failure is actionable
- verify the check actually fails on a known-bad pair before declaring it working
