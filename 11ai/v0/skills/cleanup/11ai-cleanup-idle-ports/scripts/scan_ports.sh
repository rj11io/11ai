#!/usr/bin/env bash
# scan_ports.sh — list every TCP port the current user is listening on,
# grouped by process, with signals that help spot abandoned dev servers.
#
# Output: tab-separated, one line per process, sorted by lowest port:
#   PORTS   PID   AGE   CPU%   FLAGS   COMMAND
#
# FLAGS (comma-joined, "-" if none):
#   orphan  parent process is gone (PPID 1) — often a leftover from a dead agent session
#   dev     command looks like a dev server / tool an agent would spawn
#   db      looks like a database — killing these can lose data, treat with care
#
# Works with the stock macOS bash 3.2 (no associative arrays) and on Linux.
set -euo pipefail

DEV_RE='node|vite|next|npm|pnpm|yarn|bun|deno|python|uvicorn|gunicorn|flask|fastapi|rails|puma|php|webpack|turbopack|storybook|astro|nuxt|remix|esbuild|parcel|http\.server|live-server|serve|ng serve|expo|metro|streamlit|jupyter'
DB_RE='postgres|mysqld|mariadb|redis-server|mongod|clickhouse|elasticsearch|memcached'

# One line per PID with its ports comma-joined, grouping done in awk
# (portable to bash 3.2, which lacks associative arrays).
pid_ports="$(lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | awk '
  NR > 1 {
    n = split($9, a, ":"); pid = $2; port = a[n]
    if (!seen[pid "-" port]++) ports[pid] = (pid in ports) ? ports[pid] "," port : port
  }
  END { for (p in ports) print p "\t" ports[p] }
')"

if [ -z "$pid_ports" ]; then
  echo "No listening TCP ports found for user $(whoami)."
  exit 0
fi

printf 'PORTS\tPID\tAGE\tCPU%%\tFLAGS\tCOMMAND\n'
while IFS="$(printf '\t')" read -r pid ports; do
  [ -z "$pid" ] && continue
  info="$(ps -o ppid=,etime=,pcpu= -p "$pid" 2>/dev/null || true)"
  [ -z "$info" ] && continue  # process exited between lsof and now
  ppid="$(echo "$info" | awk '{print $1}')"
  etime="$(echo "$info" | awk '{print $2}')"
  pcpu="$(echo "$info" | awk '{print $3}')"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null | cut -c1-140)"

  flags=""
  [ "$ppid" = "1" ] && flags="orphan"
  if printf '%s' "$cmd" | grep -Eiq "$DEV_RE"; then
    flags="${flags:+$flags,}dev"
  fi
  if printf '%s' "$cmd" | grep -Eiq "$DB_RE"; then
    flags="${flags:+$flags,}db"
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$ports" "$pid" "$etime" "$pcpu" "${flags:--}" "$cmd"
done <<EOF
$pid_ports
EOF
