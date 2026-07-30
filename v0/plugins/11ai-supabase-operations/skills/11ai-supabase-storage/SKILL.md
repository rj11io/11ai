---
name: 11ai-supabase-storage
description: "Create and operate Supabase storage buckets, covering public versus private buckets, storage access policies on the objects table, uploads with content type and cache control, signed URLs and signed upload URLs, path conventions that scope files per user, listing and moving objects, image transformations, and deletion. Use when files must be uploaded or served, when a bucket must be secured, when an upload is rejected, or when a file URL returns nothing."
---
# 11ai supabase storage

Storage is a Postgres-backed object store, so access is controlled by row level security policies on `storage.objects` — the same mechanism as any table. Decide whether a bucket is public or private before creating it, because that choice determines how every file is served and it is awkward to reverse.

## Inspect first

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets;

select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects';

select bucket_id, name, metadata ->> 'size' as size, created_at
from storage.objects
where bucket_id = 'BUCKET'
order by created_at desc
limit 20;
```

Read `public` first. A public bucket serves every object to anyone with the URL, and no policy changes that for reads — the only protection is that the path is unguessable, which is not protection.

## Create a bucket deliberately

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
```

- **Public** for content that is genuinely public: avatars, marketing images. Served from a stable URL, cacheable by a CDN.
- **Private** for anything belonging to one user or tenant. Served through a signed URL with an expiry.

Set `file_size_limit` and `allowed_mime_types` on the bucket. Client-side validation is a convenience; the bucket limit is the control that actually holds, because an attacker calls the API directly.

Choose a path convention that makes per-user policies possible, with the owning id as the first segment:

```text
avatars/USER_ID/avatar.png
invoices/ORG_ID/2026/invoice-123.pdf
```

This matters because policies match on path segments. A flat namespace cannot be scoped to a user without a lookup table.

## Write access policies

Even a public bucket needs policies for writes — public affects reads only.

```sql
create policy "avatars_read_all"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "avatars_write_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
```

`storage.foldername(name)` splits the object path into segments, so `[1]` is the first folder. Comparing it to `auth.uid()` is what stops one user writing into another's folder.

Always include the `bucket_id` check. A policy without it applies across every bucket, which quietly grants access to buckets added later.

For a private bucket, drop the `select` policy for `public` and grant it only to the owner or the organization's members.

## Upload and serve

```ts
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`${user.id}/avatar.png`, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: true,
  })
```

```ts
const { data } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/avatar.png`)

const { data: signed, error } = await supabase.storage
  .from("invoices")
  .createSignedUrl(`${orgId}/invoice-123.pdf`, 60 * 5)
```

Points that decide behaviour:

- Set `contentType` explicitly. Without it a file can be stored as `application/octet-stream` and the browser downloads it instead of displaying it.
- `upsert: true` overwrites an existing object. Leave it off unless replacing is intended, or a retry silently destroys the previous file.
- `getPublicUrl` returns a URL for any path in a public bucket whether or not the object exists — it does not check. A broken image with a valid-looking URL usually means the upload failed and its `error` was ignored.
- Keep signed URL expiry short. A signed URL is a bearer credential: anyone holding it has the file until it expires, so do not log it, put it in an email that persists, or cache it publicly.

For a large or direct client upload, issue a signed upload URL from the server so the file never passes through it:

```ts
const { data } = await supabase.storage
  .from("invoices")
  .createSignedUploadUrl(`${orgId}/${filename}`)
```

Validate the filename on the server before signing. A path traversal in a user-supplied name writes outside the intended folder.

## List, move, and delete

```ts
await supabase.storage.from("avatars").list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } })
await supabase.storage.from("avatars").move(`${user.id}/old.png`, `${user.id}/new.png`)
await supabase.storage.from("avatars").remove([`${user.id}/avatar.png`])
```

Deletion is permanent — there is no version history unless the application keeps one. List the exact paths, show them, and get approval for that list. Never pass a computed array to `remove` without printing it first.

Removing an object does not remove the database row that references it, and removing a row does not remove the object. Keep the two in step deliberately, usually by deleting the object first and the row second, so a failure leaves an orphan file rather than a broken reference.

## Verify and report

```sql
select name, metadata ->> 'mimetype' as mimetype, metadata ->> 'size' as size
from storage.objects
where bucket_id = 'BUCKET' and name like 'PREFIX%';
```

Verify with the identity that matters, not just your own: as another authenticated user, confirm a write into their folder is rejected and a read of a private object without a signed URL fails. As an anonymous caller, confirm a private bucket returns nothing.

Report the bucket, whether it is public, its size and type limits, the policies by command, the path convention, the objects created or removed with their content types, signed URL expiry where used, and the cross-user and anonymous verification results. Never include a signed URL or a service role key in the report.
