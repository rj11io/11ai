#!/usr/bin/env python3
"""Inventory declared, locked, and installed dependencies without executing them.

The script deliberately does not install, import, build, or run project packages.
It produces evidence for a separate advisory audit rather than claiming that a
package is safe merely because no local advisory database is available.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tomllib
from collections import Counter
from pathlib import Path
from typing import Any, Iterable


PROJECT_EXCLUDED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".turbo",
    ".cache",
    ".parcel-cache",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "out",
    "target",
    "vendor",
}

MANIFEST_NAMES = {
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "pyproject.toml",
    "Pipfile.lock",
    "go.mod",
    "go.sum",
    "Cargo.toml",
    "Cargo.lock",
    "Gemfile",
    "Gemfile.lock",
}

LOCK_NAMES = {
    "package-lock.json",
    "npm-shrinkwrap.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "Pipfile.lock",
    "go.sum",
    "Cargo.lock",
    "Gemfile.lock",
}

NODE_DEPENDENCY_FIELDS = (
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
)
NODE_LIFECYCLE_KEYS = (
    "preinstall",
    "install",
    "postinstall",
    "prepare",
)


def relpath(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix() or "."


def iter_project_files(root: Path) -> Iterable[Path]:
    """Yield likely dependency files while skipping generated and vendored trees."""

    for current, dirs, files in os.walk(root, topdown=True, followlinks=False):
        dirs[:] = sorted(
            name
            for name in dirs
            if name not in PROJECT_EXCLUDED_DIRS
            and name != "node_modules"
            and not name.endswith(".egg-info")
        )
        for name in sorted(files):
            if name in MANIFEST_NAMES or name.startswith("requirements") and name.endswith(".txt"):
                yield Path(current) / name


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def collect_node_manifests(root: Path, files: list[Path]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    declared: list[dict[str, Any]] = []
    manifests: list[dict[str, Any]] = []

    for path in files:
        if path.name != "package.json":
            continue
        payload = load_json(path)
        if payload is None:
            manifests.append({"file": relpath(root, path), "parse_error": True})
            continue
        manifest = {
            "file": relpath(root, path),
            "name": payload.get("name"),
            "version": payload.get("version"),
            "package_manager": payload.get("packageManager"),
            "private": payload.get("private"),
        }
        manifests.append(manifest)
        for field in NODE_DEPENDENCY_FIELDS:
            dependencies = payload.get(field, {})
            if not isinstance(dependencies, dict):
                continue
            for name, requested in sorted(dependencies.items()):
                declared.append(
                    {
                        "ecosystem": "node",
                        "name": name,
                        "requested": str(requested),
                        "kind": field,
                        "manifest": relpath(root, path),
                    }
                )

    return declared, manifests


def requirement_name_and_spec(raw: str) -> tuple[str, str] | None:
    match = re.match(r"^\s*([A-Za-z0-9_.-]+)\s*(.*)$", raw)
    if not match:
        return None
    return match.group(1), match.group(2).strip() or "*"


def collect_other_manifests(root: Path, files: list[Path]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Collect lightweight dependency evidence for common non-Node manifests."""

    declared: list[dict[str, Any]] = []
    manifests: list[dict[str, Any]] = []

    for path in files:
        if path.name == "package.json":
            continue
        relative = relpath(root, path)
        ecosystem: str | None = None
        if path.name.startswith("requirements") and path.name.endswith(".txt"):
            ecosystem = "python"
            for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
                line = raw.split(" #", 1)[0].strip()
                if not line or line.startswith(("#", "-", "git+", "http://", "https://")):
                    continue
                item = requirement_name_and_spec(line)
                if item:
                    name, requested = item
                    declared.append(
                        {"ecosystem": ecosystem, "name": name, "requested": requested, "kind": "requirements", "manifest": relative}
                    )
        elif path.name == "pyproject.toml":
            ecosystem = "python"
            try:
                payload = tomllib.loads(path.read_text(encoding="utf-8"))
            except (OSError, tomllib.TOMLDecodeError):
                payload = {}
            project = payload.get("project", {})
            if isinstance(project, dict):
                for key, values in [("dependencies", project.get("dependencies"))]:
                    if isinstance(values, list):
                        for raw in values:
                            if isinstance(raw, str) and (item := requirement_name_and_spec(raw)):
                                name, requested = item
                                declared.append({"ecosystem": ecosystem, "name": name, "requested": requested, "kind": key, "manifest": relative})
                optional = project.get("optional-dependencies", {})
                if isinstance(optional, dict):
                    for group, values in optional.items():
                        if isinstance(values, list):
                            for raw in values:
                                if isinstance(raw, str) and (item := requirement_name_and_spec(raw)):
                                    name, requested = item
                                    declared.append({"ecosystem": ecosystem, "name": name, "requested": requested, "kind": f"optional:{group}", "manifest": relative})
            poetry = payload.get("tool", {}).get("poetry", {}) if isinstance(payload.get("tool"), dict) else {}
            poetry_deps = poetry.get("dependencies", {}) if isinstance(poetry, dict) else {}
            if isinstance(poetry_deps, dict):
                for name, requested in poetry_deps.items():
                    if name.lower() == "python":
                        continue
                    declared.append({"ecosystem": ecosystem, "name": str(name), "requested": json.dumps(requested, sort_keys=True) if isinstance(requested, (dict, list)) else str(requested), "kind": "poetry.dependencies", "manifest": relative})
        elif path.name == "Cargo.toml":
            ecosystem = "rust"
            try:
                payload = tomllib.loads(path.read_text(encoding="utf-8"))
            except (OSError, tomllib.TOMLDecodeError):
                payload = {}
            for section in ("dependencies", "dev-dependencies", "build-dependencies"):
                values = payload.get(section, {})
                if isinstance(values, dict):
                    for name, requested in values.items():
                        declared.append({"ecosystem": ecosystem, "name": str(name), "requested": json.dumps(requested, sort_keys=True) if isinstance(requested, (dict, list)) else str(requested), "kind": section, "manifest": relative})
        elif path.name == "go.mod":
            ecosystem = "go"
            in_require_block = False
            for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
                line = raw.split("//", 1)[0].strip()
                if line.startswith("require ("):
                    in_require_block = True
                    continue
                if in_require_block and line == ")":
                    in_require_block = False
                    continue
                if line.startswith("require "):
                    line = line[len("require "):].strip()
                if in_require_block or raw.strip().startswith("require "):
                    parts = line.split()
                    if len(parts) >= 2:
                        declared.append({"ecosystem": ecosystem, "name": parts[0], "requested": parts[1], "kind": "require", "manifest": relative})
        elif path.name == "Gemfile":
            ecosystem = "ruby"
            for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
                match = re.search(r"^\s*gem\s+[\"']([^\"']+)[\"'](?:\s*,\s*[\"']([^\"']+)[\"'])?", raw)
                if match:
                    declared.append({"ecosystem": ecosystem, "name": match.group(1), "requested": match.group(2) or "*", "kind": "gem", "manifest": relative})

        if ecosystem:
            manifests.append({"file": relative, "ecosystem": ecosystem})

    return declared, manifests


def lock_entry_name(package_path: str, entry: dict[str, Any]) -> str | None:
    if isinstance(entry.get("name"), str) and entry["name"]:
        return entry["name"]
    parts = [part for part in package_path.split("/") if part]
    if len(parts) >= 2 and parts[-2].startswith("@"):
        return "/".join(parts[-2:])
    return parts[-1] if parts else None


def collect_npm_lockfiles(root: Path, files: list[Path]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    locked: list[dict[str, Any]] = []
    lockfiles: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()

    for path in files:
        if path.name not in {"package-lock.json", "npm-shrinkwrap.json"}:
            continue
        payload = load_json(path)
        if payload is None:
            lockfiles.append({"file": relpath(root, path), "type": "npm", "parse_error": True})
            continue
        packages = payload.get("packages")
        package_count = 0
        install_script_count = 0
        if isinstance(packages, dict):
            for package_path, entry in sorted(packages.items()):
                if not package_path or not isinstance(entry, dict):
                    continue
                version = entry.get("version")
                name = lock_entry_name(package_path, entry)
                if not isinstance(version, str) or not name:
                    continue
                package_count += 1
                has_install_script = bool(entry.get("hasInstallScript"))
                install_script_count += int(has_install_script)
                key = (relpath(root, path), package_path, version)
                if key in seen:
                    continue
                seen.add(key)
                locked.append(
                    {
                        "ecosystem": "node",
                        "name": name,
                        "version": version,
                        "lockfile": relpath(root, path),
                        "path": package_path,
                        "dev": bool(entry.get("dev")),
                        "optional": bool(entry.get("optional")),
                        "has_install_script": has_install_script,
                        "resolved": entry.get("resolved"),
                        "integrity": entry.get("integrity"),
                    }
                )
        else:
            def visit_dependencies(dependencies: Any, prefix: str = "") -> None:
                if not isinstance(dependencies, dict):
                    return
                for name, entry in sorted(dependencies.items()):
                    if not isinstance(entry, dict) or not isinstance(entry.get("version"), str):
                        continue
                    package_path = f"{prefix}/node_modules/{name}" if prefix else f"node_modules/{name}"
                    version = entry["version"]
                    key = (relpath(root, path), package_path, version)
                    if key not in seen:
                        seen.add(key)
                        locked.append(
                            {
                                "ecosystem": "node",
                                "name": name,
                                "version": version,
                                "lockfile": relpath(root, path),
                                "path": package_path,
                                "dev": bool(entry.get("dev")),
                                "optional": bool(entry.get("optional")),
                                "has_install_script": False,
                                "resolved": entry.get("resolved"),
                                "integrity": entry.get("integrity"),
                            }
                        )
                    visit_dependencies(entry.get("dependencies"), package_path)

            visit_dependencies(payload.get("dependencies"))

        lockfiles.append(
            {
                "file": relpath(root, path),
                "type": "npm",
                "lockfile_version": payload.get("lockfileVersion"),
                "package_count": package_count,
                "install_script_count": install_script_count,
            }
        )

    return locked, lockfiles


def collect_other_lockfiles(root: Path, files: list[Path]) -> list[dict[str, Any]]:
    lockfiles: list[dict[str, Any]] = []
    for path in files:
        if path.name in LOCK_NAMES and path.name not in {"package-lock.json", "npm-shrinkwrap.json"}:
            try:
                size = path.stat().st_size
            except OSError:
                size = None
            lockfiles.append({"file": relpath(root, path), "type": path.name, "bytes": size})
    return lockfiles


def collect_other_locked_dependencies(root: Path, files: list[Path]) -> list[dict[str, Any]]:
    locked: list[dict[str, Any]] = []
    for path in files:
        relative = relpath(root, path)
        if path.name == "Cargo.lock":
            try:
                payload = tomllib.loads(path.read_text(encoding="utf-8"))
            except (OSError, tomllib.TOMLDecodeError):
                payload = {}
            packages = payload.get("package", [])
            if isinstance(packages, list):
                for package in packages:
                    if isinstance(package, dict) and isinstance(package.get("name"), str) and isinstance(package.get("version"), str):
                        locked.append({"ecosystem": "rust", "name": package["name"], "version": package["version"], "lockfile": relative, "source": package.get("source")})
        elif path.name == "go.sum":
            for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
                parts = raw.split()
                if len(parts) >= 2 and not parts[1].endswith("/go.mod"):
                    locked.append({"ecosystem": "go", "name": parts[0], "version": parts[1], "lockfile": relative, "integrity": parts[2] if len(parts) > 2 else None})
        elif path.name == "Pipfile.lock":
            payload = load_json(path) or {}
            for section in ("default", "develop"):
                values = payload.get(section, {})
                if isinstance(values, dict):
                    for name, entry in values.items():
                        version = entry.get("version") if isinstance(entry, dict) else entry
                        if isinstance(version, str):
                            locked.append({"ecosystem": "python", "name": name, "version": version, "lockfile": relative, "kind": section})
        elif path.name == "Gemfile.lock":
            in_specs = False
            for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
                if raw.strip() == "specs:":
                    in_specs = True
                    continue
                if in_specs and raw and not raw.startswith("    "):
                    in_specs = False
                if in_specs:
                    match = re.match(r"^    ([^ (]+) \(([^)]+)\)", raw)
                    if match:
                        locked.append({"ecosystem": "ruby", "name": match.group(1), "version": match.group(2), "lockfile": relative})
    return locked


def package_directories(node_modules: Path) -> Iterable[Path]:
    try:
        entries = sorted(node_modules.iterdir(), key=lambda item: item.name)
    except OSError:
        return
    for entry in entries:
        if entry.name == ".bin" or not entry.is_dir() or entry.is_symlink():
            continue
        if entry.name.startswith("@"):
            try:
                scoped = sorted(entry.iterdir(), key=lambda item: item.name)
            except OSError:
                continue
            for package in scoped:
                if package.is_dir() and not package.is_symlink():
                    yield package
        else:
            yield entry


def collect_installed_node_packages(root: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    installed: list[dict[str, Any]] = []
    scripts: list[dict[str, Any]] = []
    seen_paths: set[str] = set()

    for current, dirs, _files in os.walk(root, topdown=True, followlinks=False):
        dirs[:] = sorted(name for name in dirs if name not in PROJECT_EXCLUDED_DIRS)
        current_path = Path(current)
        if current_path.name != "node_modules":
            continue
        for package_dir in package_directories(current_path):
            package_json = package_dir / "package.json"
            payload = load_json(package_json)
            if payload is None:
                continue
            package_path = relpath(root, package_dir)
            if package_path in seen_paths:
                continue
            seen_paths.add(package_path)
            package_name = payload.get("name")
            version = payload.get("version")
            if not isinstance(package_name, str) or not isinstance(version, str):
                continue
            item = {
                "ecosystem": "node",
                "name": package_name,
                "version": version,
                "path": package_path,
                "resolved_path": str(package_dir.resolve()),
                "scope": "project",
                "private": bool(payload.get("private")),
                "has_bin": bool(payload.get("bin")),
            }
            installed.append(item)
            package_scripts = payload.get("scripts", {})
            if isinstance(package_scripts, dict):
                for key in NODE_LIFECYCLE_KEYS:
                    command = package_scripts.get(key)
                    if isinstance(command, str) and command.strip():
                        scripts.append(
                            {
                                "ecosystem": "node",
                                "name": package_name,
                                "version": version,
                                "path": package_path,
                                "hook": key,
                                "command": command,
                            }
                        )

    return installed, scripts


def scan_global_node_packages() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Read the global npm tree when explicitly requested; never install or execute."""

    try:
        result = subprocess.run(
            ["npm", "root", "-g"],
            check=False,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        return [], []
    if result.returncode != 0:
        return [], []
    global_root = Path(result.stdout.strip())
    if not global_root.is_dir():
        return [], []
    return collect_installed_node_packages(global_root.parent)


def summarize(values: list[dict[str, Any]], field: str) -> dict[str, int]:
    return dict(sorted(Counter(str(value.get(field, "unknown")) for value in values).items()))


def markdown_report(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# Dependency inventory",
        "",
        "This is a read-only inventory. It is not a vulnerability verdict; run the ecosystem advisory commands in the skill workflow.",
        "",
        f"- Project root: `{report['root']}`",
        f"- Dependency manifests: {len(report['manifests'])}",
        f"- Lockfiles: {len(report['lockfiles'])}",
        f"- Declared dependencies: {summary['declared_total']}",
        f"- Locked packages: {summary['locked_total']}",
        f"- Installed packages found: {summary['installed_total']}",
        f"- Install-time hooks found: {summary['install_script_total']}",
        "",
        "## Evidence files",
        "",
    ]
    for file in report["project_files"]:
        lines.append(f"- `{file}`")
    if not report["project_files"]:
        lines.append("- None found")

    if report["install_scripts"]:
        lines.extend(["", "## Install-time hooks", ""])
        for item in report["install_scripts"]:
            lines.append(
                f"- `{item['name']}@{item['version']}` `{item['hook']}` in `{item['path']}`: `{item['command']}`"
            )

    if report["warnings"]:
        lines.extend(["", "## Scan warnings", ""])
        lines.extend(f"- {warning}" for warning in report["warnings"])
    lines.extend(
        [
            "",
            "_Security scan by [11ai-security-dep-scan](https://ai.rj11.io/skills/11ai-security-dep-scan)._",
        ]
    )
    return "\n".join(lines) + "\n"


def build_report(root: Path, include_global: bool) -> dict[str, Any]:
    files = sorted(iter_project_files(root))
    declared, manifests = collect_node_manifests(root, files)
    other_declared, other_manifests = collect_other_manifests(root, files)
    declared.extend(other_declared)
    manifests.extend(other_manifests)
    locked, npm_lockfiles = collect_npm_lockfiles(root, files)
    locked.extend(collect_other_locked_dependencies(root, files))
    lockfiles = npm_lockfiles + collect_other_lockfiles(root, files)
    installed, scripts = collect_installed_node_packages(root)
    global_installed: list[dict[str, Any]] = []
    global_scripts: list[dict[str, Any]] = []
    if include_global:
        global_installed, global_scripts = scan_global_node_packages()
        for item in global_installed:
            item["scope"] = "global"
        for item in global_scripts:
            item["scope"] = "global"
        installed.extend(global_installed)
        scripts.extend(global_scripts)

    warnings: list[str] = []
    manifest_dirs = {Path(item["file"]).parent.as_posix() for item in manifests}
    lock_dirs = {Path(item["file"]).parent.as_posix() for item in lockfiles}
    for manifest_dir in sorted(manifest_dirs - lock_dirs):
        warnings.append(
            f"No recognized lockfile found beside manifest directory `{manifest_dir or '.'}`; exact resolved versions may be unavailable."
        )
    if not manifests and not lockfiles:
        warnings.append("No supported dependency manifest or lockfile was found.")
    if not installed:
        warnings.append("No installed Node package tree was found; installed-version evidence is incomplete.")

    return {
        "schema_version": 1,
        "root": ".",
        "project_files": [relpath(root, path) for path in files],
        "manifests": manifests,
        "lockfiles": lockfiles,
        "declared_dependencies": declared,
        "locked_dependencies": locked,
        "installed_packages": installed,
        "install_scripts": scripts,
        "warnings": warnings,
        "summary": {
            "declared_total": len(declared),
            "declared_by_kind": summarize(declared, "kind"),
            "declared_by_ecosystem": summarize(declared, "ecosystem"),
            "locked_total": len(locked),
            "locked_by_ecosystem": summarize(locked, "ecosystem"),
            "installed_total": len(installed),
            "installed_by_scope": summarize(installed, "scope"),
            "install_script_total": len(scripts),
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inventory project dependencies, lockfile versions, installed Node packages, and install hooks."
    )
    parser.add_argument("path", nargs="?", default=".", help="Project root to scan")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", help="Write the report to this path instead of stdout")
    parser.add_argument(
        "--include-global",
        action="store_true",
        help="Also inspect the global npm package tree; this is opt-in because it is host-wide evidence.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.path).expanduser().resolve()
    if not root.is_dir():
        print(f"Project root is not a directory: {root}", file=sys.stderr)
        return 2
    report = build_report(root, args.include_global)
    output = json.dumps(report, indent=2, sort_keys=True) + "\n" if args.format == "json" else markdown_report(report)
    if args.output:
        Path(args.output).expanduser().write_text(output, encoding="utf-8")
    else:
        sys.stdout.write(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
