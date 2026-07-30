---
name: 11ai-operator-bash-cheatsheet
description: "Answer quick Bash questions with a compact reference for strict mode, quoting, parameter expansion and defaults, test operators, conditionals and loops, arrays, functions, redirection, process substitution, exit status, and the common text and file commands. Use when someone asks for Bash syntax, how an expansion or test operator is written, or wants a fast lookup rather than a guided workflow."
---
# 11ai Bash cheatsheet

A lookup surface for Bash. Give the syntax, name the trap next to it, and stop. For writing a script, processing text, or diagnosing a failure, hand off to the matching operation skill.

## Script header

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
```

`-e` exits on error, `-u` on an unset variable, `-o pipefail` on any failing command in a pipe, `-E` makes an `ERR` trap inherit into functions. Without `pipefail`, `false | true` succeeds.

## Quoting

```bash
"$var"          # expands, keeps spaces and newlines as one word
'$var'          # literal, no expansion
"${array[@]}"   # each element as its own word
"$@"            # each argument as its own word
$(command)      # command substitution
"$(command)"    # ...quoted, which is almost always what you want
```

Quote every expansion. An unquoted `$var` is split on whitespace and glob-expanded, which is the single largest source of Bash bugs.

## Parameter expansion

```bash
${var:-default}      # default if unset or empty
${var:=default}      # assign the default too
${var:?message}      # exit with message if unset or empty
${var:+alt}          # alt only if var is set and non-empty
${#var}              # length
${var#prefix}        # strip shortest leading match
${var##*/}           # basename
${var%suffix}        # strip shortest trailing match
${var%/*}            # dirname
${var/old/new}       # replace first
${var//old/new}      # replace all
${var^^}             # uppercase
${var,,}             # lowercase
${var:2:5}           # substring from offset 2, length 5
```

`${var:?message}` is the concise way to require an argument.

## Tests and conditionals

```bash
[[ -f FILE ]]        # regular file exists
[[ -d DIR ]]         # directory exists
[[ -s FILE ]]        # exists and is non-empty
[[ -r FILE ]]        # readable
[[ -z "$var" ]]      # empty
[[ -n "$var" ]]      # non-empty
[[ "$a" == "$b" ]]   # string equal
[[ "$a" == pre* ]]   # pattern match
[[ "$a" =~ ^[0-9]+$ ]]  # regex match
(( n > 5 ))          # arithmetic
[[ -v var ]]         # variable is set
```

Use `[[ ]]` over `[ ]`: it does not word-split, and it supports patterns and regex. Use `(( ))` for numbers.

```bash
if [[ -f "$file" ]]; then
  :
elif (( count > 0 )); then
  :
else
  :
fi

case "$1" in
  start|up) start ;;
  stop)     stop ;;
  *)        echo "unknown: $1" >&2; exit 2 ;;
esac
```

## Loops

```bash
for f in *.txt; do echo "$f"; done
for i in {1..10}; do echo "$i"; done
for (( i = 0; i < 10; i++ )); do echo "$i"; done
while IFS= read -r line; do echo "$line"; done < FILE
while IFS= read -r -d '' file; do echo "$file"; done < <(find . -name '*.log' -print0)
until COMMAND; do sleep 1; done
```

`IFS= read -r` preserves leading whitespace and backslashes. Never loop over `$(ls)`; use a glob or `find -print0`.

## Arrays

```bash
arr=(one two three)
arr+=(four)
echo "${arr[0]}"
echo "${arr[@]}"
echo "${#arr[@]}"
mapfile -t lines < FILE

declare -A map
map[key]=value
echo "${map[key]}"
for k in "${!map[@]}"; do echo "$k=${map[$k]}"; done
```

Associative arrays need `declare -A` and Bash 4 or later — macOS ships Bash 3.2 as `/bin/bash`.

## Functions and arguments

```bash
usage() {
  cat >&2 <<'USAGE'
usage: script [-v] TARGET
USAGE
  exit 2
}

main() {
  local verbose=0
  while getopts ':v' opt; do
    case "$opt" in
      v) verbose=1 ;;
      *) usage ;;
    esac
  done
  shift $((OPTIND - 1))
  local target="${1:?target required}"
}

main "$@"
```

Declare variables `local` inside functions; everything is global otherwise.

## Redirection and exit status

```bash
command > out.txt          # stdout, truncate
command >> out.txt         # stdout, append
command 2> err.txt         # stderr
command > all.txt 2>&1     # both to one file
command &> all.txt         # same, Bash shorthand
command < in.txt           # stdin from file
command | other            # pipe
command <<< "string"       # here-string
diff <(cmd1) <(cmd2)       # process substitution
command > /dev/null 2>&1   # discard both
echo "message" >&2         # write to stderr
```

```bash
command; echo "$?"                 # exit status of last command
"${PIPESTATUS[@]}"                 # status of each command in the last pipe
command || echo "failed" >&2
command && echo "ok"
trap 'echo "failed at line $LINENO" >&2' ERR
trap 'rm -rf "$tmpdir"' EXIT
```

Exit status `0` is success. `126` means not executable, `127` not found, `130` interrupted, and `128 + N` means killed by signal `N`.

## Common commands

```bash
grep -rn 'pattern' DIR          # recursive, with line numbers
grep -c 'pattern' FILE          # count matches, prints no content
sed -n '5,10p' FILE             # print a line range
awk -F: '{print $1}' FILE       # field one, colon-separated
sort -u FILE | head -20
cut -d, -f2 FILE
tr -d '\r' < FILE
wc -l FILE
find . -name '*.log' -mtime +7 -print
xargs -0 -n1 -P4 COMMAND
jq -r '.items[].name' FILE
mktemp -d
```

## Answer format

Lead with the syntax. Add one line on the trap that bites — unquoted expansion, missing `pipefail`, `[ ]` instead of `[[ ]]`, a loop over `ls`. Name the operation skill when the task goes beyond a lookup: writing a script to `11ai-operator-bash-scripting`, text work to `11ai-operator-bash-text-processing`, file operations to `11ai-operator-bash-files`, process control to `11ai-operator-bash-processes`, and a failing script to `11ai-operator-bash-troubleshooting`.
