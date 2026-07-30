---
name: 11ai-operator-ssh-file-transfer
description: "Copy and synchronize files over SSH with scp, rsync, and sftp, covering direction, trailing-slash semantics, dry runs, deletion policy, permissions and ownership, excludes, resumable transfers, bandwidth limits, and verification by checksum or size. Use when files must move between a local machine and a remote host, when a directory must be synchronized, or when a previous transfer produced the wrong layout or deleted something."
---
# 11ai SSH file transfer

Resolve four things before running anything: the source, the destination, the direction, and whether the destination may be modified or deleted. A transfer that runs the wrong way or with `--delete` against the wrong path destroys data, and there is no undo.

## Inspect both ends first

```bash
ssh -G HOST | grep -E '^(hostname|user|port) '
ls -la LOCAL_PATH
ssh HOST 'ls -la REMOTE_PATH; df -h REMOTE_PATH'
du -sh LOCAL_PATH
```

Check what is already at the destination and whether there is room for the transfer. An overwrite of an existing directory and a copy into it look nearly identical in the command and produce very different results.

## Preview with a dry run

```bash
rsync -avhn --itemize-changes LOCAL_DIR/ USER@HOST:REMOTE_DIR/
rsync -avhn --itemize-changes --delete LOCAL_DIR/ USER@HOST:REMOTE_DIR/
```

Always dry-run a synchronization before executing it, and read the itemized output rather than skimming the summary. Lines beginning `*deleting` are the ones that matter.

The trailing slash is the highest-risk character in this skill:

- `rsync SRC/ DEST/` copies the **contents** of `SRC` into `DEST`.
- `rsync SRC DEST/` copies the **directory** `SRC` inside `DEST`, producing `DEST/SRC`.

Getting this wrong with `--delete` removes everything already in the destination. Write both paths out, decide which form is intended, and confirm it in the dry run.

## Transfer

```bash
scp LOCAL_FILE USER@HOST:REMOTE_PATH
scp USER@HOST:REMOTE_FILE ./LOCAL_DIR/
scp -P 2222 -r LOCAL_DIR USER@HOST:REMOTE_PATH
```

```bash
rsync -avh --progress LOCAL_DIR/ USER@HOST:REMOTE_DIR/
rsync -avh --partial --append-verify --progress USER@HOST:REMOTE_FILE ./LOCAL_DIR/
rsync -avh --exclude='.git/' --exclude='node_modules/' --exclude='.env' LOCAL_DIR/ USER@HOST:REMOTE_DIR/
rsync -avh -e 'ssh -J bastion.example.com' LOCAL_DIR/ USER@HOST:REMOTE_DIR/
```

Prefer `rsync` over `scp` for anything but a single small file: it resumes, it reports what changed, and it has a dry run. Reach for `sftp` only for interactive browsing.

Points that change the outcome:

- `-a` preserves times, permissions, symlinks, and group. It does **not** preserve owner unless run as root, so files can arrive owned by the connecting user.
- Excludes are not optional for a source tree. `.git`, `node_modules`, build output, and above all `.env` should never be pushed to a server by accident.
- `--partial --append-verify` resumes a large interrupted transfer instead of restarting it.
- `--bwlimit=10M` keeps a large transfer from saturating a shared link.
- `--chown=user:group` sets ownership explicitly when the remote user differs, and needs privilege on the far side.
- Never invent a permission, ownership, or umask value. Match what is already at the destination.

## Deletion is a separate decision

`--delete` makes the destination match the source, which means removing files the source does not have. Treat it as destructive:

1. Dry-run with `--delete` and read every `*deleting` line.
2. Show that list to the user and get approval for that exact path pair.
3. Consider `--delete-after` so deletions happen only once the transfer succeeded.
4. Never combine `--delete` with a source path you have not just listed.

`rsync --delete` with an empty or mistyped source empties the destination. Confirm the source exists and is non-empty in the same breath as running it.

## Verify and report

```bash
ssh HOST 'ls -la REMOTE_PATH; du -sh REMOTE_PATH'
shasum -a 256 LOCAL_FILE
ssh HOST 'shasum -a 256 REMOTE_FILE'
rsync -avhn --itemize-changes LOCAL_DIR/ USER@HOST:REMOTE_DIR/
```

A second dry run that reports no changes is the cleanest proof a synchronization completed. For a single important file, compare checksums rather than sizes.

Report the exact source and destination including the trailing-slash form, the direction, the flags used, the file count and bytes transferred, anything deleted, the resulting permissions and ownership, and the verification evidence. Call out explicitly if ownership changed or if any excluded path would otherwise have been copied. Hand connection failures to `11ai-operator-ssh-troubleshooting`.
