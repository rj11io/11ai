---
name: 11ai-aws-s3
description: "Operate AWS S3 buckets and objects with explicit paths, region checks, dry runs, and post-change verification. Use when listing, inspecting, copying, syncing, uploading, downloading, or troubleshooting S3 data and bucket access."
---

# AWS S3

Resolve the bucket, key or local path, region, profile, and direction of data flow before running a command. Treat S3 data movement and bucket policy changes as externally visible operations.

## Inspect first

```bash
aws s3 ls --profile PROFILE
aws s3api head-bucket --bucket BUCKET --profile PROFILE --region REGION
aws s3api get-bucket-location --bucket BUCKET --profile PROFILE --region REGION
aws s3 ls s3://BUCKET/PREFIX/ --recursive --human-readable --summarize --profile PROFILE
aws s3api head-object --bucket BUCKET --key KEY --profile PROFILE --region REGION
aws s3api get-public-access-block --bucket BUCKET --profile PROFILE --region REGION
aws s3api get-bucket-policy-status --bucket BUCKET --profile PROFILE --region REGION
```

Use `s3api` for precise metadata and `s3` for human-friendly transfers. Never infer that a bucket is empty from a truncated listing; use pagination-aware commands and summarize the scope.

## Transfer data

Make direction, overwrite behavior, exclusions, and destination explicit:

```bash
aws s3 cp LOCAL_FILE s3://BUCKET/KEY --profile PROFILE --region REGION
aws s3 cp s3://BUCKET/KEY LOCAL_FILE --profile PROFILE --region REGION
aws s3 sync LOCAL_DIR s3://BUCKET/PREFIX/ --dryrun --profile PROFILE --region REGION
aws s3 sync s3://BUCKET/PREFIX/ LOCAL_DIR --dryrun --profile PROFILE --region REGION
```

For `sync`, review the dry-run output before removing or overwriting anything. Use `--exclude` and `--include` deliberately, and do not invent cache-control, ACL, encryption, storage-class, or content-type values. Prefer bucket-default encryption and existing project conventions.

## Mutations and verification

- `cp`, `mv`, `sync`, `put-bucket-*`, policy edits, public access changes, lifecycle changes, versioning changes, and `rm` all change state or data visibility.
- Never use `aws s3 rb s3://BUCKET --force` casually; it can remove objects before deleting a bucket.
- Do not make objects public with `--acl public-read`; use the project’s approved access path.
- After an approved transfer, verify with `head-object`, a scoped listing, checksum or size, and the intended consumer path.
- After an access change, re-check the effective public-access status and policy without exposing policy secrets or unrelated account data.

Report the exact source, destination, profile, region, files or keys affected, and verification result.
