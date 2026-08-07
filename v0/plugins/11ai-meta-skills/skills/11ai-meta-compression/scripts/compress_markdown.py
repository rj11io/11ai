#!/usr/bin/env python3
"""Compress markdown/text prose while preserving technical regions."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


URL_RE = re.compile(r"https?://[^\s)]+")
PATH_RE = re.compile(
    r"(?:\./|\.\./|/|[A-Za-z]:\\)[\w\-/\\.@]+|[\w\-.]+[/\\][\w\-/\\.@]+"
)
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")
MD_LINK_RE = re.compile(r"\[[^\]]+\]\([^)]+\)")
HTML_COMMENT_RE = re.compile(r"<!--.*?-->")
WHITESPACE_RE = re.compile(r"\s+")

FILLER_PATTERNS = [
    (re.compile(r"\bin order to\b", re.IGNORECASE), "to"),
    (re.compile(r"\bmake sure to\b", re.IGNORECASE), ""),
    (re.compile(r"\byou should\b", re.IGNORECASE), ""),
    (re.compile(r"\bit is important to\b", re.IGNORECASE), ""),
    (re.compile(r"\bit is helpful to\b", re.IGNORECASE), ""),
    (re.compile(r"\bit might be worth\b", re.IGNORECASE), ""),
    (re.compile(r"\byou can\b", re.IGNORECASE), ""),
    (re.compile(r"\byou may\b", re.IGNORECASE), ""),
    (re.compile(r"\bplease\b", re.IGNORECASE), ""),
    (re.compile(r"\bjust\b", re.IGNORECASE), ""),
    (re.compile(r"\breally\b", re.IGNORECASE), ""),
    (re.compile(r"\bbasically\b", re.IGNORECASE), ""),
    (re.compile(r"\bactually\b", re.IGNORECASE), ""),
    (re.compile(r"\bsimply\b", re.IGNORECASE), ""),
    (re.compile(r"\bgenerally\b", re.IGNORECASE), ""),
    (re.compile(r"\bfurthermore\b", re.IGNORECASE), ""),
    (re.compile(r"\badditionally\b", re.IGNORECASE), ""),
    (re.compile(r"\bin addition\b", re.IGNORECASE), ""),
    (re.compile(r"\bthe reason is because\b", re.IGNORECASE), "because"),
    (re.compile(r"\bthat is\b", re.IGNORECASE), "is"),
]

ARTICLE_RE = re.compile(r"\b(a|an|the)\b\s*", re.IGNORECASE)
SPACE_BEFORE_PUNCT_RE = re.compile(r"\s+([,.;:!?])")
MULTI_PUNCT_RE = re.compile(r"([,.;:!?]){2,}")

UNCOMPRESSIBLE_EXTS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml", ".toml",
    ".env", ".lock", ".css", ".scss", ".html", ".xml", ".sql", ".sh", ".bash",
    ".zsh", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".hpp", ".rb", ".php",
    ".swift", ".kt", ".lua", ".ini", ".cfg",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compress markdown/text prose without external LLM calls."
    )
    parser.add_argument("path", help="Target markdown/text file")
    parser.add_argument("--in-place", action="store_true", dest="in_place")
    parser.add_argument("--backup", action="store_true")
    return parser.parse_args()


def should_compress(path: Path) -> bool:
    return path.suffix.lower() not in UNCOMPRESSIBLE_EXTS and path.is_file()


def protect_regions(text: str) -> tuple[str, dict[str, str]]:
    replacements: dict[str, str] = {}
    counter = 0

    def stash(match: re.Match[str]) -> str:
        nonlocal counter
        key = f"@@KEEP_{counter}@@"
        replacements[key] = match.group(0)
        counter += 1
        return key

    protected = text
    for pattern in (MD_LINK_RE, INLINE_CODE_RE, URL_RE, PATH_RE, HTML_COMMENT_RE):
        protected = pattern.sub(stash, protected)
    return protected, replacements


def restore_regions(text: str, replacements: dict[str, str]) -> str:
    restored = text
    for key, value in replacements.items():
        restored = restored.replace(key, value)
    return restored


def compress_sentence(text: str) -> str:
    compressed = text
    for pattern, replacement in FILLER_PATTERNS:
        compressed = pattern.sub(replacement, compressed)
    compressed = ARTICLE_RE.sub("", compressed)
    compressed = compressed.replace(" do not ", " avoid ")
    compressed = compressed.replace("Do not ", "Avoid ")
    compressed = compressed.replace(" does not ", " lacks ")
    compressed = compressed.replace(" rather than ", " not ")
    compressed = SPACE_BEFORE_PUNCT_RE.sub(r"\1", compressed)
    compressed = MULTI_PUNCT_RE.sub(r"\1", compressed)
    compressed = WHITESPACE_RE.sub(" ", compressed).strip()
    return compressed


def compress_prose(text: str) -> str:
    protected, replacements = protect_regions(text)
    compressed = compress_sentence(protected)
    compressed = restore_regions(compressed, replacements)
    return compressed.strip()


def compress_body(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    in_code = False
    fence = ""
    in_frontmatter = False

    if lines and lines[0].strip() == "---":
        in_frontmatter = True

    for index, line in enumerate(lines):
        stripped = line.strip()

        if in_frontmatter:
            out.append(line)
            if index > 0 and stripped == "---":
                in_frontmatter = False
            continue

        fence_match = re.match(r"^(\s*)(`{3,}|~{3,})(.*)$", line)
        if fence_match:
            marker = fence_match.group(2)
            if not in_code:
                in_code = True
                fence = marker[0] * len(marker)
            elif marker[0] == fence[0] and len(marker) >= len(fence):
                in_code = False
            out.append(line)
            continue

        if in_code or not stripped:
            out.append(line)
            continue

        if re.match(r"^#{1,6}\s+", line):
            out.append(line)
            continue

        if re.match(r"^\s*([-*+])\s+", line):
            prefix, body = re.match(r"^(\s*[-*+]\s+)(.*)$", line).groups()
            out.append(prefix + compress_prose(body))
            continue

        if re.match(r"^\s*\d+\.\s+", line):
            prefix, body = re.match(r"^(\s*\d+\.\s+)(.*)$", line).groups()
            out.append(prefix + compress_prose(body))
            continue

        if re.match(r"^\s*>\s?", line):
            prefix, body = re.match(r"^(\s*>\s?)(.*)$", line).groups()
            out.append(prefix + compress_prose(body))
            continue

        out.append(compress_prose(line))

    return "\n".join(out) + ("\n" if text.endswith("\n") else "")


def main() -> int:
    args = parse_args()
    path = Path(args.path).resolve()

    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        return 1
    if not should_compress(path):
        print(f"Refusing to compress non-guidance file: {path}", file=sys.stderr)
        return 2

    original = path.read_text()
    compressed = compress_body(original)

    if args.in_place:
        if args.backup:
            backup = path.with_name(path.stem + ".original" + path.suffix)
            if backup.exists():
                print(f"Backup already exists: {backup}", file=sys.stderr)
                return 3
            backup.write_text(original)
        path.write_text(compressed)
    else:
        sys.stdout.write(compressed)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
