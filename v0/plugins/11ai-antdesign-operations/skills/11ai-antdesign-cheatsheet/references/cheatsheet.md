# Ant Design quick reference

Use this as a starting point, then verify exact props and API names against the installed `antd` version.

## Choose by job

| Need | Start with | Add when needed |
| --- | --- | --- |
| App shell | `Layout` | `Sider`, `Header`, `Content`, `Footer` |
| One-dimensional spacing | `Flex` or `Space` | `wrap`, alignment, responsive gap |
| Responsive columns | `Grid` or `Row` and `Col` | breakpoint spans, gutters |
| Validated data entry | `Form` | `Input`, `Select`, `DatePicker`, `Upload`, `Form.List` |
| Dense records | `Table` | sorting, filtering, pagination, selection |
| Repeated records | `List` | `Card`, `Avatar`, `Skeleton`, `Empty` |
| Labeled details | `Descriptions` | `Tag`, `Typography`, actions |
| KPI or summary | `Statistic` | `Progress`, `Badge`, `Card` |
| Status | `Tag` or `Badge` | `Alert` for a longer explanation |
| No or failed data | `Empty` or `Result` | retry action, `Alert` |
| Short loading state | `Spin` or `Skeleton` | preserve layout while data loads |
| Blocking decision | `Modal` | `Popconfirm` for a short, low-context confirmation |
| Side task | `Drawer` | `Form`, loading, server error |
| Short success status | `message` | `notification` for a named, persistent-ish update |
| Primary navigation | `Menu` | `Dropdown` on compact screens |
| Hierarchical location | `Breadcrumb` | route-aware links |
| Peer views | `Tabs` | URL state when tabs are deep-linkable |
| Sequential task | `Steps` | validation and previous/next controls |
| Global defaults | `ConfigProvider` | `App` for feedback hooks |

## Import patterns

```tsx
import {
  Alert,
  App,
  Button,
  Card,
  ConfigProvider,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Modal,
  Result,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
} from "antd"
import { DeleteOutlined, EditOutlined } from "@ant-design/icons"
```

Prefer named imports and the project's existing import style. Do not construct icons from string names.

## State reminders

| Component | Source of truth to decide first |
| --- | --- |
| `Form` | Form instance and registered field names |
| `Table` | Local rows or controlled query plus server response |
| `Menu` | Route-derived `selectedKeys` and `openKeys` |
| `Tabs` | Local view state or URL search/segment |
| `Modal` and `Drawer` | Controlled `open` plus request state, or a documented hook API |
| `Select` and inputs | Form-owned state or explicit controlled `value` |
| `ConfigProvider` | One shared theme and locale boundary |

## Common gotchas

- `initialValues` populate a form's initial render; use `setFieldsValue` for data that arrives later.
- Use a stable domain key as a table `rowKey`; array indexes cause selection and expansion bugs.
- Reset server pagination when a filter or sort changes, and pass the real `total`.
- Use `App` and the correct context boundary for `message`, `notification`, and `modal` hooks.
- Keep a valid zero distinct from `null`, `undefined`, and an empty result.
- Check the installed version before copying examples for CSS, date libraries, tokens, registries, or imperative APIs.
- Treat `Empty`, `Skeleton`, `Result`, `Alert`, and `Spin` as different states, not interchangeable decoration.

## Question starters

- “Which Ant Design component fits this interaction?” Start with the job table, then ask about route state, form state, or server data.
- “Why does this form ignore new props?” Inspect `initialValues`, field names, and `setFieldsValue`.
- “Why is my table pagination wrong?” Inspect controlled pagination, `total`, `onChange`, and query resets.
- “How do I show a toast from this component?” Inspect whether `App` covers the call and whether the message should instead be inline.
- “How do I theme this one component?” Start with a component token; use a global token only when the decision is global.
