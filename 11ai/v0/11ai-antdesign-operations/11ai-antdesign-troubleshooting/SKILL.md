---
name: 11ai-antdesign-troubleshooting
description: "Diagnose Ant Design React failures involving missing styles, SSR or hydration, provider context, Form values, Table state, overlays, icons, dates, tokens, TypeScript, layout, and accessibility. Use when Ant Design renders incorrectly, logs warnings, loses state, or behaves differently across development, production, or themes."
---

# Ant Design troubleshooting

Diagnose from the symptom and evidence before changing dependencies or adding CSS. Use [references/triage-matrix.md](references/triage-matrix.md) for the first hypotheses, then prove or eliminate them with the smallest safe check.

## Triage workflow

1. Capture the exact symptom, console warning, stack trace, route, browser, framework, installed `antd` version, and whether it only fails in production or SSR.
2. Inspect the component boundary, provider tree, imports, controlled props, and the data reaching the component. Compare the failing usage with a minimal working instance in the same app.
3. Classify the failure as setup/styles, state/API, SSR/hydration, layout/portal, or accessibility. Change one variable at a time.
4. Fix the narrow cause, not the symptom. Do not upgrade Ant Design, add `!important`, disable hydration warnings, or suppress TypeScript errors as a first response.
5. Verify the original failure, adjacent states, production build, and the absence of new console warnings. Report remaining uncertainty and the evidence used.

## High-signal checks

- **Styles missing or flash on load:** inspect the installed version's style strategy, provider placement, CSS order, and SSR registry or extraction setup.
- **Hydration mismatch:** compare server and client inputs for time, randomness, viewport state, theme persistence, and browser-only APIs; do not silence the warning until the mismatch is explained.
- **Form value does not update:** check `initialValues` versus `setFieldsValue`, field names, `valuePropName`, and a child component's own `value` and `onChange`.
- **Table shows stale pages or rows:** check `rowKey`, controlled pagination, `total`, filter/sort resets, and overlapping requests.
- **Modal or message is absent:** check that `App`, `ConfigProvider`, or the relevant `contextHolder` covers the call site.
- **Overlay is behind content:** inspect portals, `getContainer`, stacking contexts, transformed ancestors, and tokenized z-index before raising arbitrary values.
- **Icon, date, or token API fails:** inspect installed package versions and exact imports before applying an internet snippet from another major version.
- **Layout clips or scrolls twice:** inspect flex shrinking, fixed viewport heights, overflow owners, long unbroken content, and table width.

When the evidence points to a broad setup problem, use `11ai-antdesign-setup`; when it points to a visual system inconsistency, use `11ai-antdesign-theming`.
