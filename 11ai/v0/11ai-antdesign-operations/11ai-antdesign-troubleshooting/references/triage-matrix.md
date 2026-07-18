# Ant Design troubleshooting triage matrix

Use the symptom to choose the first check. Confirm the installed `antd` version before applying any version-specific fix.

| Symptom | First checks | Typical narrow fix |
| --- | --- | --- |
| Components have no styles | Package version, CSS order, provider, SSR registry or extraction | Correct the version-matched style integration and provider boundary |
| Styles flash or differ after hydration | Server/client theme, registry, browser-only values, CSS order | Make initial inputs deterministic and use the supported SSR setup |
| Hydration warning names an Ant Design subtree | Time, random IDs, viewport branch, theme storage, client boundary | Move browser-only state to the client and render the same server fallback |
| `message` or `notification` does nothing | `App` context, hook call location, duplicate providers | Put the call under the shared provider and use the documented hook |
| Imperative modal has no context or wrong theme | `contextHolder` placement, provider nesting | Render the holder inside the matching provider or use controlled `open` |
| Form ignores edited record | `initialValues` timing, field names, form instance | Call `setFieldsValue` when the record changes and reset stale fields |
| Form child value is not submitted | `name`, `valuePropName`, `getValueFromEvent`, child control props | Match the field binding to the child component and remove competing state |
| Validation never runs | `rules`, `name`, `htmlType`, `onFinish` versus custom submit | Register the field and submit through the form API |
| Table page resets or loops | Controlled `pagination`, `onChange`, query effect dependencies | Keep one query source of truth and update it once per table event |
| Table rows or selection jump | `rowKey`, reused keys, array indexes, refresh behavior | Use a stable domain identifier and reconcile selection deliberately |
| Table shows empty while fetching | `loading`, first-load state, stale response | Render loading separately and guard overlapping requests |
| Overlay is behind a panel | Portal container, stacking context, transformed parent, z-index token | Fix the container or stacking context before changing z-index |
| Drawer or modal is too wide on mobile | `width`, `styles`, viewport behavior, long content | Use responsive dimensions and an internal scroll region |
| Icon import fails | Package installed, exact icon export, import path | Import the named icon from `@ant-design/icons` and verify the version |
| Date picker value has the wrong shape | Installed version, date adapter, locale, form serialization | Keep UI value and API value conversion at the boundary |
| Theme token has no effect | Correct provider, token name, nested provider, CSS specificity | Put the token on the active provider and verify the component token name |
| Layout clips or scrolls twice | `min-width: 0`, fixed heights, overflow owners, wide table | Assign one scroll owner and allow flex/grid children to shrink |
| Screen reader or keyboard path is unclear | Labels, focus, tab order, icon-only buttons, color-only status | Add accessible names, focus restoration, and text or semantic status |

## Evidence to collect

- `package.json` dependency versions and package manager lockfile.
- Exact warning or error text and the first application stack frame.
- The smallest failing component plus its provider and route boundary.
- Values passed to controlled props and the response or query state that feeds them.
- Whether the failure reproduces in a production build, another browser, and a minimal data set.
