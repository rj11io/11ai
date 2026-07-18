---
name: 11ai-antdesign-tables
description: "Build and repair typed Ant Design Tables with stable row keys, column renderers, sorting, filtering, pagination, selection, expandable rows, loading, empty states, and server-side data. Use when adding an admin or data-heavy table or fixing stale rows, incorrect pagination, filters, or selection behavior."
---

# Ant Design tables

Separate table view state from the data-fetching contract. A table should have stable identity, explicit loading and empty states, and a clear answer to whether sorting, filtering, and pagination happen locally or on the server.

## Workflow

1. Define the row type and choose a stable `rowKey` from the domain. Never use the array index when rows can be inserted, removed, or reordered.
2. Build typed columns with small, pure renderers. Keep formatting out of fetch effects and avoid recreating expensive column definitions on every render.
3. Decide the state model:
   - Local data: let the table derive pagination, filters, and sorting from the loaded rows.
   - Server data: control `pagination`, fetch from `onChange`, and preserve the full query state in the URL or page state.
4. For server data, reset to page one when a filter or sort changes, pass the real `total`, show `loading`, and guard against stale responses when requests overlap.
5. Add selection only when a bulk action exists. Keep selected keys stable across refreshes when the product requires it, and explain unavailable or already-processed rows.
6. Verify loading, empty, error, long content, narrow widths, keyboard focus, sorting, filtering, page changes, refreshes, and selection after data changes.

```tsx
type User = { id: string; name: string; status: "active" | "invited" }

const columns: TableProps<User>["columns"] = [
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Status", dataIndex: "status", key: "status" },
]

<Table<User>
  rowKey="id"
  columns={columns}
  dataSource={rows}
  loading={isLoading}
  pagination={{ current: page, pageSize, total }}
  onChange={(pagination, filters, sorter) => {
    setQuery({ page: pagination.current ?? 1, pageSize, filters, sorter })
  }}
/>
```

## Review traps

- Do not mix `defaultCurrent` with a controlled `current` value.
- Do not show a successful empty state while the first request is still loading.
- Reset incompatible selection when the dataset or filter scope changes.
- Use `scroll.x` or a responsive column strategy for wide data, not clipped text.
- Keep action buttons explicit and accessible; put destructive bulk actions behind the appropriate confirmation flow.
