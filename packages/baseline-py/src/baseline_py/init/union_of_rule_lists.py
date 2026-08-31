"""Merge two rule lists without dropping either side."""

from collections.abc import Iterable


def union_of_rule_lists(
    existing: Iterable[str] | None, incoming: Iterable[str] | None
) -> list[str]:
    """Return the sorted union of two rule selections."""
    merged = {*(existing or ()), *(incoming or ())}
    return sorted(str(item) for item in merged)
