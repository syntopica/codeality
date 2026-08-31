"""Recognise a string that is a SQL statement, not prose about one."""

import re

_NORMALISE = re.compile(r"\s+")
_SELECT = re.compile(r"\bselect\b(?P<columns>.+?)\bfrom\b\s+(?P<source>[\w.\"`\[]+)")
_OTHER_SHAPES = (
    re.compile(r"\binsert\s+into\b\s+[\w.\"`\[]+"),
    re.compile(r"\bupdate\b\s+[\w.\"`\[]+\s+set\b"),
    re.compile(r"\bdelete\s+from\b\s+[\w.\"`\[]+"),
    re.compile(r"\b(create|alter|drop)\s+(table|index|view|trigger)\b"),
)
_CLAUSES = re.compile(r"\b(where|join|group\s+by|order\s+by|having|limit|union|returning)\b")


def looks_like_sql(text: str) -> bool:
    """Return whether the text is a SQL statement.

    Substring matching would flag "Select an option from the menu below", so a
    SELECT needs a column list that reads as one - a star, a comma-separated
    list or a single identifier - or another SQL clause to back it up.
    """
    normalised = _NORMALISE.sub(" ", text).strip().lower()
    if any(shape.search(normalised) for shape in _OTHER_SHAPES):
        return True
    match = _SELECT.search(normalised)
    if match is None:
        return False
    return _CLAUSES.search(normalised) is not None or _is_column_list(match.group("columns"))


def _is_column_list(columns: str) -> bool:
    stripped = columns.strip()
    if not stripped:
        return False
    if "*" in stripped or "," in stripped:
        return True
    return len(stripped.split()) == 1
