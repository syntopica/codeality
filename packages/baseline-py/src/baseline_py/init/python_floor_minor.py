"""Read the minor version a project's ``requires-python`` floor names."""

import re

_FLOOR = re.compile(r">=\s*3\.(\d+)")


def python_floor_minor(requires_python: str) -> int | None:
    """Return the minor of a ``>=3.N`` floor, or None when there is no floor.

    Only the lower bound matters here: it decides which interpreters the CI
    matrix must cover and which syntax ruff may upgrade code to.
    """
    match = _FLOOR.search(requires_python)
    return None if match is None else int(match.group(1))
