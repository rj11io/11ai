---
name: 11ai-operator-nodejs-api-v24-uploads
description: "Accept file uploads safely in a Node.js API, covering size limits enforced by the server, content type verified from the bytes rather than the client's claim, filename sanitizing and path traversal, storing outside the application and never executing uploads, presigned direct-to-storage uploads for large files, virus scanning, per-user quotas, and cleaning up orphaned objects. Use when an endpoint must accept a file, when an upload exhausts memory or disk, or when upload handling must be reviewed for safety."
---
# 11ai Node.js API uploads

Version baseline: Node.js 24.x Krypton LTS, using the latest security patch in that release line (24.18.0 at this review). Do not silently move an existing application between Node release lines; inspect engines, runtime files, CI, and deployment support first.

An upload endpoint accepts attacker-controlled bytes with an attacker-controlled name and an attacker-controlled type claim. Treat all three as hostile: enforce the size limit at the server, determine the type from the content, and never trust the filename for a path.

## Inspect what exists

```bash
grep -rn 'multer\|busboy\|formidable\|@fastify/multipart' package.json 2>/dev/null
grep -rn 'multipart\|upload' --include='*.ts' src/routes/ 2>/dev/null | head
grep -rn 'limits\|fileSize' --include='*.ts' src/ 2>/dev/null | head
ls -la uploads/ public/uploads/ 2>/dev/null
```

An `uploads/` directory inside the application's served static path is the finding to fix first: anything uploaded there is reachable by URL, and on a misconfigured server an uploaded script can execute. Uploads belong outside the application root, ideally in object storage.

Establish the largest legitimate file and the expected types before setting limits.

## Enforce limits at the server

```ts
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 12,
    headerPairs: 100,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    cb(null, allowed.includes(file.mimetype))
  },
})
```

Every limit matters. `fileSize` bounds one file, `files` bounds the count, and `fields` and `parts` bound the rest of the multipart body — without those, a request with a hundred thousand tiny fields exhausts memory while every file limit is respected.

Client-side validation is a courtesy; the server limit is the control, because an attacker posts directly.

Handle the limit error explicitly, or it surfaces as a 500:

```ts
app.post("/api/avatar", upload.single("file"), handler)

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400
    return res.status(status).json({ error: { code: error.code.toLowerCase() } })
  }
  next(error)
})
```

Use memory storage only for small files. Anything larger should stream to disk or straight to object storage — buffering a 200 MB upload in memory multiplied by concurrent requests is how the process gets killed.

## Verify the type from the bytes

```bash
npm install file-type
```

```ts
import { fileTypeFromBuffer } from "file-type"

const detected = await fileTypeFromBuffer(file.buffer)
if (!detected || !["png", "jpg", "webp"].includes(detected.ext)) {
  throw new HttpError(415, "unsupported_file_type")
}
```

The `Content-Type` header and the file extension are both supplied by the client. A `.png` extension on a PHP script passes an extension check and a MIME check; reading the magic bytes does not.

Store the **detected** type and derive the extension from it, never from the submitted name. For an image, re-encoding through an image library is stronger still: it strips metadata and fails on anything that is not really an image.

## Never trust the filename

```ts
import { randomUUID } from "node:crypto"
import path from "node:path"

const ext = `.${detected.ext}`
const storedName = `${randomUUID()}${ext}`
const key = `avatars/${userId}/${storedName}`
```

Generate the stored name. A client-supplied name can contain `../` to escape the directory, a null byte to truncate a check, a name that collides with an existing file, or a name long enough to break the filesystem.

Keep the original name only as a display label, and only after stripping directory components with `path.basename` and escaping it wherever it is rendered — an uploaded name is a cross-site scripting vector when echoed into a page.

Put the owning id in the key prefix so ownership is expressible in a storage policy and files are attributable.

## Prefer direct-to-storage for large files

```ts
const command = new PutObjectCommand({ Bucket: config.BUCKET, Key: key, ContentType: detected.mime })
const url = await getSignedUrl(s3, command, { expiresIn: 300 })
```

For anything sizeable, have the client upload straight to storage with a short-lived presigned URL and then call the API to record it. The bytes never pass through the API, which removes the memory and timeout problem entirely.

Two things to get right: sign only a key the server constructed — signing a client-supplied key is a write-anywhere primitive — and validate the recorded object's real size and type server-side afterwards, because the presigned upload bypassed your handler.

## Scan, quota, and clean up

Scan uploads that other users will download, out of band after the upload, and keep the file unavailable until it passes. An API serving user files to other users without scanning is a malware distribution path.

Enforce a per-user quota before accepting, not after — count existing objects and reject with 413 when the next upload would exceed it. Without a quota, one account can fill the storage bill.

Serve private files through a signed URL with a short expiry or through an authorized endpoint, never from a public bucket. Set `Content-Disposition: attachment` and a strict `Content-Type` on download so a stored HTML file cannot execute in your origin.

An upload that is never recorded leaves an orphan. Sweep objects with no referencing row after an age threshold, and delete the object and the row together when a user removes a file.

## Verify

```bash
curl -i -F 'file=@small.png' http://localhost:3000/api/avatar
head -c 6000000 /dev/urandom > big.bin && curl -i -F 'file=@big.bin' http://localhost:3000/api/avatar
cp script.sh fake.png && curl -i -F 'file=@fake.png;type=image/png' http://localhost:3000/api/avatar
curl -i -F 'file=@small.png;filename=../../etc/passwd' http://localhost:3000/api/avatar
```

Expect: the first succeeds; the oversized file returns 413 without buffering it all; the disguised script returns 415 despite a valid extension and declared type; and the traversal filename is stored under a generated name inside the intended prefix. Then confirm an upload from one user is not readable by another, and that a rejected upload left no object behind.

## Report

State the endpoint, the size, count, and field limits with the error statuses they produce, how the content type is determined from the bytes, how the stored name and key are generated and where the original name is used, where files are stored relative to anything served publicly, whether large uploads go direct to storage and how the key is constrained, the scanning and quota behaviour, how files are served and to whom, the orphan cleanup, and the verification including the oversized, disguised-script, traversal, and cross-user checks.
