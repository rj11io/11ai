---
name: 11ai-operator-shadcn-v4-forms-data
description: "Build and verify shadcn v4 fields, forms, validation, data tables, filters, pagination, sorting, selection, server-data states, and accessible feedback while preserving the host application's state and schema choices. Use when the user asks for form controls, React Hook Form or schema integration, data tables, editable data, filters, or loading, empty, and error states."
---
# 11ai shadcn v4 forms and data

Version baseline: shadcn CLI 4.14.1 (stable), verified 2026-07-31; use the current Field and Data Table guidance for the project's configured primitive base and never assume a form or table state library is already selected.

Trace the data owner, schema, transport boundary, server or client rendering, validation source, submission lifecycle, table state, URL synchronization, authorization, and sensitive fields before changing UI code.

## Inspect the installed patterns

```bash
npx shadcn@4.14.1 info --json
npx shadcn@4.14.1 docs field
npx shadcn@4.14.1 docs data-table
rg -n 'useForm|zodResolver|Field|aria-invalid|useReactTable|ColumnDef|Pagination' app src components packages
```

Confirm installed component source, primitive base, React Hook Form or alternative ownership, schema library, TanStack Table version, server actions or API client, and existing error contract. Preserve established choices unless the user explicitly requests a migration.

## Implement fields and forms

Keep labels, descriptions, controls, and messages associated. Put `data-invalid` on the Field wrapper and `aria-invalid` on the actual control when invalid. Maintain one state owner, stable field identifiers, typed defaults, focus on actionable errors, pending and duplicate-submit guards, and server-error mapping.

Never log passwords, tokens, payment details, health data, customer records, or raw submissions. Client validation improves feedback but never replaces server validation and authorization.

## Implement data experiences

Keep shadcn Table primitives presentational and table state in the selected data layer. Define stable row identity and typed columns; make sorting, filtering, pagination, visibility, selection, and URL state explicitly controlled where persistence matters.

Design loading, empty, filtered-empty, partial, stale, permission-denied, and retryable-error states. Preserve keyboard access, row and cell semantics, responsive overflow, and screen-reader names for icon actions.

## Verify and report

Test valid, invalid, untouched, dirty, pending, successful, rejected, reset, and reconnect flows; then exercise zero, one, many, long, paginated, filtered, sorted, and selected rows. Report schemas and state owners, component/base docs, dependencies, data exposure controls, accessibility checks, server enforcement, and rollback.
