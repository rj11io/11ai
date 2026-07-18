---
name: 11ai-antdesign-data-display
description: "Compose Ant Design data displays with Card, List, Descriptions, Statistic, Tag, Badge, Avatar, Empty, Skeleton, Result, and Progress. Use when building dashboards, detail panels, activity lists, status summaries, loading states, empty states, or error and partial-data views."
---

# Ant Design data display

Design the state model before choosing the component. A useful data display explains loading, empty, error, partial, and success states without making the user infer what happened.

## Choose a component

- Use `Card` for a bounded content region with a clear title or actions.
- Use `Descriptions` for labeled fields on one entity; use a form when the fields are editable.
- Use `List` for repeated records or activity; use `Table` when scanning columns, sorting, filtering, or pagination matters.
- Use `Statistic` for a small number with context and a trend or suffix.
- Use `Tag`, `Badge`, or `Avatar` for compact status and identity, with text or accessible labels when color is not enough.
- Use `Skeleton` or `Spin` during loading, `Empty` for a valid no-data result, and `Result` or an inline `Alert` for failure or a completed outcome.

## Workflow

1. Define the primary question the component answers and the minimum data needed to answer it.
2. Pick a hierarchy: page heading, region heading, primary value, supporting metadata, then actions.
3. Give each state a deliberate rendering path. Preserve the surrounding layout when a single card fails so one request does not erase unrelated content.
4. Format dates, numbers, and statuses consistently. Do not encode meaning only with color or icon shape.
5. Keep labels short, truncate only when the full value remains accessible, and provide responsive behavior for long names and translated text.
6. Verify real data, zero values, null values, long content, loading, errors, and narrow widths.

```tsx
<Card title="Account health" extra={<Link href="/account">View</Link>}>
  <Statistic title="Active users" value={activeUsers} suffix="this month" />
  <Space className="mt-4">
    <Badge status={healthy ? "success" : "warning"} text={healthy ? "Healthy" : "Review"} />
    <Tag color={healthy ? "green" : "gold"}>{planName}</Tag>
  </Space>
</Card>
```

## Review traps

- Do not render `0` as an empty state or hide a valid zero behind a falsy check.
- Do not show a spinner forever when the request has failed; expose retry or next action.
- Keep card actions aligned and predictable; avoid turning an entire card into an unlabeled click target.
- Use `Table` for dense comparison instead of forcing a `List` to imitate a table.
