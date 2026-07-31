---
name: 11ai-operator-mui-v9-navigation-overlays
description: "Build Material UI v9 navigation and overlays with AppBar, Drawer, Breadcrumbs, Tabs, Menu, Dialog, Modal, Popover, Tooltip, portal containers, close reasons, roving tabindex, focus traps, restoration, and stacking. Use when users navigate, choose actions, or interact with layered MUI surfaces."
---
# 11ai Material UI v9 navigation and overlays

Version baseline: Material UI 9.2.0 (stable), verified 2026-07-31; use v9 roving tabindex and slot APIs, keep MenuItem inside Menu or MenuList, and exclude removed `disableEscapeKeyDown` behavior.

Resolve route ownership, selected state, trigger and anchor identity, open-state owner, close reasons, portal container, modal versus non-modal semantics, z-index context, and focus destination before editing.

## Inspect first

```bash
rg -n '@mui/material/(AppBar|Drawer|Breadcrumbs|Tabs|Tab|Menu|Dialog|Modal|Popover|Tooltip)|open=|anchorEl=|onClose=|disablePortal|container=|slots=|slotProps=' COMPONENTS
rg -n 'disableEscapeKeyDown|componentsProps|MenuItem|tabIndex|aria-controls|aria-expanded|aria-haspopup' COMPONENTS
```

Trace every trigger to its controlled surface and every close path to its state transition. Inspect real links, history behavior, portal ownership, scroll locking, escape handling, and focus restoration.

## Operate

Use router links with real destinations and derive selected navigation from location. Keep MenuItem within Menu or MenuList in v9. Handle `Dialog` and `Modal` escape behavior through the `reason` passed to `onClose` rather than the removed prop.

Never invent route targets, destructive confirmation text, close policy, portal roots, or whether escape and backdrop clicks are allowed. A dialog must have a labeled title and an intentional initial focus path. Tooltips supplement visible controls; they do not replace accessible names.

## Verify

Exercise pointer, keyboard, escape, backdrop, route, back-button, nested overlay, long content, reduced motion, and narrow viewport paths. Confirm one tabbable item in roving-tabindex widgets, focus containment and restoration, stacking, scroll behavior, and screen-reader names.

## Report

State routes and state owners, triggers, close reasons, portal and z-index decisions, focus lifecycle, files, accessibility checks, and rollback. Ask before changing navigation destinations, destructive confirmations, or global portal containers.
