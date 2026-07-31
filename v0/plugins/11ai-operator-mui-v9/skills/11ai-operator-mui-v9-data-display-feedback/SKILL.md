---
name: 11ai-operator-mui-v9-data-display-feedback
description: "Build Material UI v9 data display and feedback with Table, List, Card, Avatar, Chip, Badge, Tooltip, Alert, Snackbar, Progress, Skeleton, empty states, and error states. Use when the user asks to present records, status, loading, results, or transient feedback with MUI Core."
---
# 11ai Material UI v9 data display and feedback

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; cover MUI Core Table and display components, not separately versioned MUI X Data Grid, Charts, or advanced licensed widgets.

Resolve data ownership, field meaning, loading and error contracts, pagination source, row identity, action semantics, live-region needs, density, and empty-state behavior before editing.

## Inspect first

```bash
rg -n '@mui/material/(Table|List|Card|Avatar|Chip|Badge|Alert|Snackbar|Progress|Skeleton)|DataGrid|loading|error|empty|rowKey|key=' COMPONENTS
rg -n 'aria-live|role=|TablePagination|Snackbar' COMPONENTS
```

Count rendered records and actions, identify stable keys, inspect table semantics and headings, distinguish initial loading from background refresh, and confirm whether any requested feature belongs to MUI X.

## Operate

Use Core Table for semantic tabular data and let the server or data library own pagination, sorting, retries, and totals. Preserve headings and relationships when making responsive adaptations. Choose Skeleton only when the eventual shape is predictable and Progress when completion or waiting needs an explicit signal.

Use Alert for persistent in-flow status and Snackbar for brief non-critical feedback. Never hide a failed action only in a transient Snackbar. Do not invent record totals, status meanings, severity, retry safety, or destructive row actions. Preview bulk row or component rewrites.

## Verify

Test empty, small, large, loading, refreshing, partial, error, retry, long text, missing media, and narrow viewport states. Verify screen-reader announcements, table navigation, action names, color-independent status, dismissal timing, and focus preservation.

## Report

State components and data owners, record counts and limits, loading and error contracts, MUI Core or X boundary, accessibility behavior, files, tests, and rollback. Ask before changing pagination, destructive actions, or persistent status semantics.
