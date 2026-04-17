#!/usr/bin/env python3
"""Validate that compression preserved protected markdown regions."""

from __future__ import annotations

import re
import sys
from pathlib import Path


URL_REGEX = re.compile(r"https?://[^\s)]+")
FENCE_OPEN_REGEX = re.compile(r"^(\s{0,3})(`{3,}|~{3,})(.*)$")
HEADING_REGEX = re.compile(r"^(#{1,6})\s+(.*)", re.MULTILINE)
PATH_REGEX = re.compile(
    r"(?:\./|\.\./|/|[A-Za-z]:\\)[\w\-/\\.@]+|[\w\-.]+[/\\][\w\-/\\.@]+"
)
INLINE_CODE_REGEX = re.compile(r"`[^`\n]+`")


def read_file(path: Path) -> str:
    return path.read_text()


def extract_headings(text: str) -> list[tuple[str, str]]:
    return [(level, title.strip()) for level, title in HEADING_REGEX.findall(text)]


def extract_code_blocks(text: str) -> list[str]:
    blocks: list[str] = []
    lines = text.split("\n")
    index = 0
    while index < len(lines):
        match = FENCE_OPEN_REGEX.match(lines[index])
        if not match:
            index += 1
            continue
        fence_char = match.group(2)[0]
        fence_len = len(match.group(2))
        block_lines = [lines[index]]
        index += 1
        closed = False
        while index < len(lines):
            close_match = FENCE_OPEN_REGEX.match(lines[index])
            if (
                close_match
                and close_match.group(2)[0] == fence_char
                and len(close_match.group(2)) >= fence_len
                and close_match.group(3).strip() == ""
            ):
                block_lines.append(lines[index])
                index += 1
                closed = True
                break
            block_lines.append(lines[index])
            index += 1
        if closed:
            blocks.append("\n".join(block_lines))
    return blocks


def fail(message: str) -> int:
    print(message, file=sys.stderr)
    return 1


def compare_sets(label: str, original: set[str], compressed: set[str]) -> list[str]:
    errors: list[str] = []
    if original != compressed:
        errors.append(f"{label} mismatch: lost={sorted(original - compressed)}, added={sorted(compressed - original)}")
    return errors


def main() -> int:
    if len(sys.argv) != 3:
        return fail("Usage: validate_markdown.py <original> <compressed>")

    original_path = Path(sys.argv[1]).resolve()
    compressed_path = Path(sys.argv[2]).resolve()
    original = read_file(original_path)
    compressed = read_file(compressed_path)

    errors: list[str] = []

    if extract_headings(original) != extract_headings(compressed):
        errors.append("heading mismatch")
    if extract_code_blocks(original) != extract_code_blocks(compressed):
        errors.append("code block mismatch")
    errors.extend(compare_sets("URL", set(URL_REGEX.findall(original)), set(URL_REGEX.findall(compressed))))
    errors.extend(compare_sets("path", set(PATH_REGEX.findall(original)), set(PATH_REGEX.findall(compressed))))
    errors.extend(compare_sets("inline code", set(INLINE_CODE_REGEX.findall(original)), set(INLINE_CODE_REGEX.findall(compressed))))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Validation passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
