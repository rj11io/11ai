---
name: 11ai-operator-html-5-forms-validation
description: "Build and repair HTML5 forms covering labels, field groups, input types, autocomplete, native constraints, submission methods, error associations, and disabled or readonly behavior. Use when creating a form, changing submitted field names, fixing validation, or improving autofill and accessibility."
---
# 11ai HTML5 forms and validation

A form's names, methods, encodings, and targets are an API contract with its server. Resolve the exact file, public contract, target browsers and assistive technologies, and acceptance check before editing.

Version baseline: HTML5, represented by the current WHATWG HTML Living Standard (last updated 20 July 2026), verified 31 July 2026. Use current conforming HTML5 features; treat frozen W3C snapshots and obsolete elements as legacy, and verify browser and assistive-technology support per feature.

## Inspect first

```bash
rg -n '<form|<input|<select|<textarea|<button|<label|name=|autocomplete=' TARGET
npx html-validate TARGET
```

Map every successful control to its name, label, type, initial value, validation rule, and server expectation before changing markup.

Confirm before changing:

- Exact action, method, and encoding.
- Stable control names and values.
- Label and error-message association.
- Autocomplete and privacy expectations.

## Operate

```bash
npm test --if-present
npm run build --if-present
```

Use fieldset and legend for related controls, button for actions, and the narrowest correct input type. Keep client constraints aligned with server validation.

Never change field names, submission destinations, required state, or default values without approval and an end-to-end server check. Require explicit approval for any broader or destructive form of that change, and preview the affected files or public surface first.

## Verify and report

```bash
npm run lint --if-present
npm test --if-present
npm run build --if-present
```

Submit valid and invalid cases, navigate by keyboard, confirm serialized payloads, and verify errors are announced without exposing sensitive values. Report the target, files changed, public behavior, compatibility or accessibility impact, checks run, and rollback. Hand configuration failures to `11ai-operator-html-5-troubleshooting` and cross-system seams to `11ai-operator-html-5-integrations`.
