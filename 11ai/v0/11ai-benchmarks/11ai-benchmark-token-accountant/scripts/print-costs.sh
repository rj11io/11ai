#!/usr/bin/env bash
# Print canonical v2 accounting when present, with a legacy-summary fallback.
set -euo pipefail

ROOT="${1:-.}"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT

find "$ROOT" \
  \( -name node_modules -o -name .git -o -name .next \) -prune -o \
  -type f \( -path "*/benchmark/costs/accounting.json" -o -path "*/benchmark/costs/summary.json" \) -print \
  | sort > "$LIST"

FILE_LIST="$LIST" python3 <<'PY'
import json, os, sys
from collections import defaultdict

paths = [line.strip() for line in open(os.environ["FILE_LIST"]) if line.strip()]
if not paths:
    print("No benchmark accounting files found.")
    sys.exit(0)

repos = defaultdict(dict)
for path in paths:
    repo = os.path.abspath(path.split("/benchmark/")[0])
    try:
        data = json.load(open(path))
    except Exception as error:
        print(f"!! unreadable {path}: {error}")
        continue
    repos[repo]["accounting" if path.endswith("accounting.json") else "legacy"] = data

def usd(value):
    return "n/a" if value is None else f"${value:,.4f}"

def tokens(value):
    if value is None: return "n/a"
    if value >= 1_000_000: return f"{value/1_000_000:.2f}M"
    if value >= 1_000: return f"{value/1_000:.0f}k"
    return str(value)

def rollup(label, value):
    value = value or {}
    print(f"  {label:<30} threads={value.get('threadCount', 0):>4}  tokens={tokens(value.get('tokens')):>8}  cost={usd(value.get('costUsd')):>12}")

for repo, bundle in sorted(repos.items()):
    print(f"\n{'=' * 88}\nBENCHMARK: {os.path.basename(repo)}  ({repo})\n{'=' * 88}")
    accounting = bundle.get("accounting")
    if accounting:
        scopes = accounting.get("scopes", {})
        print("SCOPES")
        rollup("benchmark", scopes.get("benchmarkScope"))
        rollup("judge", scopes.get("judgeScope"))
        for label, value in sorted(scopes.get("identifiedScopes", {}).items()):
            rollup(f"identified:{label}", value)
        rollup("unidentified", scopes.get("nonIdentifiedScope"))
        rollup("benchmark + judge", scopes.get("benchmarkAndJudgeScope"))
        rollup("TOTAL (all threads)", accounting.get("total"))
        check = accounting.get("reconciliation", {})
        print(f"  reconciliation: {'PASS' if check.get('pass') else 'FAIL'}  classified={check.get('classifiedThreadCount', '?')}/{check.get('threadCount', '?')}")

        print("\nTHREADS")
        print(f"  {'THREAD':<28} {'SCOPE':<30} {'TOKENS':>8} {'COST':>12}  METHOD")
        for thread in sorted(accounting.get("threads", []), key=lambda t: (t.get("classification", ""), t.get("threadId", ""))):
            usage = thread.get("tokens", {})
            cost = thread.get("cost", {})
            total_tokens = usage.get("providerTotal")
            if total_tokens is None:
                total_tokens = sum(v for k, v in usage.items() if k in ("inputUncached", "cachedInputRead", "cacheWrite5m", "cacheWrite1h", "outputTotal") and isinstance(v, (int, float)))
            print(f"  {thread.get('threadId', '?')[:28]:<28} {thread.get('classification', '?'):<30} {tokens(total_tokens):>8} {usd(cost.get('totalUsd')):>12}  {thread.get('method', '?')}")
    else:
        legacy = bundle.get("legacy", {})
        print("LEGACY SUMMARY (run the accountant to migrate to reconciled v2 scopes)")
        for run_id, run in sorted(legacy.get("runs", {}).items()):
            print(f"  {run_id:<32} {tokens(run.get('tokens')):>8} {usd(run.get('costUsd')):>12}  {run.get('kind', '?')}")
        totals = legacy.get("totals", {})
        print(f"  {'legacy total':<32} {tokens(totals.get('tokens')):>8} {usd(totals.get('costUsd')):>12}")
print()
PY
