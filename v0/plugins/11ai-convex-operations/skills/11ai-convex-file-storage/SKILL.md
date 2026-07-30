---
name: 11ai-convex-file-storage
description: "Store and serve files through Convex storage, covering upload URLs generated in a mutation, direct browser uploads, recording the storage id on a document, serving with getUrl or an HTTP action, content type and size validation, authorizing access per file, deleting a file alongside its referencing row, and finding orphaned files. Use when files must be uploaded or served, when a stored file URL returns nothing, or when file access must be restricted to its owner."
---
# 11ai convex file storage

A stored file has two halves: the bytes, identified by a storage id, and the document that references it. They are stored independently, so every operation here has to keep them in step — an upload that never records its id leaves an unreachable file, and a deleted row leaves the bytes behind.

## Inspect first

```bash
grep -rn 'generateUploadUrl\|ctx.storage' convex/*.ts | head -20
grep -n 'v.id("_storage")' convex/schema.ts
npx convex dashboard
npx convex logs --limit 30
```

Read the schema for where storage ids are recorded. A field typed `v.id("_storage")` is a file reference; a plain `v.string()` holding an id works but loses the type check.

## Upload

The flow is three steps, and the third is the one people forget:

```ts
// convex/files.ts
import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUser } from "./lib/auth"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return ctx.storage.generateUploadUrl()
  },
})

export const attachAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    const meta = await ctx.db.system.get(args.storageId)
    if (!meta) throw new Error("Upload not found")
    if (meta.size > 5 * 1024 * 1024) {
      await ctx.storage.delete(args.storageId)
      throw new Error("File too large")
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(meta.contentType ?? "")) {
      await ctx.storage.delete(args.storageId)
      throw new Error("Unsupported file type")
    }

    if (user.avatarId) await ctx.storage.delete(user.avatarId)
    await ctx.db.patch(user._id, { avatarId: args.storageId })
  },
})
```

```tsx
const generateUploadUrl = useMutation(api.files.generateUploadUrl)
const attachAvatar = useMutation(api.files.attachAvatar)

async function onSelect(file: File) {
  const url = await generateUploadUrl()
  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!result.ok) throw new Error("Upload failed")
  const { storageId } = await result.json()
  await attachAvatar({ storageId })
}
```

The parts that decide whether this is safe:

- **Authorize before issuing the upload URL.** `generateUploadUrl` must not be callable by an anonymous caller, or anyone can fill your storage.
- **Validate after the upload, not before.** The browser uploads directly, so client-side checks on type and size are advisory. Read the real metadata with `ctx.db.system.get(storageId)` in the mutation and delete the file if it fails — that is the only enforcement point.
- **Replace deliberately.** Deleting the previous avatar before patching the new id keeps one file per user instead of accumulating every version.
- **Record the id in the same mutation that validates it.** A client that uploads and then never calls the recording mutation leaves an orphan; a scheduled sweep is how you clean those up.

## Serve

```ts
export const getAvatarUrl = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewer = await requireUser(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user?.avatarId) return null

    if (!(await canView(ctx, viewer, user))) throw new Error("Forbidden")

    return ctx.storage.getUrl(user.avatarId)
  },
})
```

`ctx.storage.getUrl` returns a URL that anyone holding it can fetch, with no further authorization. That is fine for content that is effectively public, and wrong for anything private — the authorization has to happen in the query that hands the URL out, and the URL should be treated as a short-lived credential rather than stored or logged.

For genuinely private files where you want per-request control, serve through an HTTP action instead:

```ts
// convex/http.ts
http.route({
  path: "/file",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) return new Response("missing id", { status: 400 })

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return new Response("unauthorized", { status: 401 })

    const allowed = await ctx.runQuery(internal.files.mayRead, {
      storageId: id as Id<"_storage">,
      subject: identity.subject,
    })
    if (!allowed) return new Response("forbidden", { status: 403 })

    const blob = await ctx.storage.get(id as Id<"_storage">)
    if (!blob) return new Response("not found", { status: 404 })

    return new Response(blob, {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=60" },
    })
  }),
})
```

This costs a function invocation per fetch and gives you a real access check on every request. Use it for documents and invoices; use `getUrl` for avatars and public images.

Never return a storage id to a client that is not allowed to read the file. An id plus a public `getUrl` query is the same as handing over the file.

## Delete and find orphans

```ts
export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    if (!user.avatarId) return

    await ctx.db.patch(user._id, { avatarId: undefined })
    await ctx.storage.delete(user.avatarId)
  },
})
```

Clear the reference first, then delete the bytes. If the delete fails, you have an orphaned file rather than a document pointing at nothing — the former is a cleanup task, the latter is a broken page.

Deleting a document does not delete its files. Whenever a row holding a storage id is removed, delete the file in the same mutation, or the storage grows forever.

```ts
export const sweepOrphans = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const page = await ctx.db.system
      .query("_storage")
      .paginate({ numItems: 100, cursor: args.cursor ?? null })

    for (const file of page.page) {
      const referenced = await ctx.db
        .query("users")
        .withIndex("by_avatar", (q) => q.eq("avatarId", file._id))
        .first()
      if (!referenced && Date.now() - file._creationTime > 24 * 60 * 60 * 1000) {
        await ctx.storage.delete(file._id)
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.files.sweepOrphans, { cursor: page.continueCursor })
    }
  },
})
```

The age check matters: a file uploaded seconds ago may be waiting for its recording mutation, and sweeping it immediately breaks a legitimate upload. Batch and self-schedule so a large store does not exceed the mutation's limits. This deletes data, so keep it internal and confirm the reference query is right before running it against production.

## Verify

1. Upload a file and confirm the storage id is recorded on the document.
2. Upload an oversized file and one with a disallowed type, and confirm both are rejected **and** the bytes deleted.
3. Fetch the URL as the owner and confirm it works, then as another user and confirm the query refuses before returning a URL.
4. Replace a file and confirm the previous one is gone rather than orphaned.
5. Delete the document and confirm the file is gone too.
6. Run the orphan sweep and confirm it removes only genuinely unreferenced, aged files — check the count before deleting.

## Report

State where storage ids are recorded and with what type, what authorizes the upload URL, which size and content type limits are enforced in the mutation, how files are served and whether authorization happens per request or once when the URL is issued, how deletion keeps the row and the bytes in step, whether an orphan sweep exists and its age threshold, and the verification results including the oversized, wrong-user, and deletion checks. Never include a storage URL in the report.
