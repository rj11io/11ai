---
name: 11ai-antdesign-forms
description: "Build, review, and repair typed Ant Design forms with Form, Form.Item, validation rules, async submission, dependencies, dynamic Form.List fields, Upload normalization, and controlled values. Use when adding create or edit forms, fixing validation or initial-value behavior, or wiring submit, reset, loading, and error states."
---

# Ant Design forms

Treat the form instance as the source of truth for fields registered through `Form.Item`. Define the data shape first, then wire validation, submission, and server errors around that shape.

## Workflow

1. Define the form value type and distinguish create defaults from edit data.
2. Create one `Form` instance with `Form.useForm` when the parent needs reset, validation, or programmatic updates.
3. Give every submitted field a stable `name`; put rules on the matching `Form.Item`.
4. Use `initialValues` for first-render defaults. When edit data arrives later, call `form.setFieldsValue`; do not expect `initialValues` to react to prop changes.
5. Submit through `form.validateFields`, set a loading state, map known server field errors with `form.setFields`, and keep a visible form-level error for unknown failures.
6. Verify invalid, valid, loading, server-error, reset, and keyboard-submit states.

```tsx
type UserValues = { name: string; email: string }

const [form] = Form.useForm<UserValues>()

<Form<UserValues>
  form={form}
  layout="vertical"
  onFinish={async (values) => saveUser(values)}
>
  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
    <Input autoComplete="name" />
  </Form.Item>
  <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
    <Input autoComplete="email" />
  </Form.Item>
  <Button htmlType="submit" type="primary">Save</Button>
</Form>
```

## Common patterns

- Use `Form.List` for repeatable fields and derive nested names from the provided field metadata.
- Use `dependencies` or `shouldUpdate` for cross-field rules, but do not combine them on the same item without a clear reason.
- Normalize `Upload` values with `valuePropName="fileList"` and `getValueFromEvent` only when the field is actually managed by the form.
- Use `preserve={false}` for conditionally removed fields when stale values would be harmful.
- Keep submit buttons disabled or loading during the request, but do not disable fields needed to explain a failure.
- Prefer `onFinish` for successful validation and `onFinishFailed` for focusable error feedback.

## Review traps

Look for a child with its own `value` and `onChange` fighting the form, a reset that leaves derived state behind, rules that do not match the field type, and a submit handler that sends stale props instead of validated values.
