---
name: 11ai-bash-files
description: "Find, inspect, copy, move, archive, and delete files from the shell with previewed and scoped commands, covering find predicates, safe deletion, permissions and ownership, symlinks, disk usage, atomic writes, and handling filenames with spaces or leading dashes. Use when files must be located or reorganized, when disk space must be traced, when permissions are wrong, or before running any command that removes or overwrites files."
---
# 11ai bash files

Deletion and overwriting have no undo at the shell. Every command here is run in two steps: list what would be affected, show that list, then act on it. A path built from a variable is the specific hazard — an empty or mistyped variable turns a scoped command into a destructive one.

## Find and inspect first

```bash
ls -la PATH
du -sh PATH
du -h --max-depth=1 PATH 2>/dev/null | sort -h | tail -20
df -h PATH
stat PATH
file PATH
```

```bash
find PATH -name '*.log' -type f
find PATH -type f -mtime +30 -size +10M
find PATH -type f -newermt '2026-07-01'
find PATH -type d -name node_modules -prune -print
find PATH -type l ! -exec test -e {} \; -print
```

`find` with no action prints, which makes it the preview step for anything destructive. Read the list before adding `-delete`.

Order matters in `find`: `-prune` must come before `-print` to skip a directory rather than merely omit it from output, and predicates are evaluated left to right.

The last command lists broken symlinks. `du` follows the directory tree but not symlinks by default, so a large apparent size may be hard links or sparse files — `du --apparent-size` distinguishes them.

## Handle awkward filenames

```bash
while IFS= read -r -d '' file; do
  echo "$file"
done < <(find PATH -type f -print0)
```

```bash
find PATH -name '*.log' -print0 | xargs -0 -n1 -P4 gzip
```

```bash
rm -- "$file"
cp -- "$src" "$dst"
```

Three rules that prevent the whole class of filename bugs: pair `-print0` with `read -d ''` or `xargs -0`; quote every expansion; and use `--` before path arguments so a filename beginning with a dash is not read as an option. A file called `-rf` is a real hazard without `--`.

Never loop over `$(ls)` or `$(find ...)` unquoted. Both split on whitespace and a single filename with a space breaks the loop in a way that can delete the wrong thing.

## Copy, move, and write atomically

```bash
cp -av -- SRC DST
cp -a --no-clobber -- SRC DST
mv -iv -- SRC DST
rsync -avhn --itemize-changes SRC/ DST/
install -m 644 -- SRC DST
```

`cp -a` preserves times, permissions, and symlinks. `--no-clobber` refuses to overwrite; `-i` prompts, which is useless in a script and useful interactively. Prefer `rsync --dry-run` when the destination already has content, since it shows exactly what changes.

For a trailing slash on `rsync`: `SRC/` copies the contents, `SRC` copies the directory itself into the destination. Getting this wrong nests a directory one level deeper than intended.

Write files atomically so a reader never sees a half-written file and a failure leaves the original intact:

```bash
tmp="$(mktemp -- "${target}.XXXXXX")"
generate_content > "$tmp" && mv -- "$tmp" "$target"
```

Never redirect a command's output into a file it is reading. `sort FILE > FILE` truncates before reading and the contents are lost.

## Delete deliberately

```bash
find PATH -name '*.tmp' -type f -mtime +7 -print
find PATH -name '*.tmp' -type f -mtime +7 | wc -l
find PATH -name '*.tmp' -type f -mtime +7 -delete
```

The sequence is list, count, show, approve, delete. Never skip to the last line.

When a path comes from a variable, guard it before use:

```bash
[[ -n "${target:-}" && -d "$target" ]] || { echo "refusing: bad target '${target:-}'" >&2; exit 1; }
rm -rf -- "$target"
```

`rm -rf "$target"` with an unset `target` expands to `rm -rf` alone — harmless — but `rm -rf "$target/"` expands to `rm -rf /`. Running under `set -u` catches the unset case; the explicit guard catches the empty-string case that `-u` does not.

Never use `rm -rf` with a glob and a variable in the same path. Never delete based on a pattern you have not just listed. Do not delete a file because it looks unused — check with `lsof` whether a process holds it, and check modification time.

## Permissions and ownership

```bash
stat -f '%Sp %Su %Sg %N' PATH 2>/dev/null || stat -c '%A %U %G %n' PATH
find PATH -type f ! -perm 644 -print
find PATH -type d ! -perm 755 -print
chmod 644 -- FILE
chmod 755 -- DIR
find PATH -type d -exec chmod 755 {} +
find PATH -type f -exec chmod 644 {} +
```

Never `chmod -R 777`. It makes every file writable and executable by everyone, and it is almost never the actual fix — the real cause is usually ownership or a missing directory execute bit. Directories need `x` to be traversed, files usually should not have it.

Do not `chown` recursively without checking what currently owns the tree; the previous owner is often a service account that needs it. Match the permissions already in use nearby rather than inventing values.

## Verify and report

```bash
ls -la DST
find DST -type f | wc -l
du -sh SRC DST
shasum -a 256 -- SRC DST
diff -r SRC DST | head -20
```

Compare counts and sizes on both sides after a copy, and checksums for a single important file.

Report the exact paths, the preview list and its count, the command run, what was created, changed, or removed, the resulting permissions and ownership, and the verification evidence. Say plainly when anything was deleted and whether it is recoverable. Never print the contents of files that may hold credentials.
