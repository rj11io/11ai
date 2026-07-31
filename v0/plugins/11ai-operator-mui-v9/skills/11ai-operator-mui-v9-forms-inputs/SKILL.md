---
name: 11ai-operator-mui-v9-forms-inputs
description: "Build and operate Material UI v9 forms and inputs including TextField, Select, Autocomplete, Checkbox, Radio, Switch, Slider, validation, controlled state, slots, async options, and accessible labeling. Use when the user asks to create, connect, or repair form behavior."
---
# 11ai Material UI v9 forms and inputs

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; use `slots` and `slotProps`, current Autocomplete typing, and v9 input APIs instead of removed `InputProps`, `inputProps`, or component-specific legacy prop bags.

Resolve the data contract, field ownership, initial values, validation source, submission boundary, async option identity, sensitive values, and accessibility requirements before editing.

## Inspect first

```bash
rg -n '@mui/material/(TextField|Select|Autocomplete|Checkbox|Radio|Switch|Slider|FormControl)|useForm|Controller|value=|defaultValue=|inputValue=|slotProps=' FORM_FILES
rg -n 'InputProps|inputProps|inputRef|componentsProps|renderInput|isOptionEqualToValue|getOptionLabel' FORM_FILES
```

Identify controlled versus uncontrolled fields, duplicate state owners, stable IDs, label associations, error and helper text wiring, option equality, serialization, and private data exposure.

## Operate

Keep one owner for each field. Map form libraries once to `value`, `onChange`, `onBlur`, reference, error state, and helper text. Keep Autocomplete selection `value` separate from text `inputValue`, supply stable equality for object options, and make async loading and no-results states explicit.

Use `slotProps` for the exact underlying slot in v9. Never guess validation rules, defaults, option IDs, date or number semantics, or whether a switch action is immediate. Do not log passwords, tokens, personal data, or complete submitted payloads.

## Verify

Test initial, valid, invalid, touched, disabled, required, loading, empty, server-error, reset, and resubmit states. Exercise keyboard-only entry and selection, accessible names and descriptions, focus on error, autofill where relevant, and duplicate submissions.

## Report

State fields and state owners, schema and server boundaries, validation behavior, slot migration, sensitive-data handling, accessibility checks, files, and rollback. Ask before changing stored values, submission semantics, or shared form abstractions. Hand styling to `11ai-operator-mui-v9-styling-slots`.
