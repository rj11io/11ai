# Ant Design integrations reference

Recipes for the seams where Ant Design meets another library. Check the installed versions before copying any of them.

## Routers

Render the router's own link inside the Ant Design item. Keep the `href` real so the browser's middle-click, open-in-new-tab, and hover preview keep working — an `onClick` handler that calls `navigate` breaks all three.

### React Router

```tsx
import { Link } from "react-router-dom"
import { Menu } from "antd"

const items = [
  { key: "/dashboard", label: <Link to="/dashboard">Dashboard</Link> },
  { key: "/settings", label: <Link to="/settings">Settings</Link> },
]

<Menu mode="inline" selectedKeys={[location.pathname]} items={items} />
```

Drive `selectedKeys` from the current location so the highlight survives a back-button navigation and a direct page load.

### Next.js

```tsx
import Link from "next/link"

const items = [
  { key: "/dashboard", label: <Link href="/dashboard">Dashboard</Link> },
]
```

Anything using Ant Design hooks or state needs a client component. A `Menu` in a server component fails at render time.

### Breadcrumb

```tsx
<Breadcrumb
  items={[
    { title: <Link to="/">Home</Link> },
    { title: "Current page" },
  ]}
/>
```

Leave the final entry as plain text; linking the page the user is already on is a navigation dead end.

## Server state

Let the data library own loading, error, and pagination. Pass its values in and send changes back out.

```tsx
const [params, setParams] = useState({ page: 1, pageSize: 20 })

const { data, isFetching } = useQuery({
  queryKey: ["users", params],
  queryFn: () => fetchUsers(params),
})

<Table
  rowKey="id"
  columns={columns}
  dataSource={data?.rows}
  loading={isFetching}
  pagination={{
    current: params.page,
    pageSize: params.pageSize,
    total: data?.total,
  }}
  onChange={(pagination, filters, sorter) =>
    setParams({
      page: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 20,
      sort: Array.isArray(sorter) ? undefined : sorter.field,
    })
  }
/>
```

Two rules keep this honest:

- Set `total` from the server response. Without it the table paginates whatever rows it was handed and hides the rest.
- Do not also store rows in component state. One owner for the data, one owner for the page.

For a `Select` that searches server-side, set `filterOption={false}`, debounce `onSearch`, and show `loading` while the request is open. Leaving `filterOption` at its default makes the component filter the results a second time on the client.

## Dates

`DatePicker` returns objects from whichever date library the installed Ant Design version builds on. Two choices, and the project's existing date library decides:

- The project already uses the same library: use `DatePicker` directly and convert at the form boundary.
- The project uses a different one: use the version's documented adapter or generate a picker for that library, rather than converting in every field.

Convert once, where the form meets the API:

```tsx
<Form
  onFinish={(values) => {
    saveUser({
      ...values,
      startsAt: values.startsAt?.toISOString(),
    })
  }}
>
  <Form.Item name="startsAt" label="Starts at">
    <DatePicker showTime />
  </Form.Item>
</Form>
```

When loading edit data, convert the other way in `setFieldsValue`. Passing an ISO string straight into the picker renders an empty field with no error.

Time zones are the common bug: a date-only picker produces a local midnight that can shift a day when serialized to UTC. Decide whether the field is a calendar date or an instant, and keep that decision in one helper.

## Tailwind and existing CSS

Tailwind's preflight resets element styling, which strips Ant Design buttons and inputs. Two workable settings:

```js
// tailwind.config.js
module.exports = {
  corePlugins: { preflight: false },
}
```

Or keep preflight and scope Tailwind's reset away from Ant Design's markup. Turning preflight off is simpler and is the usual choice when Ant Design owns the components and Tailwind only handles layout.

Do not fight generated styles with `!important` or deep selectors. Ant Design's class names are not a stable API, and a specificity war breaks on the next patch release. Use theme tokens instead:

```tsx
<ConfigProvider
  theme={{
    token: { colorPrimary: "#4f46e5", borderRadius: 6 },
    components: { Button: { controlHeight: 36 } },
  }}
>
```

Keep tokens in one module so Tailwind's config and Ant Design's tokens can read the same values rather than drifting apart.

## Locale and internationalization

Two separate concerns:

- Ant Design's own component text and date formats come from a locale passed to `ConfigProvider`.
- The application's strings come from the app's translation library.

```tsx
import enUS from "antd/locale/en_US"
import ptPT from "antd/locale/pt_PT"

<ConfigProvider locale={language === "pt" ? ptPT : enUS}>
```

Switch both from the same state so a language change does not leave half the interface behind. The date library used by the pickers usually needs its own locale import as well.

## Testing

Ant Design renders `Modal`, `Drawer`, `Select` dropdowns, `Tooltip`, and `DatePicker` panels into a portal at the end of `document.body`, outside the container a test rendered. Query the screen, not the container:

```tsx
render(<UserForm />)

await userEvent.click(screen.getByLabelText("Role"))
await userEvent.click(await screen.findByTitle("Admin"))

expect(screen.getByRole("dialog")).toBeInTheDocument()
```

Practical points:

- Use `findBy` queries for anything that opens. Portal content mounts asynchronously and `getBy` fails before the animation starts.
- Query by accessible role and label rather than by generated class names.
- Match on visible text or `title` for `Select` options; the option markup is not a native `option` element.
- Some components measure the DOM, which jsdom does not implement. Provide the matchMedia and ResizeObserver stubs the version needs in the test setup file rather than in each test.
- Clear portal content between tests. Leaked open overlays make an unrelated later test find two matching elements.
