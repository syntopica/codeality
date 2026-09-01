"""Read the suppression, if any, on one source line."""

import re

from baseline_py.suppression.build_suppression import build_suppression
from baseline_py.suppression.suppression import Suppression

_INLINE = re.compile(r"#\s*baseline-py:\s*ignore\[(?P<code>[A-Z]{3}\d{3})\]")
_FILE_WIDE = re.compile(
    r"#\s*baseline-py:\s*ignore-file\[(?P<code>[A-Z]{3}\d{3})\](?:\s*reason:\s*(?P<reason>.+))?"
)


def parse_suppression_line(line: str, number: int) -> tuple[Suppression | None, str | None]:
    """Return the suppression on this line, or a warning explaining why not."""
    file_wide = _FILE_WIDE.search(line)
    if file_wide is not None:
        reason = (file_wide.group("reason") or "").strip()
        if not reason:
            return None, f"line {number}: ignore-file requires 'reason: <why>'"
        return build_suppression(file_wide.group("code"), None, reason, number)
    inline = _INLINE.search(line)
    if inline is None:
        return None, None
    return build_suppression(inline.group("code"), number, None, number)
