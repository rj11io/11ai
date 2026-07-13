#!/usr/bin/env bash
# scan_ports.sh — list every TCP port the current user is listening on,
# grouped by process, with signals that help spot abandoned dev servers.
#
# Output: tab-separated, one line per process:
#   PORTS   PID   AGE   CPU%   MEM   FLAGS   COMMAND
#
# MEM is the process's resident memory (RAM actually held right now) — the
# reclaim metric for a process: killing it frees this much. A TOTALS footer
# sums it so reports can quote exact numbers.
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

rows="$(while IFS="$(printf '\t')" read -r pid ports; do
  [ -z "$pid" ] && continue
  info="$(ps -o ppid=,etime=,pcpu=,rss= -p "$pid" 2>/dev/null || true)"
  [ -z "$info" ] && continue  # process exited between lsof and now
  ppid="$(echo "$info" | awk '{print $1}')"
  etime="$(echo "$info" | awk '{print $2}')"
  pcpu="$(echo "$info" | awk '{print $3}')"
  rss_kb="$(echo "$info" | awk '{print $4}')"
  mem="$(awk -v kb="${rss_kb:-0}" 'BEGIN { printf (kb >= 1048576) ? "%.1fG" : "%.0fM", (kb >= 1048576) ? kb/1048576 : kb/1024 }')"
  cmd="$(ps -o command= -p "$pid" 2>/dev/null | cut -c1-140)"

  flags=""
  [ "$ppid" = "1" ] && flags="orphan"
  if printf '%s' "$cmd" | grep -Eiq "$DEV_RE"; then
    flags="${flags:+$flags,}dev"
  fi
  if printf '%s' "$cmd" | grep -Eiq "$DB_RE"; then
    flags="${flags:+$flags,}db"
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "${rss_kb:-0}" "$ports" "$pid" "$etime" "$pcpu" "$mem" "${flags:--}" "$cmd"
done <<EOF
$pid_ports
EOF
)"

printf 'PORTS\tPID\tAGE\tCPU%%\tMEM\tFLAGS\tCOMMAND\n'
echo "$rows" | cut -f2-
echo ""
echo "$rows" | awk -F'\t' '
  function human(kb) { return (kb >= 1048576) ? sprintf("%.1fG", kb/1048576) : sprintf("%.0fM", kb/1024) }
  { n++; ports += split($2, a, ","); mem += $1
    if ($7 ~ /dev|orphan/) { nc++; memc += $1; portsc += split($2, a, ",") } }
  END {
    printf "TOTALS: %d listening processes on %d ports, holding %s of RAM\n", n, ports, human(mem)
    if (nc) printf "  flagged dev/orphan (likely reclaimable): %d processes, %d ports, %s of RAM\n", nc, portsc, human(memc)
  }'
