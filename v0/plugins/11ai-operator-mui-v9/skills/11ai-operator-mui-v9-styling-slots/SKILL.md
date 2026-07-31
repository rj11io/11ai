---
name: 11ai-operator-mui-v9-styling-slots
description: "Style Material UI v9 components with sx, styled, theme component overrides, GlobalStyles, CssBaseline, slots, slotProps, class APIs, state classes, CSS layers, and injection-order controls. Use when the user asks to customize appearance, replace an internal slot, or repair style precedence."
---
# 11ai Material UI v9 styling and slots

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; prefer v9 `slots` and `slotProps`, current stable class APIs, and the narrowest styling scope.

Resolve component ownership, styling engine, desired scope, theme boundary, slot contract, state source, CSS layer and injection order, server extraction, and consumer count before editing.

## Inspect first

```bash
rg -n 'sx=|styled\(|components:|styleOverrides|variants:|GlobalStyles|CssBaseline|StyledEngineProvider|injectFirst|slots=|slotProps=|componentsProps=' COMPONENTS THEME_FILES
rg -n '\.Mui[A-Za-z]+-(root|disabled|selected|focusVisible|error|checked|expanded)' --glob '*.css' --glob '*.ts' --glob '*.tsx'
```

Identify whether the change is one instance, a reusable wrapper, all theme instances, or global CSS. Count consumers before replacing deprecated prop bags or class selectors.

## Operate

Use `sx` for one-off instance styles, `styled()` for reusable styled components, `theme.components` for application-wide defaults and overrides, and global CSS only for genuinely global needs. Use `slots` to replace structure and `slotProps` to configure the exact slot.

Never guess token values, internal DOM structure, generated Emotion class names, state ownership, or CSS precedence. Avoid deep selectors and broad `!important`. Combine stable slot classes with documented state classes using sufficient specificity.

Changing `CssBaseline`, cache insertion, CSS layers, styled engine, global overrides, or shared slots affects many consumers; show the count, precedence model, and visual diff before acting.

## Verify and report

Test default, hover, focus-visible, active, selected, disabled, error, dark, responsive, and SSR states that apply. Inspect computed style provenance and hydration. Report scope, styling mechanism, slots and classes, consumers, layer and injection order, accessibility and visual checks, files, and rollback.
