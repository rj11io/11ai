# shadcn v4 component workflows

Version baseline: shadcn CLI 4.14.1, stable, researched 2026-07-31. The current [component catalog](https://ui.shadcn.com/docs/components) provides separate Base UI, React Aria, and Radix implementations.

## The source-ownership model

shadcn components are copied source, not opaque package exports. After installation, the project owns the file and may customize it. Before any update:

1. Resolve installed files and base with `info --json`.
2. Fetch current docs with `docs COMPONENT`.
3. Inspect the registry item with `view`.
4. Compare upstream with `add --diff`.
5. Separate upstream changes from project customizations.
6. Approve and merge file by file; never replace the directory wholesale.

## Actions and controls

Button, Button Group, Toggle, Toggle Group, Dropdown Menu, Context Menu, and Command expose actions and selection. Use built-in variants and sizes. Icons use the project's configured icon library and the component's documented icon convention. Every icon-only control needs an accessible name. Distinguish an action from a navigation link and preserve native semantics.

## Forms and fields

Use FieldGroup, Field, FieldLabel, FieldDescription, and FieldError to express form structure. Put `data-invalid` on Field and `aria-invalid` on the control. Use semantic `fieldset` and legend grouping when inputs form one choice. Input, Textarea, Native Select, Select, Checkbox, Radio Group, Switch, Slider, Calendar, Date Picker, Combobox, and Input OTP each have different state and focus contracts; fetch base-specific docs before wiring a form library.

## Overlays and focus

Alert Dialog, Dialog, Drawer, Sheet, Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select may render through portals. Preserve trigger relationships, controlled open state, escape and outside-interaction policy, initial focus, focus containment, and restoration. Never nest interactive elements or use Tooltip as the only accessible name.

## Navigation and structure

Breadcrumb, Menubar, Navigation Menu, Pagination, Sidebar, and Tabs must preserve real link destinations, current-page state, landmarks, keyboard movement, and responsive collapse behavior. Do not turn links into click handlers or make visual order contradict DOM and focus order.

## Data display and feedback

Table, Data Table, Card, Item, Avatar, Badge, Empty, Kbd, Progress, Skeleton, Spinner, Alert, Sonner, and Typography present state rather than own it. Keep data fetching, sorting, filtering, selection, pagination, retry, and destructive actions in explicit owners. Persistent failures need persistent feedback; transient success may use a toast.

## Layout and composition

Accordion, Aspect Ratio, Carousel, Collapsible, Resizable, Scroll Area, Separator, and Sidebar affect containment, sizing, or disclosure. Test zoom, long content, narrow viewports, RTL, reduced motion, and keyboard resize or navigation where applicable. Use `gap-*` for layout spacing and semantic color tokens instead of raw palette utilities.

## Chat components

Message Scroller, Message, Bubble, Attachment, and Marker are composable conversation primitives. Message Scroller owns anchored scrolling and visibility behavior, not model, transport, persistence, or message state. Treat attachment actions as separate interactive targets and never expose private file URLs or message payloads in logs.

## Base-specific differences

The primitive base controls props, render composition, state attributes, dependencies, and event behavior. Base UI, Radix, and React Aria are all supported, but their APIs are not interchangeable. `asChild` from one ecosystem may become a `render` pattern in another. Confirm `components.json.base`, then use only the resolved docs and source for that base.

## Customization hierarchy

Prefer, in order:

1. Existing component and documented variant.
2. Composition of existing parts.
3. New variant in the owned component's variant definition.
4. Small local layout class on the consumer.
5. A new component only when the behavior contract is genuinely distinct.

Keep semantic theme colors and typography in the global token owner. Avoid consumer-by-consumer color overrides, deep internal selectors, and raw values that bypass the preset.

## Verification matrix

For every changed component, choose applicable rows: pointer, keyboard, touch, screen reader, light/dark, RTL, reduced motion, zoom, narrow/wide, empty/loading/error, disabled/invalid, server render/hydration, portal stacking, and long localized content. Run types, lint, tests, and production build after source changes.
