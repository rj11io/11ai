---
name: 11ai-antdesign-integrations
description: "Connect Ant Design to the surrounding React stack, covering routers, server-state and form libraries, date adapters, Tailwind or existing CSS, internationalization and locale, design tokens, icon bundling, and component testing. Use when Ant Design must cooperate with another library, when links or navigation inside components behave wrongly, when a date picker rejects the project's date type, or when styles from two systems collide."
---

# Ant Design integrations

Treat each integration as one seam between two systems that both want control of the same thing: markup, styling, state, or dates. Find which side already owns it in this project, then adapt Ant Design to that owner rather than adding a second source of truth.

## Name the seam

Identify which of these the task actually touches:

- **Routing** — `Menu`, `Breadcrumb`, `Tabs`, `Pagination`, and `Table` links must produce the router's navigation, not full page loads.
- **Server state** — `Table`, `Select`, and `Form` need loading, error, and pagination state that a data library already tracks.
- **Dates** — `DatePicker` and `TimePicker` use one date library; the app may use another.
- **Styling** — Ant Design generates its own CSS; Tailwind or an existing stylesheet may reset or outrank it.
- **Locale** — `ConfigProvider` carries component text and date formats separately from the app's translation library.
- **Testing** — component queries depend on the DOM Ant Design renders, including portals.

## Wire one deliberately

1. Read the project first: the router, the data-fetching library, the date type used in models and on the wire, the CSS pipeline, and the test setup.
2. Change one seam at a time and keep the adapter in one place. A shared `renderLink` helper beats per-component link handling.
3. For routing, render the router's link component inside the Ant Design item rather than handling `onClick` and calling `navigate` yourself. Keep `href` real so middle-click and open-in-new-tab still work.
4. For server state, let the data library own loading and pagination and pass its values down. Do not mirror them into component state.
5. For dates, pick the adapter that matches the project's existing date library and convert at the form boundary, not inside each field.
6. For styling, scope the other system away from Ant Design's markup instead of raising specificity. A CSS reset that strips button and input styling is the usual cause of a half-styled component.
7. For locale, pass a locale to `ConfigProvider` and keep the app's own translated strings in the app's translation library. They are two separate concerns.

Read [references/integrations.md](references/integrations.md) for the router link patterns, the table plus server-state shape, the date adapter choices, the Tailwind coexistence settings, and the testing setup for portal-rendered components.

## Verify end to end

Exercise the real path rather than the component in isolation: click a menu item and confirm the URL changes without a reload, change a table page and confirm one request goes out with the right parameters, submit a date and confirm the value that reaches the server matches the model's type, and switch locale and confirm both component text and formats change.

## Review traps

Look for a router link wrapped so that the clickable area is the text rather than the whole item, pagination that fires two requests because both the table and the data library own the page, a date picker returning a library object where the model expects an ISO string, a CSS reset that outranks generated styles, and tests that fail only for `Modal`, `Drawer`, `Select`, or `Tooltip` because their content renders in a portal outside the queried container.
