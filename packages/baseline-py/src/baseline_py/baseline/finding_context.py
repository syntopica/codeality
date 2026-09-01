"""Describe what a finding is about, independently of where it sits."""

import re

_WHITESPACE = re.compile(r"\s+")


def finding_context(text: str, line: int) -> str:
    """Return the normalised source of the offending line.

    The line number itself must not enter a fingerprint - inserting a line
    above a violation would make every finding below it look new. The content
    of the offending line is stable under that edit and still tells two
    different violations in one file apart.
    """
    lines = text.splitlines()
    if not 1 <= line <= len(lines):
        return ""
    return _WHITESPACE.sub(" ", lines[line - 1]).strip()
