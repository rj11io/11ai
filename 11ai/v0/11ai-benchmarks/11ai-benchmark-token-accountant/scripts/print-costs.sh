#!/usr/bin/env bash
# print-costs.sh — print every benchmark cost breakdown and judging result
# found under the current directory (or a directory passed as $1).
#
# Scans for benchmark/costs/*.json (written by 11ai-benchmark-token-accountant)
# and benchmark/results.json (written by 11ai-benchmark-judge), groups them by
# benchmark repo, and prints readable tables. Read-only; needs bash + python3.
set -euo pipefail

ROOT="${1:-.}"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT

find "$ROOT" \
  \( -name node_modules -o -name .git -o -name .next \) -prune -o \
  -type f \( -path "*/benchmark/costs/*.json" -o -path "*/benchmark/results.json" \) -print \
  | sort > "$LIST"

FILE_LIST="$LIST" python3 <<'PY'
import json, os, sys
from collections import defaultdict

paths = [p.strip() for p in open(os.environ["FILE_LIST"]) if p.strip()]
if not paths:
    print("No benchmark cost or result files found under this directory.")
    print("Expected: <repo>/benchmark/costs/*.json (token accountant) "
          "or <repo>/benchmark/results.json (judge).")
    sys.exit(0)

repos = defaultdict(lambda: {"costs": [], "summary": None, "results": None})
for path in paths:
    repo = os.path.abspath(path.split("/benchmark/")[0])
    try:
        data = json.load(open(path))
    except Exception as err:
        print(f"!! unreadable {path}: {err}")
        continue
    if path.endswith("/benchmark/results.json"):
        repos[repo]["results"] = data
    elif path.endswith("summary.json"):
        repos[repo]["summary"] = data
    else:
        repos[repo]["costs"].append(data)

def usd(x): return f"${x:,.2f}"
def tok(n): return f"{n/1_000_000:.2f}M" if n >= 1_000_000 else f"{n/1000:.0f}k"
def pct(x): return f"{x*100:.0f}%"

for repo, bundle in sorted(repos.items()):
    print()
    print("=" * 78)
    print(f"BENCHMARK: {os.path.basename(repo) or repo}   ({repo})")
    print("=" * 78)

    rows = sorted(bundle["costs"], key=lambda d: -d.get("totals", {}).get("costUsd", 0))
    if rows:
        print(f"{'RUN':<30} {'KIND':<17} {'TOKENS':>7} {'CACHE':>6} {'WALL':>7} {'COST':>8}  METHOD")
        print("-" * 78)
        total = 0.0
        for d in rows:
            t = d.get("totals", {})
            total += t.get("costUsd", 0)
            wall_min = d.get("wallTimeMinutes")
            wall = f"{wall_min:>6.1f}m" if isinstance(wall_min, (int, float)) else f"{'n/a':>7}"
            label = d.get("runId") or d.get("kind") or "?"
            print(f"{label:<30} {d.get('kind', 'run'):<17} "
                  f"{tok(t.get('tokens', 0)):>7} {pct(d.get('cacheHitRate', 0)):>6} "
                  f"{wall} {usd(t.get('costUsd', 0)):>8}  {d.get('method', '?')}")
            for model, m in d.get("byModel", {}).items():
                parts = [f"in={tok(m.get('input', 0))}"]
                if m.get("cacheWrite"):  parts.append(f"cacheWrite={tok(m['cacheWrite'])}")
                if m.get("cacheRead"):   parts.append(f"cacheRead={tok(m['cacheRead'])}")
                if m.get("cachedInput"): parts.append(f"cached={tok(m['cachedInput'])}")
                parts.append(f"out={tok(m.get('output', 0))}")
                print(f"    - {model}: {' '.join(parts)} -> {usd(m.get('costUsd', 0))}")
        print("-" * 78)
        print(f"{'MEASURED TOTAL':<63} {usd(total):>8}")

    summary = bundle["summary"]
    if summary and summary.get("buckets"):
        b = summary["buckets"]
        print(f"\nBUCKETS  runs={usd(b.get('runsUsd', 0))}  "
              f"operations={usd(b.get('operationsUsd', 0))}  "
              f"benchmark={usd(b.get('benchmarkUsd', 0))}  "
              f"non-benchmark={usd(b.get('nonBenchmarkUsd', 0))}  "
              f"grand total={usd(b.get('grandTotalUsd', 0))}")
    if summary and summary.get("unmeasured", {}).get("runs"):
        un = summary["unmeasured"]
        print(f"\nUnmeasured runs ({len(un['runs'])}): {', '.join(un['runs'])}")
        print(f"  reason: {un.get('reason', '')}")

    results = bundle["results"]
    if results:
        print(f"\nJUDGING RESULTS  (judges: {results.get('judges', '?')})")
        costs_by_run = {d.get("runId"): d.get("totals", {}).get("costUsd") for d in rows}
        for r in sorted(results.get("runs", []), key=lambda r: r.get("rank", 99)):
            cost = costs_by_run.get(r.get("id"))
            per_point = f"  ({usd(cost / r['total'])}/pt)" if cost and r.get("total") else ""
            print(f"  #{r.get('rank', '?')} {r.get('id', '?'):<30} total={r.get('total', '?')}{per_point}")
    else:
        print("\nNo judging results yet (benchmark/results.json absent).")
print()
PY
