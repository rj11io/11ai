---
name: 11ai-operator-bash-text-processing
description: "Filter, extract, and transform text at the shell with grep, sed, awk, cut, sort, uniq, tr, jq, and xargs, covering pattern choice, field handling, in-place editing, delimiter and locale pitfalls, streaming large files, and building pipelines that fail loudly. Use when text or log output must be searched, reshaped, counted, or converted, or when an existing pipeline returns the wrong fields or silently produces nothing."
---
# 11ai bash text processing

Every pipeline here reads data and most write something. Establish the input's real shape first — delimiter, quoting, encoding, line endings — because a wrong assumption produces plausible output rather than an error, which is worse than a crash.

## Inspect the input first

```bash
wc -l FILE
head -5 FILE
file FILE
head -1 FILE | cat -A | head -1
awk -F, 'NR==1 {print NF " fields"}' FILE
```

`cat -A` reveals the invisible characters that break pipelines: `^M$` at line ends means Windows line endings, and a trailing `$` after whitespace means padded fields. `file` catches an unexpected encoding.

Check whether the format is genuinely delimited. A CSV with quoted fields containing commas cannot be parsed with `cut -d,` or a naive `awk -F,`; use a real CSV tool or `jq` on converted data. Treating quoted CSV as plain delimited text is the most common silent corruption in this area.

## Search and filter

```bash
grep -n 'pattern' FILE
grep -rn --include='*.ts' 'pattern' src/
grep -c 'pattern' FILE
grep -F 'literal.string' FILE
grep -E '^(GET|POST) /api/' FILE
grep -v 'exclude' FILE
grep -A2 -B2 'pattern' FILE
grep -l 'pattern' -r src/
```

Choose the pattern type deliberately: `-F` for a literal string, `-E` for extended regular expressions, `-P` for Perl syntax where available. A dot or a plus in an unescaped basic pattern matches more than intended.

Use `grep -c` when the answer is a count and the lines may contain secrets — it prints numbers, not content. Use `grep -l` to list files rather than dumping every match.

## Extract fields

```bash
cut -d, -f2,4 FILE
cut -d: -f1 /etc/passwd
awk '{print $1, $NF}' FILE
awk -F'\t' '{print $2}' FILE
awk -F, 'NR > 1 && $3 > 100 {sum += $3; n++} END {printf "%d rows, mean %.2f\n", n, sum/n}' FILE
awk 'NR==1 {for (i=1; i<=NF; i++) col[$i]=i} NR>1 {print $col["email"]}' FILE
```

`cut` splits on a single character and cannot handle repeated separators. `awk` with no `-F` splits on runs of whitespace, which is what you want for command output and wrong for a tab-delimited file with empty fields — there, `-F'\t'` is required or empty columns shift every field after them.

The last example above reads the header row to find a column by name, which survives a column being reordered upstream.

## Transform

```bash
sed -n '5,10p' FILE
sed 's/old/new/' FILE
sed 's/old/new/g' FILE
sed -E 's/([0-9]{4})-([0-9]{2})/\2\/\1/' FILE
sed '/^$/d' FILE
tr -d '\r' < FILE
tr '[:upper:]' '[:lower:]' < FILE
sort -u FILE
sort -t, -k3,3nr FILE
uniq -c
paste -d, FILE1 FILE2
jq -r '.items[] | [.id, .name] | @csv' FILE
```

Two traps that matter:

- `sed 's/x/y/'` replaces the **first** match per line. Add `g` for all of them.
- The replacement text is not literal. `&`, `\1`, and the delimiter itself have meaning, so a URL in a replacement needs a different delimiter: `sed 's|old/path|new/path|'`.

In-place editing is where portability bites, because the flag differs between platforms:

```bash
sed --version >/dev/null 2>&1 && sed -i 's/old/new/g' FILE || sed -i '' 's/old/new/g' FILE
```

GNU `sed` takes `-i` alone; BSD and macOS `sed` require an argument, so `-i ''`. A script using the wrong form either fails or creates a backup file named after the expression.

Prefer writing to a new file and moving it, which is safer and portable:

```bash
sed 's/old/new/g' FILE > FILE.tmp && mv -- FILE.tmp FILE
```

Never redirect a command's output into its own input file. `sort FILE > FILE` truncates the file before `sort` reads it, and the data is gone.

Sorting depends on locale. Set it explicitly when the result must be reproducible or when byte order matters:

```bash
LC_ALL=C sort FILE
```

## Build pipelines that fail loudly

```bash
set -Eeuo pipefail
count="$(grep -c 'pattern' FILE || true)"
echo "${PIPESTATUS[@]}"
```

Without `pipefail`, a pipeline reports the last command's status, so `curl ... | jq ...` succeeds even when the download failed. With `-e` and `pipefail`, remember that `grep` exits `1` when it finds nothing — which is information, not an error — so a deliberate `|| true` belongs there.

For large files, stream rather than load:

```bash
awk 'condition' HUGE_FILE | head -100
grep -m 10 'pattern' HUGE_FILE
LC_ALL=C sort -S 1G -T /var/tmp HUGE_FILE
```

`grep -m` stops after N matches. `sort` on a large file needs temporary space; point `-T` somewhere with room.

```bash
find . -name '*.log' -print0 | xargs -0 -n1 -P4 gzip
```

Always pair `find -print0` with `xargs -0`, or a filename with a space becomes two arguments.

## Verify and report

Test on a sample before the full file, and count both sides:

```bash
head -100 FILE | awk -F, '{print $2}' | head
wc -l < FILE
awk -F, 'END {print NR}' FILE
diff <(sort FILE.before) <(sort FILE.after) | head -20
```

A row count that changes unexpectedly means the delimiter or quoting assumption was wrong. Compare before and after when a transformation edited a file.

Report the exact pipeline, the input assumptions it relies on, the row and field counts before and after, and where output was written. Never dump file contents that may hold credentials or personal data — report counts and redacted samples instead. For in-place edits, say whether a backup exists.
