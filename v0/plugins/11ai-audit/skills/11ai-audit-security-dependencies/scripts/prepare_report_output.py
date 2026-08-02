#!/usr/bin/env python3
"""Create a unique, namespaced dependency-audit report directory."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


REPORTS_DIRECTORY = "11ai-audit-security-dependencies-reports"
REPORT_BASENAME_PREFIX = "11ai-audit-security-dependencies-reports-"
UTC_STAMP_RE = re.compile(r"^\d{8}T\d{6}Z$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create the output directory for a dependency security audit."
    )
    parser.add_argument("project_root", help="Established project scan root")
    parser.add_argument(
        "--datetime",
        dest="utc_stamp",
        help="UTC timestamp in YYYYMMDDTHHMMSSZ form; defaults to the current time",
    )
    return parser.parse_args()


def choose_run_directory(reports_root: Path, utc_stamp: str) -> tuple[Path, str]:
    base = f"{REPORT_BASENAME_PREFIX}{utc_stamp}"
    candidate = reports_root / base
    suffix = 1
    while candidate.exists():
        suffix += 1
        candidate = reports_root / f"{base}-{suffix}"
    candidate.mkdir()
    return candidate, candidate.name


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    if not project_root.is_dir():
        print(f"Project root is not a directory: {project_root}", file=sys.stderr)
        return 2

    utc_stamp = args.utc_stamp or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    if UTC_STAMP_RE.fullmatch(utc_stamp) is None:
        print("--datetime must use UTC format YYYYMMDDTHHMMSSZ", file=sys.stderr)
        return 2

    reports_root = project_root / REPORTS_DIRECTORY
    if reports_root.is_symlink():
        print(f"Reports root must not be a symbolic link: {reports_root}", file=sys.stderr)
        return 2
    try:
        reports_root.mkdir(exist_ok=True)
    except OSError as error:
        print(f"Unable to create reports root {reports_root}: {error}", file=sys.stderr)
        return 2
    if not reports_root.is_dir():
        print(f"Reports root is not a directory: {reports_root}", file=sys.stderr)
        return 2
    run_directory, basename = choose_run_directory(reports_root, utc_stamp)
    result = {
        "schema_version": 1,
        "generator": "11ai-audit-security-dependencies",
        "datetime_utc": utc_stamp,
        "reports_root": str(reports_root),
        "run_directory": str(run_directory),
        "artifact_prefix": str(run_directory / basename),
        "markdown_report": str(run_directory / f"{basename}.md"),
        "html_report": str(run_directory / f"{basename}.html"),
    }
    sys.stdout.write(json.dumps(result, indent=2, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
