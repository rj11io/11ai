---
name: 11ai-antdesign-overlays
description: "Implement Ant Design overlays and feedback with Modal, Drawer, Popconfirm, Alert, message, notification, Spin, and Result. Use when adding confirmations, task panels, toasts, inline errors, loading feedback, or repairing missing context, focus, close, and destructive-action behavior."
---

# Ant Design overlays and feedback

Match the feedback surface to the user's task. Prefer inline errors for local problems, a `Drawer` for a focused side task, a `Modal` for a blocking decision, and `message` or `notification` only for short-lived status that does not need to remain in the page.

## Workflow

1. Identify whether the user must make a decision, complete a task, acknowledge a result, or simply learn that an action finished.
2. Keep the open state and request state explicit. Disable duplicate submissions, show progress, and keep the overlay open when the server returns a correctable error.
3. For hook-based feedback, render it under the `App` provider. If the component needs an imperative modal API, use the hook form and render its `contextHolder` within the provider tree.
4. Put the primary action in a named button, make close behavior deliberate, and restore focus to the trigger when the overlay closes.
5. Use `Popconfirm` only for short, low-context confirmations. Use a `Modal` when the decision needs explanation, a form, or a meaningful loading state.
6. Verify escape, outside click, keyboard focus, screen-reader labels, narrow viewports, slow requests, rejection, retry, and unmount behavior.

```tsx
const [modal, contextHolder] = Modal.useModal()

function handleDelete() {
  modal.confirm({
    title: "Delete this record?",
    content: "This action cannot be undone.",
    okText: "Delete",
    okButtonProps: { danger: true },
    onOk: async () => {
      await deleteRecord()
    },
  })
}

return <>{contextHolder}<Button onClick={handleDelete}>Delete</Button></>
```

Check the installed Ant Design version before relying on the exact return value or async behavior of an imperative API; if the hook API differs, use the documented controlled `open` pattern.

## Review traps

- Do not use a toast as the only report of a validation or authorization failure.
- Do not close a form overlay before the save request succeeds unless the user explicitly chose cancel.
- Avoid nested modals and stacked notifications that obscure the action being confirmed.
- Keep destructive wording, button order, and `danger` styling consistent with the actual consequence.
